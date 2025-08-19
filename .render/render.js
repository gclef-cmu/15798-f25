const fs = require("fs").promises;
const path = require("path");
const { marked } = require("marked");
const DOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const yaml = require("js-yaml");
const crypto = require("crypto");

const REPO_ROOT = process.cwd();
const RENDER_ROOT = path.join(REPO_ROOT, ".render");
const OUTPUT_ROOT = path.join(REPO_ROOT, "_site");

// ================================
// Markdown renderer configuration
// ================================
marked.setOptions({
    headerIds: true,
    mangle: false,
    gfm: true,
    breaks: true,
    tables: true,
    highlight: function (code, lang) {
        return `<pre class="language-${lang}"><code class="language-${lang}">${escapeHtml(
            code
        )}</code></pre>`;
    },
});

// ================================
// Helpers (no side effects)
// ================================
/* Escape special HTML characters in a string. */
function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Add id attributes to headings (simple deterministic slug)
function addHeadingIds(htmlContent) {
    const dom = new JSDOM(`<!DOCTYPE html><body>${htmlContent}</body>`);
    const document = dom.window.document;
    const used = new Set();
    function slugify(text) {
        return String(text || "")
            .toLowerCase()
            .replace(/<[^>]*>/g, "")
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    }
    document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
        const base = slugify(h.textContent);
        let id = base;
        let i = 1;
        while (id && used.has(id)) id = `${base}-${i++}`;
        if (id) {
            h.setAttribute("id", id);
            used.add(id);
        }
    });
    return document.body.innerHTML;
}

/* Recursively walk files under startDir (excluding hidden/system dirs) and invoke onFile for each file. */
async function walkFiles(startDir, onFile) {
    const excludeNames = new Set([
        ".git",
        ".github",
        ".render",
        "_site",
        "node_modules",
    ]);
    async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith(".")) continue;
            if (excludeNames.has(entry.name)) continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            } else if (entry.isFile()) {
                await onFile(fullPath);
            }
        }
    }
    await walk(startDir);
}

/* Collect absolute paths of .md files under startDir. */
async function findMarkdownFiles(startDir) {
    const results = [];
    await walkFiles(startDir, async (fullPath) => {
        if (/\.md$/i.test(fullPath)) results.push(fullPath);
    });
    return results;
}

/* Copy entire tree from startDir to outputDir, preserving structure. */
async function copyTree(startDir, outputDir) {
    await walkFiles(startDir, async (fullPath) => {
        const rel = path.relative(startDir, fullPath);
        const dest = path.join(outputDir, rel);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(fullPath, dest);
    });
}

/* Parse leading YAML frontmatter from markdown; returns {attributes, body}. */
function parseYamlFrontmatter(md) {
    const m = String(md).match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!m) return { attributes: {}, body: String(md) };
    let attributes = {};
    try {
        attributes = yaml.load(m[1]) || {};
    } catch {
        attributes = {};
    }
    const body = String(md).slice(m[0].length);
    return { attributes, body };
}

/* Extract the first H1 heading text from markdown or throw if none. */
function parseFirstH1(md) {
    const m = String(md).match(/^\s{0,3}#\s+(.+)$/m);
    if (!m) throw new Error("No H1 header found");
    return m[1].trim();
}

// ================================
// Simplified path handling
// ================================
/*
Map a source .md path to its output HTML file path. Examples:

- README.md -> _site/index.html (home page)
- foo.md -> _site/foo/index.html
- foo/index.md -> _site/foo/index.html
- foo/bar.md -> _site/foo/bar/index.html
- foo/bar/index.md -> _site/foo/bar/index.html
*/
function computeOutputHtmlPath(mdPath, homeMdBasename) {
    const rel = path.relative(REPO_ROOT, mdPath);
    const base = path.basename(rel);
    const dir = path.dirname(rel);

    // Home page special cases
    // - Configured home page
    // - Conventional root README.md
    if (dir === "." && (base === homeMdBasename || base === "README.md")) {
        return path.join(OUTPUT_ROOT, "index.html");
    }

    // 404 page special case at repo root
    if (dir === "." && base === "404.md") {
        return path.join(OUTPUT_ROOT, "404.html");
    }

    // Index.md special case
    if (base === "index.md") {
        return path.join(OUTPUT_ROOT, dir, "index.html");
    }

    // Everything else becomes dir/name/index.html
    const name = base.replace(/\.md$/i, "");
    return path.join(
        OUTPUT_ROOT,
        dir === "." ? name : path.join(dir, name),
        "index.html"
    );
}

/*
Rewrite links/resources in rendered HTML (KISS):
- Leave hrefs and their anchors as-authored (no slug normalization, no .md rewriting)
- Rebase asset src paths relative to the output page directory
- Skip external links and mailto/tel
*/
function rebaseAssetSrcPaths(htmlContent, sourceMdPath, currentOutPath) {
    const dom = new JSDOM(`<!DOCTYPE html><body>${htmlContent}</body>`);
    const document = dom.window.document;
    const sourceDir = path.dirname(sourceMdPath);
    const currentDir = path.dirname(currentOutPath);

    document
        .querySelectorAll(
            "a[href], img[src], video[src], audio[src], source[src], link[href], script[src]"
        )
        .forEach((el) => {
            const isHref = el.hasAttribute("href");
            const attr = isHref ? "href" : "src";
            const raw = el.getAttribute(attr);
            if (typeof raw !== "string" || raw.length === 0) return;

            // Skip external links
            if (/^(https?:)?\/\//i.test(raw)) return;
            if (/^(mailto:|tel:)/i.test(raw)) return;

            // Keep pure anchors as-authored
            if (raw.startsWith("#")) return;

            // Split into [path+query] and [hash]
            const hashIndex = raw.indexOf("#");
            const baseAndQuery = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
            const anchorPart = hashIndex >= 0 ? raw.slice(hashIndex + 1) : "";

            // Further split base into [path] and [query]
            const qIndex = baseAndQuery.indexOf("?");
            let pathPart =
                qIndex >= 0 ? baseAndQuery.slice(0, qIndex) : baseAndQuery;
            const queryPart = qIndex >= 0 ? baseAndQuery.slice(qIndex) : "";

            // Adjust paths
            if (!isHref) {
                // For assets: rebase relative to output location
                // Resolve asset absolute path based on source markdown file location
                const assetAbs = path.resolve(sourceDir, decodeURI(pathPart));
                const assetRelFromRepo = path.relative(REPO_ROOT, assetAbs);
                const assetOutPath = path.join(OUTPUT_ROOT, assetRelFromRepo);
                // Compute path from current output dir to the asset's output path
                pathPart = path
                    .relative(currentDir, assetOutPath)
                    .split(path.sep)
                    .join("/");
            }

            // Reconstruct without modifying the anchor
            const hash = anchorPart ? "#" + anchorPart : "";
            let newValue = pathPart + queryPart + hash;
            if (newValue === "" && isHref) newValue = ".";

            el.setAttribute(attr, newValue);
        });

    return document.body.innerHTML;
}

/* Copy template stylesheet to versioned asset path (content-hash) and return its destination path. */
async function copyStylesheet() {
    const src = path.join(RENDER_ROOT, "template", "style.css");
    const outDir = path.join(OUTPUT_ROOT, "assets");
    await fs.mkdir(outDir, { recursive: true });

    const css = await fs.readFile(src);
    const hash = crypto
        .createHash("sha1")
        .update(css)
        .digest("hex")
        .slice(0, 8);
    const dest = path.join(outDir, `style.${hash}.css`);
    await fs.writeFile(dest, css);
    return dest;
}

// ================================
// Simplified nav handling
// ================================
/*
Build nav items strictly from config.nav using { Title: "href" } mapping:
- href: external URL (http/https, mailto, tel) or .md file path
- title: used as-is
*/
async function buildNavItems(config, homeMdBasename) {
    const results = [];
    for (const item of config.nav) {
        if (!item || typeof item !== "object") {
            throw new Error(
                'config.nav items must be objects like { Title: "href" }'
            );
        }

        const title = Object.keys(item)[0];
        const href = item[title];

        if (typeof title !== "string" || !title.trim()) {
            throw new Error("config.nav item is missing a non-empty title key");
        }
        if (typeof href !== "string" || !href.trim()) {
            throw new Error(
                `config.nav item '${title}' is missing a non-empty href value`
            );
        }

        // External links
        if (/^(https?:)?\/\//i.test(href) || /^(mailto:|tel:)/i.test(href)) {
            results.push({ type: "external", href, title });
            continue;
        }

        // Internal markdown files only
        if (/\.md$/i.test(href)) {
            const mdPath = path.join(REPO_ROOT, href);
            results.push({
                type: "internal",
                mdPath,
                title,
                outPath: computeOutputHtmlPath(mdPath, homeMdBasename),
            });
            continue;
        }

        throw new Error(
            `config.nav item '${title}' has unsupported href '${href}'. Use a .md file path or an external URL.`
        );
    }

    return results;
}

/* Render the site navigation HTML using the nav template. */
function buildNavHtml(
    navItems,
    currentOutPath,
    siteTitle,
    homeOutPath,
    navTemplate
) {
    const currentDir = path.dirname(currentOutPath);
    const homeHref =
        path
            .relative(currentDir, homeOutPath)
            .split(path.sep)
            .join("/")
            .replace(/(?:^|\/)index\.html$/, "") || ".";

    const links = navItems.map((item) => {
        if (item.type === "external") {
            return `<a href="${escapeHtml(
                item.href
            )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                item.title
            )}</a>`;
        }

        let href =
            path
                .relative(currentDir, item.outPath)
                .split(path.sep)
                .join("/")
                .replace(/(?:^|\/)index\.html$/, "") || ".";

        return `<a href="${href}">${escapeHtml(item.title)}</a>`;
    });

    const titleHtml = `<a href="${homeHref}" class="site-title">${escapeHtml(
        siteTitle
    )}</a>`;

    return navTemplate
        .replace("{{TITLE_HTML}}", titleHtml)
        .replace("{{LINKS_HTML}}", links.join(" "));
}

// ================================
// Main rendering
// ================================
/* Load and validate .render/config.yml; fills defaults and ensures required keys. */
async function loadConfig() {
    const configPath = path.join(REPO_ROOT, ".render", "config.yml");
    const raw = await fs.readFile(configPath, "utf-8");
    const cfg = yaml.load(raw) || {};

    if (!cfg.site_title) throw new Error("Missing site_title in config");
    if (!cfg.home_md) throw new Error("Missing home_md in config");
    if (!Array.isArray(cfg.nav)) cfg.nav = [];

    return cfg;
}

/*
Render a single markdown file to an HTML page:
- Parses frontmatter and title
- Converts markdown to sanitized HTML
- Rewrites links and injects nav/stylesheet into the template
- Writes the final HTML to the computed output path
*/
async function renderPage(mdPath, ctx) {
    const { template, purify, navItems, stylesheet, config, navTemplate } = ctx;
    const homeMdBasename = path.basename(config.home_md);

    // Parse markdown
    const raw = await fs.readFile(mdPath, "utf-8");
    const { attributes: frontmatter, body } = parseYamlFrontmatter(raw);

    // Convert to HTML
    let html = marked(body);

    // Configure DOMPurify to preserve IDs on headings
    html = purify.sanitize(html, {
        ADD_TAGS: ["iframe", "video", "audio", "source"],
        ADD_ATTR: [
            "target",
            "rel",
            "frameborder",
            "allowfullscreen",
            "autoplay",
            "controls",
        ],
        ALLOW_DATA_ATTR: true,
        // Allow ID attribute on all elements (especially headings)
        ALLOWED_ATTR: [
            "href",
            "title",
            "id",
            "class",
            "src",
            "alt",
            "target",
            "rel",
            "frameborder",
            "allowfullscreen",
            "autoplay",
            "controls",
            "width",
            "height",
        ],
    });

    // Compute current page output path to correctly rebase assets
    const pageOut = computeOutputHtmlPath(mdPath, homeMdBasename);

    // Add heading ids and rebase asset src paths
    html = addHeadingIds(html);
    html = rebaseAssetSrcPaths(html, mdPath, pageOut);

    // Extract title with priority: frontmatter.title -> first H1 -> config.site_title
    let title;
    if (
        frontmatter &&
        typeof frontmatter.title === "string" &&
        frontmatter.title.trim()
    ) {
        title = String(frontmatter.title).trim();
    } else {
        try {
            title = parseFirstH1(body);
        } catch {
            title = config.site_title;
        }
    }

    // Extract description with priority: frontmatter.description -> title
    let description;
    if (
        frontmatter &&
        typeof frontmatter.description === "string" &&
        frontmatter.description.trim()
    ) {
        description = String(frontmatter.description).trim();
    } else {
        description = title;
    }

    // Build nav
    const homeOut = computeOutputHtmlPath(
        path.join(REPO_ROOT, config.home_md),
        homeMdBasename
    );
    const nav = buildNavHtml(
        navItems,
        pageOut,
        config.site_title,
        homeOut,
        navTemplate
    );

    // Get stylesheet path
    const stylePath = path
        .relative(path.dirname(pageOut), stylesheet)
        .split(path.sep)
        .join("/");

    // Build final HTML
    const finalHtml = template
        .replace("{{TITLE}}", escapeHtml(title))
        .replace("{{DESCRIPTION}}", escapeHtml(description))
        .replace("{{NAV}}", nav)
        .replace("{{STYLESHEET_HREF}}", stylePath)
        .replace("{{CONTENT}}", html);

    // Write file
    await fs.mkdir(path.dirname(pageOut), { recursive: true });
    await fs.writeFile(pageOut, finalHtml);

    console.log(
        `✅ ${path.relative(REPO_ROOT, mdPath)} -> ${path.relative(
            REPO_ROOT,
            pageOut
        )}`
    );
}

// (Removed helper; 404 is now rendered from 404.md like any other page)

/*
End-to-end site build:
- Loads template/config, copies stylesheet, builds nav, copies static files
- Renders all markdown files into the output directory
*/
async function buildSite() {
    // Load everything
    const template = await fs.readFile(
        path.join(RENDER_ROOT, "template", "index.html"),
        "utf-8"
    );
    const navTemplate = await fs.readFile(
        path.join(RENDER_ROOT, "template", "nav.html"),
        "utf-8"
    );
    const config = await loadConfig();
    const stylesheet = await copyStylesheet();
    const navItems = await buildNavItems(config, path.basename(config.home_md));
    const purify = DOMPurify(new JSDOM("").window);

    // Copy static files
    await copyTree(REPO_ROOT, OUTPUT_ROOT);

    // Render all markdown
    const mdFiles = await findMarkdownFiles(REPO_ROOT);
    for (const mdPath of mdFiles) {
        await renderPage(mdPath, {
            template,
            purify,
            navItems,
            stylesheet,
            config,
            navTemplate,
        });
    }

    console.log(`📁 Output: ${OUTPUT_ROOT}`);

    // 404 will be generated from root 404.md if present
}

buildSite();

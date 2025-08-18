const fs = require("fs").promises;
const path = require("path");
const { marked } = require("marked");
const DOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const yaml = require("js-yaml");

// ----------------------------------------
// Markdown renderer configuration
// ----------------------------------------
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

// ----------------------------------------
// Helpers (pure or side-effect isolated)
// ----------------------------------------
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

async function loadConfig(repoRoot) {
    const configPath = path.join(repoRoot, "render", "config.yml");
    const raw = await fs.readFile(configPath, "utf-8");
    const cfg = yaml.load(raw) || {};
    if (typeof cfg.site_title !== "string") {
        throw new Error(
            "render/config.yml missing required string: site_title"
        );
    }
    if (typeof cfg.home_md !== "string") {
        throw new Error("render/config.yml missing required string: home_md");
    }
    if (!Array.isArray(cfg.nav)) {
        throw new Error(
            "render/config.yml missing required array: nav (can be empty)"
        );
    }
    return cfg;
}

async function readFirstH1(mdAbsPath) {
    const raw = await fs.readFile(mdAbsPath, "utf-8");
    const m = raw.match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : null;
}

async function findMarkdownFilesRecursively(startDir) {
    const results = [];
    const excludeNames = new Set(["node_modules", ".git", "_site"]);

    async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (excludeNames.has(entry.name)) continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
                results.push(fullPath);
            }
        }
    }

    await walk(startDir);
    return results;
}

function computeOutputHtmlPath(mdPath, repoRoot, outputRoot, homeMdBasename) {
    const rel = path.relative(repoRoot, mdPath);
    const base = path.basename(rel);
    const dir = path.dirname(rel);
    let outName;
    if (base.toLowerCase() === homeMdBasename.toLowerCase() && dir === ".") {
        outName = "index.html";
    } else if (base.toLowerCase() === "readme.md" && dir !== ".") {
        outName = "index.html";
    } else {
        outName = base.replace(/\.md$/i, ".html");
    }
    return path.join(outputRoot, dir === "." ? "" : dir, outName);
}

function toRelativeHref(fromDir, toFile) {
    let rel = path.relative(fromDir, toFile).split(path.sep).join("/");
    if (rel === "") rel = "index.html";
    return rel;
}

function rewriteLinksHtml(
    htmlContent,
    sourceMdPath,
    repoRoot,
    outputRoot,
    homeMdBasename
) {
    const dom = new JSDOM(`<!DOCTYPE html><body>${htmlContent}</body>`);
    const document = dom.window.document;
    const anchors = document.querySelectorAll("a[href]");
    const sourceOutDir = path.dirname(
        computeOutputHtmlPath(
            sourceMdPath,
            repoRoot,
            outputRoot,
            homeMdBasename
        )
    );

    anchors.forEach((a) => {
        const rawHref = a.getAttribute("href");
        if (!rawHref) return;
        if (/^(https?:)?\/\//i.test(rawHref)) return; // external
        if (/^(mailto:|tel:)/i.test(rawHref)) return;
        if (rawHref.startsWith("#")) return; // hash only

        const hashIndex = rawHref.indexOf("#");
        const baseHref = hashIndex >= 0 ? rawHref.slice(0, hashIndex) : rawHref;
        const hash = hashIndex >= 0 ? rawHref.slice(hashIndex) : "";

        // Only rewrite .md links
        if (!/\.md$/i.test(baseHref)) return;

        const resolvedTarget = path.resolve(
            path.dirname(sourceMdPath),
            decodeURI(baseHref)
        );
        const targetHtmlPath = computeOutputHtmlPath(
            resolvedTarget,
            repoRoot,
            outputRoot,
            homeMdBasename
        );
        const relativeHref =
            toRelativeHref(sourceOutDir, targetHtmlPath) + hash;
        a.setAttribute("href", relativeHref);
    });

    return document.body.innerHTML;
}

async function copyStylesheet(repoRoot, outputRoot) {
    const src = path.join(repoRoot, "render", "style.css");
    const dest = path.join(outputRoot, "assets", "style.css");
    await fs.mkdir(path.dirname(dest), { recursive: true });
    try {
        const css = await fs.readFile(src);
        await fs.writeFile(dest, css);
        return dest;
    } catch {
        return null; // optional stylesheet
    }
}

async function readTemplate(repoRoot) {
    const templatePath = path.join(repoRoot, "render", "index.html");
    return fs.readFile(templatePath, "utf-8");
}

function buildConfiguredTitleMap(nav) {
    const byBase = {};
    for (const item of nav) {
        if (item && typeof item === "object") {
            const key = Object.keys(item)[0];
            byBase[path.basename(key)] = String(item[key]);
        }
    }
    return byBase;
}

async function buildNavItems(config, repoRoot, outputRoot, homeMdBasename) {
    // Build navigation model from config.nav only (no inference)
    const items = await Promise.all(
        config.nav
            .map((item) => {
                if (typeof item === "string")
                    return { file: item, title: null };
                if (item && typeof item === "object") {
                    const key = Object.keys(item)[0];
                    return { file: key, title: item[key] };
                }
                return null;
            })
            .filter(Boolean)
            .map(async (entry) => {
                const mdPath = path.join(repoRoot, entry.file);
                let title = entry.title
                    ? String(entry.title)
                    : (await readFirstH1(mdPath)) ||
                      (path.basename(mdPath).toLowerCase() ===
                          homeMdBasename.toLowerCase() &&
                      path.dirname(mdPath) === repoRoot
                          ? "Home"
                          : path.basename(mdPath).replace(/\.md$/i, ""));
                return {
                    mdPath,
                    title,
                    outPath: computeOutputHtmlPath(
                        mdPath,
                        repoRoot,
                        outputRoot,
                        homeMdBasename
                    ),
                };
            })
    );
    return items;
}

function buildNavHtml(
    navItems,
    currentOutDir,
    siteTitle,
    homeOutPathAbsolute,
    navTitleColor
) {
    const links = navItems.map((item) => {
        const href = toRelativeHref(currentOutDir, item.outPath);
        return `<a href="${href}" style="margin-right:12px;">${escapeHtml(
            item.title
        )}</a>`;
    });
    const homeHref = toRelativeHref(currentOutDir, homeOutPathAbsolute);
    const titleStyle = navTitleColor
        ? ` style="color:${escapeHtml(navTitleColor)}"`
        : "";
    const titleHtml = siteTitle
        ? `<a href="${homeHref}" class="site-title"${titleStyle}>${escapeHtml(
              siteTitle
          )}</a>`
        : "";
    return `
<nav class="site-nav">
  <div class="container">
    <div class="inner">${titleHtml}<span class="site-links">${links.join(
        " "
    )}</span></div>
  </div>
</nav>
`;
}

function computePageTitle(
    mdPath,
    markdownContent,
    repoRoot,
    homeMdBasename,
    configuredTitleByBase
) {
    const base = path.basename(mdPath);
    if (configuredTitleByBase[base]) return configuredTitleByBase[base];
    const h1Match = markdownContent.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1].trim();
    if (
        path.dirname(mdPath) === repoRoot &&
        base.toLowerCase() === homeMdBasename.toLowerCase()
    ) {
        return "Home";
    }
    return base.replace(/\.md$/i, "");
}

function extractDescription(htmlContent) {
    const descMatch = htmlContent.match(/<p>(.+?)<\/p>/);
    return descMatch
        ? descMatch[1].replace(/<[^>]*>/g, "").substring(0, 160)
        : "Documentation";
}

// ----------------------------------------
// Main flow
// ----------------------------------------
async function renderPage(mdPath, ctx) {
    const {
        repoRoot,
        outputRoot,
        templateContent,
        purify,
        homeMdBasename,
        navItems,
        siteTitle,
        navTitleColor,
        stylesheetOut,
        configuredTitleByBase,
        homeOutPathAbsolute,
    } = ctx;

    const markdownContent = await fs.readFile(mdPath, "utf-8");

    // Convert and sanitize
    let htmlContent = marked(markdownContent);
    htmlContent = purify.sanitize(htmlContent, {
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
    });

    // Rewrite .md links
    htmlContent = rewriteLinksHtml(
        htmlContent,
        mdPath,
        repoRoot,
        outputRoot,
        homeMdBasename
    );

    // Metadata
    const title = computePageTitle(
        mdPath,
        markdownContent,
        repoRoot,
        homeMdBasename,
        configuredTitleByBase
    );
    const description = extractDescription(htmlContent);

    // Paths and nav
    const pageOutputPath = computeOutputHtmlPath(
        mdPath,
        repoRoot,
        outputRoot,
        homeMdBasename
    );
    const navHtml = navItems.length
        ? buildNavHtml(
              navItems,
              path.dirname(pageOutputPath),
              siteTitle,
              homeOutPathAbsolute,
              navTitleColor || null
          )
        : "";

    const stylesheetHref = stylesheetOut
        ? toRelativeHref(path.dirname(pageOutputPath), stylesheetOut).replace(
              /\\/g,
              "/"
          )
        : "";

    const finalHtml = templateContent
        .replace("{{TITLE}}", escapeHtml(title))
        .replace("{{DESCRIPTION}}", escapeHtml(description))
        .replace("{{NAV}}", navHtml)
        .replace("{{STYLESHEET_HREF}}", stylesheetHref)
        .replace("{{CONTENT}}", htmlContent);

    await fs.mkdir(path.dirname(pageOutputPath), { recursive: true });
    await fs.writeFile(pageOutputPath, finalHtml);

    console.log(
        `✅ Built: ${path.relative(repoRoot, mdPath)} -> ${path.relative(
            repoRoot,
            pageOutputPath
        )}`
    );
}

async function buildSite() {
    const repoRoot = process.cwd();
    const outputRoot = path.join(repoRoot, "_site");
    const templateContent = await readTemplate(repoRoot);
    const config = await loadConfig(repoRoot);
    const homeMdBasename = path.basename(config.home_md);

    // Assets and inputs
    const stylesheetOut = await copyStylesheet(repoRoot, outputRoot);
    const allMarkdownFiles = await findMarkdownFilesRecursively(repoRoot);

    // Nav
    const navItems = await buildNavItems(
        config,
        repoRoot,
        outputRoot,
        homeMdBasename
    );
    const configuredTitleByBase = buildConfiguredTitleMap(config.nav);
    const homeAbs = path.join(repoRoot, config.home_md);
    const homeOutPathAbsolute = computeOutputHtmlPath(
        homeAbs,
        repoRoot,
        outputRoot,
        homeMdBasename
    );

    // Sanitizer
    const purify = DOMPurify(new JSDOM("").window);

    // Render all pages
    for (const mdPath of allMarkdownFiles) {
        await renderPage(mdPath, {
            repoRoot,
            outputRoot,
            templateContent,
            purify,
            homeMdBasename,
            navItems,
            siteTitle: config.site_title,
            navTitleColor: config.nav_title_color,
            stylesheetOut,
            configuredTitleByBase,
            homeOutPathAbsolute,
        });
    }

    console.log("📁 Output directory:", outputRoot);
    if (navItems.length) {
        console.log(
            "🧭 Pages in nav:",
            navItems.map((n) => n.title).join(", ")
        );
    } else {
        console.log("🧭 No nav configured");
    }
}

// ----------------------------------------
// Execute
// ----------------------------------------
buildSite();

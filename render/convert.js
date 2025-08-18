const fs = require("fs").promises;
const path = require("path");
const { marked } = require("marked");
const DOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

// Configure marked options
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

async function convertAllMarkdownToHtml() {
    try {
        const repoRoot = process.cwd();
        const outputRoot = path.join(repoRoot, "_site");
        const templatePath = path.join(repoRoot, "render", "index.html");
        const templateContent = await fs.readFile(templatePath, "utf-8");

        const allMarkdownFiles = await findMarkdownFilesRecursively(repoRoot);
        const rootMarkdownFiles = allMarkdownFiles.filter(
            (p) => path.dirname(p) === repoRoot
        );

        // Build navigation model from root-level markdown files only
        const navItems = rootMarkdownFiles
            .map((mdPath) => ({
                mdPath,
                title: computePageTitle(mdPath, repoRoot),
                outPath: computeOutputHtmlPath(mdPath, repoRoot, outputRoot),
            }))
            // Ensure Home (README.md) is first, then alphabetical
            .sort((a, b) => {
                const aIsHome =
                    path.basename(a.mdPath).toLowerCase() === "readme.md";
                const bIsHome =
                    path.basename(b.mdPath).toLowerCase() === "readme.md";
                if (aIsHome && !bIsHome) return -1;
                if (bIsHome && !aIsHome) return 1;
                return a.title.localeCompare(b.title);
            });

        // Prepare DOMPurify
        const purifyWindow = new JSDOM("").window;
        const purify = DOMPurify(purifyWindow);

        // Process each markdown file
        for (const mdPath of allMarkdownFiles) {
            const markdownContent = await fs.readFile(mdPath, "utf-8");

            // Convert markdown to HTML
            let htmlContent = marked(markdownContent);

            // Sanitize
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

            // Rewrite links (.md -> .html) and preserve relative correctness
            htmlContent = rewriteLinksHtml(
                htmlContent,
                mdPath,
                repoRoot,
                outputRoot
            );

            // Compute metadata
            const title = computePageTitle(mdPath, repoRoot);
            const description = extractDescription(htmlContent);

            // Build navigation HTML (relative to this page's output dir)
            const pageOutputPath = computeOutputHtmlPath(
                mdPath,
                repoRoot,
                outputRoot
            );
            const navHtml = buildNavHtml(
                navItems,
                path.dirname(pageOutputPath)
            );

            // Compose final HTML using template
            const finalHtml = templateContent
                .replace("{{TITLE}}", escapeHtml(title))
                .replace("{{DESCRIPTION}}", escapeHtml(description))
                .replace("{{CONTENT}}", navHtml + htmlContent);

            // Ensure directory and write file
            await fs.mkdir(path.dirname(pageOutputPath), { recursive: true });
            await fs.writeFile(pageOutputPath, finalHtml);

            console.log(
                `✅ Built: ${path.relative(
                    repoRoot,
                    mdPath
                )} -> ${path.relative(repoRoot, pageOutputPath)}`
            );
        }

        console.log("📁 Output directory:", outputRoot);
        console.log(
            "🧭 Pages in nav:",
            navItems.map((n) => n.title).join(", ")
        );
    } catch (error) {
        console.error("❌ Error converting markdown:", error);
        process.exit(1);
    }
}

function extractDescription(htmlContent) {
    const descMatch = htmlContent.match(/<p>(.+?)<\/p>/);
    return descMatch
        ? descMatch[1].replace(/<[^>]*>/g, "").substring(0, 160)
        : "Documentation";
}

function toTitleCase(text) {
    return text
        .replace(/[\-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function computePageTitle(mdPath, repoRoot) {
    const isRoot = path.dirname(mdPath) === repoRoot;
    const base = path.basename(mdPath);
    if (isRoot && base.toLowerCase() === "readme.md") {
        return "Home";
    }
    const nameWithoutExt = base.replace(/\.md$/i, "");
    return toTitleCase(nameWithoutExt);
}

function computeOutputHtmlPath(mdPath, repoRoot, outputRoot) {
    const rel = path.relative(repoRoot, mdPath);
    const base = path.basename(rel);
    const dir = path.dirname(rel);
    let outName;
    if (base.toLowerCase() === "readme.md") {
        outName = "index.html";
    } else {
        outName = base.replace(/\.md$/i, ".html");
    }
    return path.join(outputRoot, dir === "." ? "" : dir, outName);
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

function buildNavHtml(navItems, currentOutDir) {
    const links = navItems.map((item) => {
        const href = toRelativeHref(currentOutDir, item.outPath);
        return `<a href="${href}" style="margin-right:12px;">${escapeHtml(
            item.title
        )}</a>`;
    });
    return `
<nav style="position:sticky;top:0;z-index:10;background:var(--header-bg);border-bottom:1px solid var(--border-color);">
  <div class="container" style="padding-top:12px;padding-bottom:12px;">
    ${links.join(" ")}
  </div>
</nav>
`;
}

function toRelativeHref(fromDir, toFile) {
    let rel = path.relative(fromDir, toFile).split(path.sep).join("/");
    if (rel === "") rel = "index.html";
    return rel;
}

function rewriteLinksHtml(htmlContent, sourceMdPath, repoRoot, outputRoot) {
    const dom = new JSDOM(`<!DOCTYPE html><body>${htmlContent}</body>`);
    const document = dom.window.document;
    const anchors = document.querySelectorAll("a[href]");
    const sourceOutDir = path.dirname(
        computeOutputHtmlPath(sourceMdPath, repoRoot, outputRoot)
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
            outputRoot
        );
        const relativeHref =
            toRelativeHref(sourceOutDir, targetHtmlPath) + hash;
        a.setAttribute("href", relativeHref);
    });

    return document.body.innerHTML;
}

// Run the conversion
convertAllMarkdownToHtml();

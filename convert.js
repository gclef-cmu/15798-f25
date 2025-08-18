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
        // Basic syntax highlighting wrapper
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

async function convertReadmeToHtml() {
    try {
        // Read the README.md file
        const readmePath = path.join(process.cwd(), "README.md");
        const readmeContent = await fs.readFile(readmePath, "utf-8");

        // Read the HTML template
        const templatePath = path.join(process.cwd(), "index.html");
        const templateContent = await fs.readFile(templatePath, "utf-8");

        // Convert markdown to HTML (allows HTML pass-through)
        let htmlContent = marked(readmeContent);

        // Create a JSDOM instance for DOMPurify
        const window = new JSDOM("").window;
        const purify = DOMPurify(window);

        // Sanitize HTML while allowing safe tags and attributes
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

        // Extract the first h1 for the title, or use repo name
        const titleMatch = readmeContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : "README";

        // Extract description from first paragraph
        const descMatch = htmlContent.match(/<p>(.+?)<\/p>/);
        const description = descMatch
            ? descMatch[1].replace(/<[^>]*>/g, "").substring(0, 160)
            : "Documentation";

        // Replace placeholders in template
        let finalHtml = templateContent
            .replace("{{TITLE}}", escapeHtml(title))
            .replace("{{DESCRIPTION}}", escapeHtml(description))
            .replace("{{CONTENT}}", htmlContent);

        // Write the output file
        const outputPath = path.join(process.cwd(), "_site", "index.html");
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, finalHtml);

        console.log("✅ Successfully converted README.md to HTML");
        console.log(`📄 Title: ${title}`);
        console.log(`📝 Description: ${description}`);
        console.log(`📁 Output: ${outputPath}`);
    } catch (error) {
        console.error("❌ Error converting README:", error);
        process.exit(1);
    }
}

// Run the conversion
convertReadmeToHtml();

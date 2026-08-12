const fs = require("fs");
const path = require("path");

const templatesDir = path.join(__dirname, "..", "templates");

// Renders an HTML email template, replacing {{placeholder}} tokens
const renderTemplate = (templateName, variables = {}) => {
    const filePath = path.join(templatesDir, `${templateName}.html`);
    let html = fs.readFileSync(filePath, "utf8");

    for (const [key, value] of Object.entries(variables)) {
        html = html.split(`{{${key}}}`).join(String(value));
    }

    return html;
};

module.exports = renderTemplate;

const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync("data/output.json", "utf-8"));

const outputDir = path.join(__dirname, "static_site");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const cssContent = `
html { background-color: #f3f3f3;}
body { background-color: white; max-width: 600px; margin: 16px auto; padding: 32px; border-radius: 10px;}
img { max-width: 200px; height: fit-content; outline: 1px solid #eee}
.gallery { display: flex; flex-wrap: wrap; gap: 10px; }
.back-button { text-decoration: none }
`;

fs.writeFileSync(path.join(outputDir, "styles.css"), cssContent, "utf-8");

/**
 * Sanitizes a name for use as a directory or filename.
 */
function sanitizeFilename(name) {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .trim();
}

/**
 * Generates an HTML page, ensuring the directory exists.
 */
function generatePage(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Generates a "Back" button.
 * @param {string} backPath - Path to navigate one level up.
 */
function backButton(backPath) {
    return `<a href="${backPath}" style="display:block; margin-bottom:10px;">⬅ Back</a>`;
}

/**
 * Template for the index page.
 */
function indexTemplate(areas) {
    return `
    <html>
      <head>
      <title>Climbing Areas</title>
      <link rel="stylesheet" href="styles.css">
      </head>
      <body>
        <h1>Climbing Areas</h1>
        <ul>
          ${areas
              .map(
                  (area) =>
                      `<li><a href="${sanitizeFilename(
                          area.name
                      )}/index.html">${area.name}</a></li>`
              )
              .join("\n")}
        </ul>
      </body>
    </html>`;
}

/**
 * Template for an area page.
 */
function areaTemplate(area) {
    return `
    <html>
      <head><title>${area.name}</title>
      <link rel="stylesheet" href="../styles.css">
      </head>
      <body>
        ${backButton("../index.html")}
        <h1>${area.name}</h1>
        <p>${area.description || "No description available."}</p>
        <p><a href="${
            area.mapsLink
        }" target="_blank">View on Google Maps</a></p>
        
        ${
            area.sectors.length > 0
                ? `<h2>Sectors</h2><ul>` +
                  area.sectors
                      .map(
                          (sector) =>
                              `<li><a href="${sanitizeFilename(
                                  sector.name
                              )}/index.html">${sector.name}</a></li>`
                      )
                      .join("\n") +
                  "</ul>"
                : ""
        }
        
        ${
            area.problems.length > 0
                ? `<h2>Problems</h2><ul>` +
                  area.problems
                      .map(
                          (problem) =>
                              `<li><a href="${sanitizeFilename(
                                  problem.name
                              )}.html">${problem.name} (${
                                  problem.grade
                              })</a></li>`
                      )
                      .join("\n") +
                  "</ul>"
                : ""
        }

                
        ${
            area.images.length > 0
                ? `<h2>Images</h2>` +
                  `<section class="gallery">` +
                  area.images
                      .map((img) => `<img class="image" src="${img}">`)
                      .join("\n") +
                  `</section>`
                : ""
        }
      </body>
    </html>`;
}

/**
 * Template for a sector page.
 */
function sectorTemplate(area, sector) {
    return `
    <html>
      <head>
        <title>${sector.name}</title>
        <link rel="stylesheet" href="../../styles.css">
        </head>
      <body>
        ${backButton("../index.html")}
        <h1>${sector.name}</h1>
        <p>${sector.description || "No description available."}</p>
        
        ${
            sector.problems && sector.problems.length > 0
                ? `<h2>Problems</h2><ul>` +
                  sector.problems
                      .map(
                          (problem) =>
                              `<li><a href="${sanitizeFilename(
                                  problem.name
                              )}.html">${problem.name} (${
                                  problem.grade
                              })</a></li>`
                      )
                      .join("\n") +
                  "</ul>"
                : ""
        }
                
        ${
            sector.images && sector.images.length > 0
                ? `<h2>Images</h2>` +
                  `<section class="gallery">` +
                  sector.images
                      .map((img) => `<img class="image" src="${img}">`)
                      .join("\n") +
                  `</section>`
                : ""
        }
      </body>
    </html>`;
}

/**
 * Template for a problem page.
 */
function problemTemplate(parentPath, problem) {
    return `
    <html>
      <head><title>${problem.name}</title></head>
      <link rel="stylesheet" href="../../styles.css">
      <link rel="stylesheet" href="../styles.css">
      <body>
        ${backButton(parentPath)}
        <h1>${problem.name} (${problem.grade})</h1>
        <p class="description">${
            problem.description || "No description available."
        }</p>
        <p class="rating">Rating: ${"★".repeat(problem.rating)}</p>
        <p><a href="${
            problem.mapsLink
        }" target="_blank">View on Google Maps</a></p>
        
        ${
            problem.images && problem.images.length > 0
                ? `<h2>Images</h2>` +
                  `<section class="gallery">` +
                  problem.images
                      .map((img) => `<img class="image" src="${img}">`)
                      .join("\n") +
                  `</section>`
                : ""
        }
      </body>
    </html>`;
}

/**
 * Generates the index.html listing all areas alphabetically.
 */
function generateIndex() {
    generatePage(path.join(outputDir, "index.html"), indexTemplate(data));
}

/**
 * Generates an HTML page for each climbing area.
 */
function generateAreaPages() {
    data.forEach((area) => {
        const areaFolder = path.join(outputDir, sanitizeFilename(area.name));
        generatePage(path.join(areaFolder, "index.html"), areaTemplate(area));

        area.sectors.forEach((sector) =>
            generateSectorPage(areaFolder, sector)
        );
        area.problems.forEach((problem) =>
            generateProblemPage(areaFolder, problem, "../index.html")
        );
    });
}

/**
 * Generates an HTML page for each sector.
 */
function generateSectorPage(areaFolder, sector) {
    const sectorFolder = path.join(areaFolder, sanitizeFilename(sector.name));
    generatePage(
        path.join(sectorFolder, "index.html"),
        sectorTemplate(areaFolder, sector)
    );

    if (sector.problems) {
        sector.problems.forEach((problem) =>
            generateProblemPage(sectorFolder, problem, "../index.html")
        );
    }
}

/**
 * Generates an HTML page for each problem.
 */
function generateProblemPage(parentFolder, problem, backPath) {
    generatePage(
        path.join(parentFolder, `${sanitizeFilename(problem.name)}.html`),
        problemTemplate(backPath, problem)
    );
}

/**
 * Main function to generate the entire static website.
 */
function generateStaticSite() {
    console.log("Generating static site...");
    generateIndex();
    generateAreaPages();
    console.log(
        "Static site generation complete! Check the 'static_site' folder."
    );
}

// Run the script
generateStaticSite();

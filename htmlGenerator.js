const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync("data/output.json", "utf-8"));

const outputDir = path.join(__dirname, "static_site");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

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
 * Generates a list item for an area, sector, or problem.
 * @param {string} title - Title of the item.
 * @param {string} url - URL to link to.
 * @param {string} meta - Additional metadata to display.
 */
function listItem(title, url, meta) {
    return `<a href="${url}">
        <li class="list-item">
            <span class="list-item-title">${title}</span>
            <small class="list-item-meta">${meta}</small>
        </li>
    </a>`;
}

/**
 * Generates an image item for an image gallery.
 * @param {string} imgUrl - URL of the image.
 * @returns {string} HTML for the image item.
 */
function imageItem(imgUrl, index) {
    return `<a 
        class="image-wrapper"
        href="${imgUrl}" 
        target="_blank"
        title="Image ${index + 1}"
        style="background-image: url('${imgUrl}'); background-size: cover;">
            ${index ? `<div class="image-index">${index + 1}</div>` : ""}
        </a>`;
}

/**
 * Generates a gallery of images.
 * @param {string[]} images - Array of image URLs.
 * @returns {string} HTML for the image gallery.
 */

function gallery(images) {
    if (images && images.length > 0) {
        return (
            `<h2 class="section-header">Kartor och bilder</h2>` +
            `<section class="gallery">` +
            images.map((img, index) => imageItem(img, index)).join("\n") +
            `</section>`
        );
    }
}

/**
 * Generates a "Back" button.
 * @param {string} backPath - Path to navigate one level up.
 * @param {string} title - Title of the previous page.
 * @returns {string} HTML for the back button.
 */
function backButton(backPath, title) {
    return `<a class="back-button" href="${backPath}">‹ ${title}</a>`;
}

/**
 * Template for the index page.
 */
function indexTemplate(areas) {
    return `
    <html>
      <head>
      <title>Climbing Areas</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="preconnect" href="https://rsms.me/">
      <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
      <link rel="stylesheet" href="styles.css">
      </head>
      <body>
        <h1 class="site-header">GBO<span class="slashes">//</span>C</h1>
        <ul>
          ${areas
              .map((area) => {
                  let sectorCount = area.sectors.length;
                  let problemCount = area.problems.length;
                  let areaLink = sanitizeFilename(area.name) + "/index.html";

                  if (sectorCount == 0) {
                      return listItem(
                          area.name,
                          areaLink,
                          `${problemCount} problem`
                      );
                  } else {
                      return listItem(
                          area.name,
                          areaLink,
                          `${sectorCount} sektorer`
                      );
                  }
              })
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
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="preconnect" href="https://rsms.me/">
      <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
      <link rel="stylesheet" href="../styles.css">
      </head>
      <body>
        <header>
            ${backButton("../index.html", area.name)}
            <a href="${area.mapsLink}" target="_blank">
            <small class="coordinate">${area.coordinate}</small></a> 
        </header>
        <h2 class="section-header">Beskrivning</h2>
        <p class="section">${
            area.description || "Ingen beskrivningen tillgänglig."
        }</p>
        
        ${
            area.sectors.length > 0
                ? `<h2 class="section-header">Sektorer</h2><ul>` +
                  area.sectors
                      .map((sector) => {
                          let sectorUrl = `${sanitizeFilename(
                              sector.name
                          )}/index.html`;
                          let problemCount = sector.problems
                              ? sector.problems.length
                              : 0;
                          return listItem(
                              sector.name,
                              sectorUrl,
                              problemCount + " problem"
                          );
                      })
                      .join("\n") +
                  "</ul>"
                : ""
        }
        
        ${
            area.problems.length > 0
                ? `<h2 class="section-header">Problem</h2><ul>` +
                  area.problems
                      .map((problem) => {
                          let problemUrl = `${sanitizeFilename(
                              problem.name
                          )}.html`;
                          return listItem(
                              problem.name,
                              problemUrl,
                              problem.grade
                          );
                      })
                      .join("\n") +
                  "</ul>"
                : ""
        }
        ${gallery(area.images)}
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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="preconnect" href="https://rsms.me/">
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
        <link rel="stylesheet" href="../../styles.css">
    </head>
      <body>
        <header>
            ${backButton("../index.html", sector.name)}
            <a href="${sector.mapsLink}" target="_blank">
            <small class="coordinate">${sector.coordinate}</small></a> 
        </header>
        <h2 class="section-header">Beskrivning</h2>
        <p class="section">${sector.description || "N/A."}</p>
        
        ${
            sector.problems && sector.problems.length > 0
                ? `<h2 class="section-header">Problem</h2><ul>` +
                  sector.problems
                      .map((problem) => {
                          let problemUrl = `${sanitizeFilename(
                              problem.name
                          )}.html`;
                          return listItem(
                              problem.name,
                              problemUrl,
                              problem.grade
                          );
                      })
                      .join("\n") +
                  "</ul>"
                : ""
        }

        ${gallery(sector.images)}
      </body>
    </html>`;
}

/**
 * Template for a problem page.
 */
function problemTemplate(parentPath, problem) {
    return `
    <html>
      <head>
        <title>${problem.name}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="../../styles.css">
        <link rel="stylesheet" href="../styles.css">
      </head>
      <body>
        <header>
            ${backButton(parentPath, problem.name)}
        </header>
        <h2 class="section-header">Beskrivning</h2>
        <div class="section">
            <p>${problem.description || "N/A."}</p>
            <p>Grad: ${problem.grade}</p>
            ${
                problem.rating
                    ? `<p>Betyg: ${"★".repeat(problem.rating)}</p>`
                    : ""
            }
        </div>
        // TODO: Koordinater -> problem-objektet
        // TODO: Länka till GBO page
        // TODO: FA
        // TODO: Landning
        // TODO: Sittstart
        
        ${gallery(problem.images)}
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

        area.sectors.forEach((sector) => {
            generateSectorPage(areaFolder, sector);
        });
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

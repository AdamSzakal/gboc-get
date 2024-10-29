const fs = require("fs").promises;
const path = require("path");

// Load JSON data
async function loadJsonData(jsonFilePath) {
    const data = await fs.readFile(jsonFilePath, "utf-8");
    return JSON.parse(data);
}

// Create directories for each area, sector, and problem
async function createHtmlFiles(areas, outputDir) {
    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Step 1: Create Homepage listing all areas
    let homepageContent = `<h1>Areas</h1><ul>`;
    for (const area of areas) {
        const areaFileName = `${area.name
            .replace("ö", "o")
            .replace("ä", "a")
            .replace("å", "a")
            .replace("ü", "u")
            .replace("ß", "s")
            .replace("Ö", "O")
            .replace("Ü", "U")
            .replace("Ä", "A")
            .replace(/\W+/g, "-")
            .toLowerCase()}`;
        const areaDir = path.join(outputDir, areaFileName);
        await fs.mkdir(areaDir, { recursive: true });

        // Link to each area's page
        homepageContent += `<li><a href="./${areaFileName}/index.html">${area.name}</a></li>`;

        // Step 2: Create area page listing all sectors
        let areaContent = `<h1>${area.name}</h1><ul>`;
        for (const sector of area.sectors) {
            const sectorFileName = `${sector.name
                .replace("ö", "o")
                .replace("ä", "a")
                .replace("å", "a")
                .replace("ü", "u")
                .replace("ß", "s")
                .replace("Ö", "O")
                .replace("Ü", "U")
                .replace("Ä", "A")
                .replace(/\W+/g, "-")
                .toLowerCase()}`;
            const sectorDir = path.join(areaDir, sectorFileName);
            await fs.mkdir(sectorDir, { recursive: true });

            // Link to each sector's page
            areaContent += `<li><a href="./${sectorFileName}/index.html">${sector.name}</a></li>`;

            // Step 3: Create sector page listing all problems
            let sectorContent = `<h1>${sector.name}</h1><ul>`;
            for (const problem of sector.problems) {
                // Use a unique file name for each problem page
                // Check for whitespaces, slashes, dashes, etc. in the problem name
                const problemFileName = `${problem.name
                    .replace("ö", "o")
                    .replace("ä", "a")
                    .replace("å", "a")
                    .replace("ü", "u")
                    .replace("ß", "s")
                    .replace("Ö", "O")
                    .replace("Ü", "U")
                    .replace("Ä", "A")
                    .replace(/\W+/g, "-")
                    .toLowerCase()}.html`;

                // Link to each problem's page
                sectorContent += `<li><a href="./${problemFileName}">${problem.name}</a></li>`;

                // Step 4: Create problem page with the problem name
                const problemContent = `<h1>${problem.name}</h1><p>Details about ${problem.name}.</p>`;
                await fs.writeFile(
                    path.join(sectorDir, problemFileName),
                    problemContent,
                    "utf8"
                );
            }
            sectorContent += "</ul>";

            // Write sector page
            await fs.writeFile(
                path.join(sectorDir, "index.html"),
                sectorContent,
                "utf8"
            );
        }
        areaContent += "</ul>";

        // Write area page
        await fs.writeFile(
            path.join(areaDir, "index.html"),
            areaContent,
            "utf8"
        );
    }
    homepageContent += "</ul>";

    // Write homepage
    await fs.writeFile(
        path.join(outputDir, "index.html"),
        homepageContent,
        "utf8"
    );
}

// Main function to run the script
async function generateHtmlFromJson() {
    const jsonFilePath = "./data/data.json";
    const outputDir = "./site";

    try {
        const areas = await loadJsonData(jsonFilePath);
        await createHtmlFiles(areas, outputDir);
        console.log(`Website generated successfully in ${outputDir}`);
    } catch (error) {
        console.error("Error generating website:", error);
    }
}

// Run the main function
generateHtmlFromJson();

module.exports = generateHtmlFromJson;

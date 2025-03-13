const fs = require("fs").promises;
const path = require("path");

// Load JSON data
async function loadJsonData(jsonFilePath) {
    const data = await fs.readFile(jsonFilePath, "utf-8");
    return JSON.parse(data);
}

const header = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Document</title>
</head>
<style>
    body {
        font-family: Inter, sans-serif;
        font-size: 16px;
        line-height: 130%;
        padding: 8px 32px;
    }
    main {
        display: flex;
        flex-direction: column;
        max-width: 30em;
        gap: 16px;
        padding: 16px 0;
        min-height: 100%;
    }
    a, a:visited {
        text-decoration: none;
        color: inherit;
    }
    .list-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .list-item:hover {
        text-decoration: underline;
    }
    .metadata-wrapper {
        display: flex;
        gap: 4px;
    }
    .metadata {
        font-size: 14px;
        opacity: .5;
    }
    .rating {
        color: orangered;
    }
    .list-item a, .list-item p {
        margin: 0;
    }

    footer {
        margin-top: 32px;
        font-size: 14px;
        color: orangered;
    }


</style>
<body>`;

const footer = `</body></html>`;

// Create directories for each area, sector, and problem
async function createHtmlFiles(areas, outputDir) {
    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Step 1: Create Homepage listing all areas
    let homepageContent = `${header} <h1>Areas</h1><main>`;
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

        const sectorCount = area.sectors.length;
        const areaListItem = `<a class="list-item" href="./${areaFileName}/index.html">
                <p class="list-title">${area.name}</p>
                <p class="metadata">${sectorCount} sektorer</p>
            </a>`;

        // Create area list item
        homepageContent += areaListItem;

        // Step 2: Create area page listing all sectors
        let areaContent = `${header}
            <a class="metadata" href="../index.html">← Alla områden</a>
            <h1>${area.name}</h1>
            <main>`;
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

            const problemCount = sector.problems.length;

            // Create sector list item
            const sectorListItem = `<a class="list-item" href="./${sectorFileName}/index.html">
                    <p class="list-title">${sector.name}</p>
                    <p class="metadata">${problemCount} problem</p>
                </a>`;

            areaContent += sectorListItem;

            // Step 3: Create sector page listing all problems
            let sectorContent = `${header}
                <a class="metadata" href="../index.html">← Alla sektorer</a>
                <h1>${sector.name}</h1>
                <main>`;
            for (const problem of sector.problems) {
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

                const starRating = function getRating(rating) {
                    if (rating === 0) {
                        return "";
                    } else if (rating === 1) {
                        return "●";
                    } else if (rating === 2) {
                        return "●●";
                    } else if (rating === 3) {
                        return "●●●";
                    } else {
                        return "";
                    }
                };

                const problemListItem = `<a class="list-item" href="./${problemFileName}/index.html">
                    <p class="list-title">${problem.name}</p>
                    <div class="metadata-wrapper">
                        <p class="metadata">${problem.grade}</p>
                        <p class="rating">${starRating(problem.rating)}</span>
                    </div>
                    </a>`;

                // Link to each problem's page
                sectorContent += problemListItem;

                // Step 4: Create problem page with the problem name
                const problemContent = `<h1>${problem.name}</h1><p>Details about ${problem.name}.</p>`;
                await fs.writeFile(
                    path.join(sectorDir, problemFileName),
                    problemContent,
                    "utf8"
                );
            }

            // Close sector listing
            sectorContent += `</main> ${footer}`;
            // Add source URL
            sectorContent += `<footer>Källa: <a href="${sector.url}">${sector.name}</a></footer>`;

            // Write sector page
            await fs.writeFile(
                path.join(sectorDir, "index.html"),
                sectorContent,
                "utf8"
            );
        }

        // Close area lising
        areaContent += `</main> ${footer}`;
        // Add source URL
        areaContent += `<footer>Source: <a href="${area.url}">${area.name}</a></footer>`;

        // Write area page
        await fs.writeFile(
            path.join(areaDir, "index.html"),
            areaContent,
            "utf8"
        );
    }

    // Close homepage listing
    homepageContent += "</main>";

    // Write homepage
    await fs.writeFile(
        path.join(outputDir, "index.html"),
        homepageContent,
        "utf8"
    );
}

// Main function to run the script
async function generateHtmlFromJson() {
    const jsonFilePath = "./data/output.json";
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

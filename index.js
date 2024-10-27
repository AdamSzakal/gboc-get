const fs = require("fs").promises;
const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeDataAndWriteToFile(url, outputFilePath) {
    try {
        // STEP 1: SCRAPE THE HOMEPAGE FOR AREAS
        // Fetch the HTML from the page
        const { data } = await axios.get(url);

        // Load the HTML into Cheerio
        const root = cheerio.load(data);

        const areas = [];
        root("a.inlinetable").each((index, element) => {
            let innerText = root(element).text().replace(/\s+/g, " ").trim();
            let areaName = innerText.split(" (")[0];
            let url = root(element).attr("href");
            areas.push({ name: areaName, url });
        });

        // Step 2: Visit each URL and check for sectors
        for (const area of areas) {
            try {
                const areaResponse = await axios.get(area.url);
                const areaPage = cheerio.load(areaResponse.data);

                // Check if area is split into sectors by looking for `.sectorlinkitem` elements
                const sectors = [];
                areaPage(".sectorlinkitem a").each((index, element) => {
                    const sectorName = areaPage(element).text().trim();
                    const sectorUrl = areaPage(element).attr("href");
                    sectors.push({ sectorName, sectorUrl });
                });

                if (sectors.length > 0) {
                    // Step 3a: If the area has sectors, get problems for each sector
                    area.sectors = sectors;

                    for (const sector of sectors) {
                        try {
                            const sectorResponse = await axios.get(
                                sector.sectorUrl
                            );
                            const sectorPage = cheerio.load(
                                sectorResponse.data
                            );

                            // Check for problems in the sector and add them to the sector object
                            const problems = [];
                            sectorPage(
                                "h3:not(#comments):first-of-type + .object-list li a"
                            ).each((index, element) => {
                                const problemName = sectorPage(element)
                                    .text()
                                    .trim()
                                    .split(", ")[0];
                                const problemGrade = sectorPage(element)
                                    .text()
                                    .trim()
                                    .split(", ")[1];
                                const problemUrl =
                                    sectorPage(element).attr("href");
                                problems.push({
                                    problemName,
                                    problemGrade,
                                    problemUrl,
                                });
                            });

                            // Add problems if any are found in the sector
                            if (problems.length > 0) {
                                sector.problems = problems;
                            }

                            console.log(
                                `Checked ${sector.sectorName} for problems`
                            );
                        } catch (error) {
                            console.error(
                                `Error fetching ${sector.sectorUrl}:`,
                                error
                            );
                        }
                    }
                } else {
                    // Step 3b: If no sectors, add problems under a "main" sector
                    const mainSector = { sectorName: "main", problems: [] };
                    areaPage(
                        "h3:not(#comments):first-of-type + .object-list li a"
                    ).each((index, element) => {
                        // Title example: "3. Stina, 6B ⭐️⭐️ (📷)"
                        // We need to trim and split it...
                        const problemTitle = areaPage(element).text().trim();
                        const problemName = problemTitle.split(", ")[0];
                        const problemGrade = problemTitle
                            .split(", ")[1]
                            .split(" ")[0];
                        const problemUrl = areaPage(element).attr("href");
                        mainSector.problems.push({
                            problemName,
                            problemGrade,
                            problemUrl,
                        });
                    });

                    // Add the "main" sector only if it has problems
                    if (mainSector.problems.length > 0) {
                        area.sectors = [mainSector];
                    }

                    console.log(
                        `Listed problems for area ${area.name} under 'main' sector`
                    );
                }

                console.log(`Checked ${area.name} for sectors`);
            } catch (error) {
                console.error(`Error fetching ${area.url}:`, error);
            }
        }

        // STEP 4: LOOP THROUGH EACH PROBLEM FOR DETAILS

        // Convert the data to a JSON string
        const jsonData = JSON.stringify(areas, null, 2); // pretty print with 2 spaces

        // Write the JSON data to a file
        await fs.writeFile(outputFilePath, jsonData, "utf8");

        console.log(`Data written successfully to ${outputFilePath}`);
    } catch (error) {
        console.error("Error fetching or writing data:", error);
    }
}

// Usage
const url = "https://gbo.crimp.se";
const outputFilePath = "./scraped_data.json";
scrapeDataAndWriteToFile(url, outputFilePath);

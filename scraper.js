const fs = require("fs").promises;
const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeData(url, outputFilePath) {
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
                    sectors.push({ name: sectorName, url: sectorUrl });
                });

                if (sectors.length > 0) {
                    // Step 3a: If the area has sectors, get problems for each sector
                    area.sectors = sectors;

                    for (const sector of sectors) {
                        try {
                            const sectorResponse = await axios.get(sector.url);
                            const sectorPage = cheerio.load(
                                sectorResponse.data
                            );

                            // Check for problems in the sector and add them to the sector object
                            const problems = [];
                            sectorPage("h3").each((index, element) => {
                                if (
                                    sectorPage(element).text().trim() ===
                                    "Problem"
                                ) {
                                    // Step 2: Select all adjacent .object-list li a elements
                                    sectorPage(element)
                                        .next(".object-list")
                                        .find("li a")
                                        .each((i, item) => {
                                            // Raw title example: "3. Stina, 6B ⭐️⭐️ (📷)"
                                            // We want name: Stina, grade: 6B, url: /problem/123
                                            const problemTitle = areaPage(item)
                                                .text()
                                                .trim();
                                            const problemName = problemTitle
                                                .split(",")[0]
                                                .replace(/\d+./g, "")
                                                .trim();
                                            // TODO: remove trailing dot from problem name
                                            const problemGradeAndRating =
                                                problemTitle.split(",")[1];
                                            const problemGrade =
                                                problemGradeAndRating
                                                    .trim()
                                                    .split(" ")[0];
                                            const problemUrl =
                                                areaPage(item).attr("href");
                                            let problemRating = 0;
                                            areaPage(item)
                                                .find(".staricon")
                                                .each((i, star) => {
                                                    problemRating++;
                                                });

                                            // TODO: Scarpe problem details
                                            // TODO: Scrape problem media (images, videos)
                                            // Add the problem to the array
                                            problems.push({
                                                name: problemName,
                                                grade: problemGrade,
                                                url: problemUrl,
                                                rating: problemRating,
                                            });
                                        });
                                }
                            });

                            // Add problems if any are found in the sector
                            if (problems.length > 0) {
                                sector.problems = problems;
                            } else {
                                sector.problems = [];
                            }
                        } catch (error) {
                            console.error(
                                `Error fetching ${sector.sectorUrl}:`,
                                error
                            );
                        }
                    }
                } else {
                    // Step 3b: If no sectors, add problems under a "main" sector
                    const mainSector = { name: "main", problems: [] };
                    areaPage("h3").each((index, element) => {
                        if (areaPage(element).text().trim() === "Problem") {
                            // Step 2: Select all adjacent .object-list li a elements
                            areaPage(element)
                                .next(".object-list")
                                .find("li a")
                                .each((i, item) => {
                                    // Raw title example: "3. Stina, 6B ⭐️⭐️ (📷)"
                                    const problemTitle = areaPage(item)
                                        .text()
                                        .trim();
                                    const problemName =
                                        problemTitle.split(",")[0];
                                    const problemGradeAndRating =
                                        problemTitle.split(",")[1];
                                    const problemGrade = problemGradeAndRating
                                        .trim()
                                        .split(" ")[0];
                                    const problemUrl =
                                        areaPage(item).attr("href");
                                    let problemRating = 0;
                                    areaPage(item)
                                        .find(".staricon")
                                        .each((i, star) => {
                                            problemRating++;
                                        });

                                    // Add the problem to the array
                                    mainSector.problems.push({
                                        name: problemName,
                                        grade: problemGrade,
                                        url: problemUrl,
                                        rating: problemRating,
                                    });
                                });
                        }
                    });

                    // Add the "main" sector only if it has problems
                    area.sectors = [mainSector];
                }
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
const outputFilePath = "./data/data.json";
scrapeData(url, outputFilePath);

module.exports = scrapeData;

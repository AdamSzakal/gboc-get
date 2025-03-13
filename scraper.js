const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const BASE_URL = "https://gbo.crimp.se";

// Scrape the main page for area links
async function scrapeMainPage() {
    try {
        const response = await axios.get(BASE_URL);
        const html = response.data;
        const $ = cheerio.load(html);
        let areas = [];

        $("#arealist2 a.inlinetable").each((i, elem) => {
            // if (175 < i && i < 185) {
            let areaUrl = $(elem).attr("href");
            // Make sure URL is absolute
            if (areaUrl && !areaUrl.startsWith("http")) {
                areaUrl = BASE_URL + areaUrl;
            }
            const areaName = $(elem).text().trim().split("\n")[0];
            areas.push({ name: areaName, url: areaUrl });
            // }
        });
        return areas;
    } catch (error) {
        console.error("Error scraping main page:", error);
    }
}

// Scrape an area page for details and links to sectors (and optionally problems)
async function scrapeAreaPage(area) {
    try {
        const response = await axios.get(area.url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Extract area details
        area.name =
            $(".breadcrumb + h2").text().trim().split("\n")[0] || area.name;
        area.description = $("div.description p")
            .text()
            .replace(/\n+/g, " ") // Replace multiple newlines with a single one
            .trim();
        area.coordinate = $('a[href*="maps.google.com"]').text().split(": ")[1];
        area.mapsLink = $('a[href*="maps.google.com"]').attr("href");

        // Extract images
        let images = [];
        $("a.thumbnail").each((i, elem) => {
            let imageURL = $(elem).attr("href");
            images.push(imageURL);
        });
        area.images = images;

        // Extract sector links from the area page
        let sectors = [];
        $(".sectorlinkitem > a").each((i, elem) => {
            if (i < 10) {
                let sectorUrl = $(elem).attr("href");
                if (sectorUrl) {
                    if (!sectorUrl.startsWith("http")) {
                        sectorUrl = new URL(sectorUrl, area.url).href; // More reliable URL building
                    }
                }
                const sectorName = $(elem).text().trim().split("\n")[0];
                sectors.push({ name: sectorName, url: sectorUrl });
            }
        });
        area.sectors = sectors;

        // (Optional) If the area page also contains problem links directly, you can scrape them here.
        // Extract problem links on the area page
        let problems = [];
        $("h3").each((i, elem) => {
            // if (i < 10) {
            if ($(elem).text().trim() === "Problem") {
                $(elem)
                    .next()
                    .find("a")
                    .each((i, elem) => {
                        let problemUrl = $(elem).attr("href");
                        if (problemUrl && !problemUrl.startsWith("http")) {
                            problemUrl = BASE_URL + problemUrl;
                        }
                        const titleText = $(elem).text().trim();
                        const name = titleText.split(", ")[0];
                        // const grade = titleText.split(", ")[1].split(" ")[0];
                        // const rating = $("h2 i.staricon").length;
                        // const description = $("div.description > p")
                        //     .text()
                        //     .replace(/\n+/g, " ") // Replace multiple newlines with a single one
                        //     .trim();
                        // const coordinate = $('a[href*="maps.google.com"]')
                        //     .text()
                        //     .split(": ")[1];
                        // const mapsLink = $('a[href*="maps.google.com"]').attr(
                        //     "href"
                        // );
                        // const landing = $('ul.nav-list li:contains("Landning")')
                        //     .text()
                        //     .split(": ")[1];
                        // const sitStart = $(
                        //     'ul.nav-list li:contains("Sittstart")'
                        // )
                        //     .text()
                        //     .split(": ")[1];

                        // // Extract images
                        // let images = [];
                        // $("a.thumbnail").each((i, elem) => {
                        //     let imageURL = $(elem).attr("href");
                        //     images.push(imageURL);
                        // });

                        let problem = {};
                        problem.url = problemUrl;
                        problem.name = name;
                        // problem.grade = grade;
                        // problem.rating = rating;
                        // problem.description = description;
                        // problem.coordinate = coordinate;
                        // problem.mapsLink = mapsLink;
                        // problems.landing = landing;
                        // problems.sitStart = sitStart;
                        // problem.images = images;

                        problems.push(problem);
                    });
            }
            // }
        });
        area.problems = problems;

        return area;
    } catch (error) {
        console.error(`Error scraping area page ${area.url}:`, error);
    }
}

// Scrape a sector page for details and problem links
async function scrapeSectorPage(sector) {
    try {
        const response = await axios.get(sector.url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Extract sector details (update selectors as needed)
        sector.name =
            $(".breadcrumb + h2").text().trim().split("\n")[0] || sector.name;
        sector.description = $("div.description p")
            .text()
            .replace(/\n+/g, " ") // Replace multiple newlines with a single one
            .trim();
        sector.coordinate = $('a[href*="maps.google.com"]')
            .text()
            .split(": ")[1];
        sector.mapsLink = $('a[href*="maps.google.com"]').attr("href");

        // Extract images
        let images = [];
        $("a.thumbnail").each((i, elem) => {
            let imageURL = $(elem).attr("href");
            images.push(imageURL);
        });
        sector.images = images;

        // Extract problem links on the sector page
        let problems = [];
        $("h3:first-of-type + ul.nav-list.object-list a").each((i, elem) => {
            let problemUrl = $(elem).attr("href");
            if (problemUrl && !problemUrl.startsWith("http")) {
                problemUrl = BASE_URL + problemUrl;
            }
            const problemName = $(elem).text().trim();
            problems.push({ name: problemName, url: problemUrl });
        });
        sector.problems = problems;
        return sector;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.warn(`⚠️ Skipping missing sector: ${sector.url}`);
            return null; // Return null if the page is missing
        } else {
            console.error(`Error scraping sector page ${sector.url}:`, error);
        }
    }
}

// Scrape a problem page for its detailed information
async function scrapeProblemPage(problem) {
    try {
        const response = await axios.get(problem.url);
        const html = response.data;
        const $ = cheerio.load(html);

        const titleText = $(".breadcrumb + h2").text().trim();
        const name = titleText.split(", ")[0];
        const grade = titleText.split(", ")[1].split(" ")[0];
        const rating = $("h2 i.staricon").length;
        const description = $("div.description > p")
            .text()
            .replace(/\n+/g, " ") // Replace multiple newlines with a single one
            .trim();
        const coordinate = $('a[href*="maps.google.com"]')
            .text()
            .split(": ")[1];
        const mapsLink = $('a[href*="maps.google.com"]').attr("href");
        const landing = $('ul.nav-list li:contains("Landning")')
            .text()
            .split(": ")[1];
        const sitStart = $('ul.nav-list li:contains("Sittstart")')
            .text()
            .split(": ")[1];

        // Extract images
        let images = [];
        $("a.thumbnail").each((i, elem) => {
            let imageURL = $(elem).attr("href");
            images.push(imageURL);
        });

        problem.name = name;
        problem.grade = grade;
        problem.rating = rating;
        problem.description = description;
        problem.coordinate = coordinate;
        problem.mapsLink = mapsLink;
        problem.landing = landing;
        problem.sitStart = sitStart;
        problem.images = images;

        return problem;
    } catch (error) {
        console.error(`Error scraping problem page ${problem.url}:`, error);
    }
}

// Main function to orchestrate the scraping
async function main() {
    try {
        // 1. Get all areas from the main page
        let areas = await scrapeMainPage();

        // 2. For each area, scrape its page details and then its sectors (and problems)
        for (let area of areas) {
            console.log(`Scraping area: ${area.name}`);
            await scrapeAreaPage(area);

            if (area.sectors.length === 0 && area.problems) {
                // If the area page contains problems directly, add them directly to the area object
                for (let problem of area.problems) {
                    console.log(
                        `  Scraping problem ${problem.name} for ${area.name}`
                    );
                    await scrapeProblemPage(problem);
                }
            }

            // 3. For each sector in the area, scrape the sector page and its problems
            for (let sector of area.sectors) {
                console.log(`  Scraping sector: ${sector.name}`);
                sector = await scrapeSectorPage(sector);
                if (!sector) continue; // Skip this sector if it wasn't found

                // 4. For each problem in the sector, scrape the problem page for details
                for (let problem of sector.problems) {
                    console.log(`    Scraping problem: ${problem.name}`);
                    await scrapeProblemPage(problem);
                }
            }
        }

        // Save the final JSON structure
        fs.writeFileSync("data/output.json", JSON.stringify(areas, null, 2));
        console.log("Scraping complete. Data saved to output.json");
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main();

const scrapeData = require("./scraper");
const generateHtml = require("./htmlGenerator");
const fs = require("fs").promises;
const path = require("path");

async function run() {
    // Step 1: Run scrapeData and wait for it to complete
    await scrapeData();

    // Step 2: Check if the JSON file was created
    const jsonFilePath = path.join(__dirname, "data", "data.json");
    try {
        await fs.access(jsonFilePath); // This will throw an error if the file does not exist

        // Step 3: If the file exists, proceed to generate HTML
        await generateHtml();

        console.log("HTML generation completed.");
    } catch (error) {
        console.error("JSON file not found, HTML generation skipped:", error);
    }
}

run();

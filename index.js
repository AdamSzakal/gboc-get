const scrapeData = require("./scraper");
const generateHtml = require("./htmlGenerator");

async function run() {
    await scrapeData(); // Scrape and save data to JSON
    await generateHtml(); // Read JSON and generate HTML files
}

run();

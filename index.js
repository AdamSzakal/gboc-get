const scrapeData = require("./scraper");
const generateHtml = require("./htmlGenerator");

async function run() {
    await scrapeData(); // Run scraping
    await generateHtml(); // Generate HTML
}
run();

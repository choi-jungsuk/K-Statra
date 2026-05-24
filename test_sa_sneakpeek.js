require('dotenv').config();
const { searchWeb } = require('./src/providers/search/tavily');

async function testTavily() {
    const q = 'South Africa automotive parts importer distributor buyer B2B company "contact" -software -crm -erp -platform -capterra -linkedin -yelp -facebook -twitter -instagram -pinterest -expo -exhibition -fair -event -conference';
    console.log(`Searching: ${q}\n`);
    try {
        const results = await searchWeb(q);
        const top = results.results.slice(0, 3);
        top.forEach((item, i) => {
            console.log(`${i+1}. ${item.title}`);
            console.log(`URL: ${item.url}`);
            console.log(`Profile: ${item.content.substring(0, 150)}...`);
            console.log('---');
        });
        if (results.answer) {
            console.log(`AI Answer: ${results.answer}`);
        }
    } catch (e) {
        console.error(e);
    }
}
testTavily();

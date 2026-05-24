const mongoose = require('mongoose');
require('dotenv').config();
const { Company } = require('./src/models/Company');

async function checkAccumulation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const count = await Company.countDocuments({ dataSource: 'Tavily Web Search' });
        console.log(`\nCompanies from Tavily Web Search: ${count}`);

        if (count > 0) {
            const sample = await Company.find({ dataSource: 'Tavily Web Search' }).limit(5).lean();
            console.log('\nSample saved results:');
            sample.forEach((c, i) => {
                console.log(`${i+1}. ${c.name} | Industry: ${c.industry} | Country: ${c.location.country}`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkAccumulation();

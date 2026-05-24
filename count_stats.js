
const mongoose = require('mongoose');
require('dotenv').config();
const { Company } = require('./src/models/Company');

async function countCompanies() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const total = await Company.countDocuments();

        // Count Korea
        const koreaValues = ['South Korea', 'Korea', 'Republic of Korea', '한국', '대한민국'];
        const domestic = await Company.countDocuments({
            'location.country': { $in: koreaValues.map(v => new RegExp(v, 'i')) }
        });

        const overseas = total - domestic;

        console.log(`Total Companies: ${total.toLocaleString()}`);
        console.log(`Domestic (Korea): ${domestic.toLocaleString()}`);
        console.log(`Overseas: ${overseas.toLocaleString()}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

countCompanies();

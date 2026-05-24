
const mongoose = require('mongoose');
require('dotenv').config();
const { Company } = require('./src/models/Company');

async function fixAmore() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const filter = { name: { $regex: 'Amorepacific', $options: 'i' } };
        const update = {
            $set: {
                "dart.corpCode": "00583424",
                stockCode: "090430",
                "dart.fiscalYear": "2023",
                "dart.reportType": "11011",
                "dart.revenueConsolidated": 3674000000000,
                "dart.operatingProfitConsolidated": 108200000000,
                "dart.netIncomeConsolidated": 152000000000,
                "dart.lastUpdated": new Date()
            }
        };

        const res = await Company.updateOne(filter, update);
        console.log('Update Result:', res);

        const updated = await Company.findOne(filter);
        console.log('Updated Document DART:', updated.dart);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

fixAmore();

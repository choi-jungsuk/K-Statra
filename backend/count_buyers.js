const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function inspectDatabase() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('ERROR: MONGODB_URI is not defined in .env file.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri);
        console.log('Connected successfully!\n');

        const db = mongoose.connection.db;

        // 1. BUYERS ANALYSIS
        const buyersCol = db.collection('buyers');
        const totalBuyers = await buyersCol.countDocuments();

        console.log('==================================================');
        console.log(`📊 [BUYERS] TOTAL REGISTERED BUYERS: ${totalBuyers.toLocaleString()}`);
        console.log('==================================================');

        if (totalBuyers > 0) {
            // Geographics
            console.log('\n🌍 Buyer Geographic Distribution:');
            const countryBreakdown = await buyersCol.aggregate([
                { $group: { _id: { $trim: { input: { $ifNull: ["$country", "Unknown"] } } }, count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]).toArray();

            countryBreakdown.forEach((item, index) => {
                console.log(`   ${index + 1}. [${item._id || 'Not Specified'}]: ${item.count} buyer(s)`);
            });

            // Industries
            console.log('\n🏷️ Buyer Top Industries of Interest:');
            const industryBreakdown = await buyersCol.aggregate([
                { $unwind: "$industries" },
                { $group: { _id: "$industries", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]).toArray();

            industryBreakdown.forEach((item, index) => {
                console.log(`   - ${item._id}: ${item.count} buyer(s)`);
            });
        } else {
            console.log('💡 Tip: No buyers registered yet. Users can register as Buyers on the website UI.');
        }

        // 2. COMPANIES ANALYSIS (Exhibitors/Suppliers)
        const companiesCol = db.collection('companies');
        const totalCompanies = await companiesCol.countDocuments();

        console.log('\n==================================================');
        console.log(`🏢 [COMPANIES] TOTAL EXPORTERS/SUPPLIERS: ${totalCompanies.toLocaleString()}`);
        console.log('==================================================');

        if (totalCompanies > 0) {
            // Automotive / Mobility count (Key for KOAA SHOW!)
            const autoQuery = {
                $or: [
                    { industry: /자동차|부품|Automotive|Car parts|EV|Machinery|parts/i },
                    { tags: { $in: [/자동차/i, /부품/i, /Automotive/i, /EV/i] } }
                ]
            };
            const autoExporters = await companiesCol.countDocuments(autoQuery);

            console.log(`🚗 KOAA SHOW Target (Automotive/EV/Mobility) Exporters: ${autoExporters.toLocaleString()} companies`);

            // Country distribution
            console.log('\n🌍 Supplier Geographic Distribution (Top 10):');
            const compCountryBreakdown = await companiesCol.aggregate([
                { $group: { _id: { $trim: { input: { $ifNull: ["$location.country", "Unknown"] } } }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]).toArray();

            compCountryBreakdown.forEach((item, index) => {
                console.log(`   ${index + 1}. [${item._id || 'Not Specified'}]: ${item.count} company(s)`);
            });

            // Industry sectors
            console.log('\n🏷️ Top 10 Supplier Industry Sectors:');
            const compIndustryBreakdown = await companiesCol.aggregate([
                { $group: { _id: { $ifNull: ["$industry", "Unclassified"] }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]).toArray();

            compIndustryBreakdown.forEach((item, index) => {
                console.log(`   - ${item._id}: ${item.count} company(s)`);
            });
        }

        console.log('==================================================\n');

    } catch (err) {
        console.error('MongoDB Query Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Connection closed safely.');
    }
}

inspectDatabase();

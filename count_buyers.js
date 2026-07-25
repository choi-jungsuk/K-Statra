const mongoose = require('mongoose');
require('dotenv').config();

async function countBuyers() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('ERROR: MONGODB_URI environment variable is not defined in .env file.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri);
        console.log('Connected successfully!');

        const db = mongoose.connection.db;
        const buyersCollection = db.collection('buyers');

        // 1. Total buyers count
        const total = await buyersCollection.countDocuments();
        console.log('\n=======================================');
        console.log(`📊 TOTAL REGISTERED BUYERS: ${total.toLocaleString()}`);
        console.log('=======================================');

        // 2. Break down by country
        console.log('\n🌍 BUYER GEOGRAPHIC DISTRIBUTION:');
        const countryBreakdown = await buyersCollection.aggregate([
            { $group: { _id: { $trim: { input: { $ifNull: ["$country", "Unknown"] } } }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        countryBreakdown.forEach((item, index) => {
            const countryName = item._id || 'Not Specified';
            console.log(`   ${index + 1}. [${countryName}]: ${item.count} buyer(s)`);
        });

        // 3. Common industry categories
        console.log('\n🏷️ TOP INDUSTRIES OF INTEREST:');
        const industryBreakdown = await buyersCollection.aggregate([
            { $unwind: "$industries" },
            { $group: { _id: "$industries", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).toArray();

        if (industryBreakdown.length > 0) {
            industryBreakdown.forEach((item, index) => {
                console.log(`   - ${item._id}: ${item.count} buyer(s)`);
            });
        } else {
            console.log('   No industries recorded.');
        }

        // 4. Sample lists of recently active buyers
        console.log('\n👀 RECENTLY UPDATED BUYER SAMPLES:');
        const sampleBuyers = await buyersCollection.find({})
            .sort({ updatedAt: -1 })
            .limit(5)
            .toArray();

        sampleBuyers.forEach((buyer, index) => {
            console.log(`   ${index + 1}. Name: "${buyer.name}" | Country: "${buyer.country || 'N/A'}" | Industries: [${buyer.industries?.join(', ') || 'None'}]`);
        });

        console.log('=======================================\n');

    } catch (err) {
        console.error('MongoDB Query Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Connection closed safely.');
    }
}

countBuyers();

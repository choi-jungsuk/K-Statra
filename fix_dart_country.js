
const mongoose = require('mongoose');
require('dotenv').config();
const { Company } = require('./src/models/Company');

async function fixCountry() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find companies with DART code but NO country (or empty)
        // Actually, let's just set ALL companies with dart.corpCode to 'South Korea' 
        // if their country is not already 'South Korea' (to avoid overwriting if they are somehow customized, 
        // but DART is inherently Korean).

        const filter = {
            'dart.corpCode': { $exists: true, $ne: '' },
            $or: [
                { 'location.country': { $exists: false } },
                { 'location.country': '' },
                { 'location.country': { $ne: 'South Korea' } } // Optional: Force overwrite if different
            ]
        };

        const count = await Company.countDocuments(filter);
        console.log(`Found ${count} DART companies with missing/incorrect country.`);

        if (count > 0) {
            console.log('Updating...');
            const res = await Company.updateMany(filter, {
                $set: {
                    'location.country': 'South Korea',
                    country: 'South Korea' // Historical field support
                }
            });
            console.log('Update Result:', res);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

fixCountry();

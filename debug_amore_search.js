
const mongoose = require('mongoose');
require('dotenv').config();
const { Company } = require('./src/models/Company');

async function checkAmoreDetails() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Search by Korean name to be sure we get the right one
        const company = await Company.findOne({ name: { $regex: '아모레퍼시픽', $options: 'i' } });

        if (company) {
            console.log('--- Company Found ---');
            console.log('ID:', company._id);
            console.log('Name (KR):', company.name);
            console.log('Name (EN):', company.nameEn);
            console.log('Tags:', company.tags);
            console.log('Profile:', company.profileText);
            console.log('DART:', company.dart);
        } else {
            console.log('Company "아모레퍼시픽" not found by KR name.');
        }

        console.log('\n--- Simulation: Search for "AMORE PACIFIC" ---');
        // Simulate the regex logic from partners.js
        const q = "AMORE PACIFIC";
        const regexFilter = {
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { nameEn: { $regex: q, $options: 'i' } }, // Now included!
                { profileText: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } },
                { industry: { $regex: q, $options: 'i' } }
            ]
        };

        console.log('\n--- Simulation: Aggregation Pipeline for "AMORE PACIFIC" ---');

        // Mock Vector (Just random or empty for now, as we can't easily embed here without the provider)
        // But wait, if we can't embed, we can't test vector search result content exactly.
        // However, we CAN test the $project stage.

        const pipeline = [
            { $match: { name: { $regex: 'Amorepacific', $options: 'i' } } }, // Force match Amorepacific to check projection
            {
                $project: {
                    name: 1,
                    industry: 1,
                    location: 1,
                    profileText: 1,
                    website: 1,
                    tags: 1,
                    sizeBucket: 1,
                    matchRecommendation: 1,
                    matchAnalysis: 1,
                    score: { $literal: 0.9 }, // Mock score
                    dart: 1 // This is what we want to verify
                }
            }
        ];

        const aggResults = await Company.aggregate(pipeline);
        console.log('Aggregation Results:', aggResults.length);
        if (aggResults.length > 0) {
            console.log('First Result DART:', JSON.stringify(aggResults[0].dart, null, 2));
        }

        // Check the irrelevant companies
        const irrelevant = await Company.find({ name: { $regex: 'Pacific', $options: 'i' }, industry: { $regex: 'Invest', $options: 'i' } }).limit(3);
        console.log('\n--- Irrelevant Companies Check ---');
        irrelevant.forEach(c => console.log(`${c.name} - Industry: ${c.industry}`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkAmoreDetails();

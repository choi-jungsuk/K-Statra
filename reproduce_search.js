require('dotenv').config();
const mongoose = require('mongoose');
const { Company } = require('./src/models/Company');
const { embed } = require('./src/providers/embeddings');

// Mock specific environment variables if needed
const INDUSTRY_MAPPING = {
    'IT / AI / SaaS': ['IT / AI / SaaS', 'Tech & Electronics', 'Software'],
    'Healthcare / Bio / Medical': ['Healthcare / Bio / Medical', 'Health & Bio', 'Medical'],
    'Green Energy / Climate Tech / Smart City': ['Green Energy / Climate Tech / Smart City', 'Energy & Environment'],
    'Mobility / Automation / Manufacturing': ['Mobility / Automation / Manufacturing', 'Industrial & Manufacturing', 'Mobility'],
    'Beauty / Consumer Goods / Food': ['Beauty / Consumer Goods / Food', 'Beauty & Cosmetics', 'Food & Beverage', 'Consumer Goods'],
    'Content / Culture / Edutech': ['Content / Culture / Edutech', 'Content', 'Education'],
    'Fintech / Smart Finance': ['Fintech / Smart Finance', 'Finance'],
    'Other': ['Other', '(Unspecified)']
};

async function testSearch(q, industry, country) {
    console.log(`\n=== Testing Search: q="${q}", industry="${industry}", country="${country}" ===`);

    try {
        let dbResults = [];
        let vector = [];

        if (q) {
            try {
                console.log('Generating embedding...');
                vector = await embed(q);
                console.log('Embedding generated length:', vector.length);
            } catch (err) {
                console.error("Embedding failed:", err.message);
            }
        }

        if (vector && vector.length > 0) {
            console.log(`Running Vector Search... Index: ${process.env.ATLAS_VECTOR_INDEX || 'vector_index'}`);
            const pipeline = [
                {
                    $vectorSearch: {
                        index: process.env.ATLAS_VECTOR_INDEX || 'vector_index',
                        path: 'embedding',
                        queryVector: vector,
                        numCandidates: 100,
                        limit: 20
                    }
                }
            ];

            const matchStage = {};
            if (industry) {
                if (INDUSTRY_MAPPING[industry]) {
                    matchStage.industry = { $in: INDUSTRY_MAPPING[industry] };
                } else {
                    matchStage.industry = industry;
                }
            }
            if (country) matchStage['location.country'] = country;

            console.log(`Match Filters:`, JSON.stringify(matchStage));

            if (Object.keys(matchStage).length > 0) {
                pipeline.push({ $match: matchStage });
            }

            pipeline.push({
                $project: {
                    name: 1,
                    industry: 1,
                    location: 1,
                    score: { $meta: 'vectorSearchScore' }
                }
            });

            console.log('Running Vector Search Pipeline...');
            try {
                dbResults = await Company.aggregate(pipeline);
                console.log(`Vector Search Results: ${dbResults.length}`);
                dbResults.forEach(r => console.log(` - ${r.name} (${r.industry}) Score: ${r.score}`));
            } catch (err) {
                console.error("Vector Search Aggregation Failed:", err);
            }
        }

        if (dbResults.length === 0 && q) {
            console.log('Fallback to Regex...');
            const filter = {};
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { profileText: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } },
                { industry: { $regex: q, $options: 'i' } }
            ];

            if (industry) {
                if (INDUSTRY_MAPPING[industry]) {
                    filter.industry = { $in: INDUSTRY_MAPPING[industry] };
                } else {
                    filter.industry = industry;
                }
            }
            if (country) filter['location.country'] = country;

            console.log(`Regex Filter:`, JSON.stringify(filter));
            dbResults = await Company.find(filter).limit(10).lean();
            console.log(`Regex Results: ${dbResults.length}`);
            dbResults.forEach(r => console.log(` - ${r.name} (${r.industry})`));
        }

        // Browsing Mode (No Query)
        if (!q && (industry || country)) {
            console.log('Browsing Mode (Filter Only)...');
            const filter = {};
            if (industry) {
                if (INDUSTRY_MAPPING[industry]) {
                    filter.industry = { $in: INDUSTRY_MAPPING[industry] };
                } else {
                    filter.industry = industry;
                }
            }
            if (country) filter['location.country'] = country;

            console.log(`Browsing Filter:`, JSON.stringify(filter));
            dbResults = await Company.find(filter).limit(10).lean();
            console.log(`Browsing Results: ${dbResults.length}`);
            dbResults.forEach(r => console.log(` - ${r.name} (${r.industry})`));
        }

    } catch (err) {
        console.error("Test Error:", err);
    }
}


async function run() {
    if (!process.env.MONGODB_URI) {
        console.error("Please set MONGODB_URI in .env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    // Test cases
    await testSearch('Beauty', '', ''); // Natural language
    await testSearch('', 'Beauty / Consumer Goods / Food', ''); // Filter only (simulate browsing)
    await testSearch('Cosmetics', 'Beauty / Consumer Goods / Food', ''); // Mixed

    await mongoose.disconnect();
}


run();

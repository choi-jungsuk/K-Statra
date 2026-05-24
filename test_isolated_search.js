require('dotenv').config();
const mongoose = require('mongoose');
const { Company } = require('./src/models/Company');
const { embed } = require('./src/providers/embeddings');

async function testIsolatedVectorSearch() {
    await mongoose.connect(process.env.MONGODB_URI);

    const q = "Recommend me some reliable autoparts exporters in Korea";
    console.log(`Embedding query: ${q}`);
    const vector = await embed(q);

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

    console.log("Running Vector Search without regex $match...");
    console.time("vector_search1");
    await Company.aggregate(pipeline);
    console.timeEnd("vector_search1");

    // Test with regex MATCH
    const matchStage = {
        industry: { $not: { $regex: /Investment|Fund|Asset|Capital/i } },
        name: { $not: { $regex: /Investment|Fund|Asset|Capital/i } }
    };

    pipeline.push({ $match: matchStage });

    console.log("Running Vector Search WITH regex $match...");
    console.time("vector_search2");
    await Company.aggregate(pipeline);
    console.timeEnd("vector_search2");

    mongoose.disconnect();
}

testIsolatedVectorSearch();

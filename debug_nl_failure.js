require('dotenv').config();
const mongoose = require('mongoose');
const { Company } = require('./src/models/Company');
const { embed } = require('./src/providers/embeddings');
const { chat } = require('./src/providers/chat/openai');

// Connect to the DB
async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const query = "친환경 패키징 업체를 찾아줘";
        console.log(`\nTesting Query: "${query}"`);

        // 1. Test Router Logic
        const routerPrompt = `
            You are a search router for a B2B matching platform specialized in "K-Beauty, Cosmetics, Food, and Consumer Goods".
            User Query: "${query}"
            
            Task: Determine if this query falls within our specialized domain.
            - If the query is about Beauty, Cosmetics, Skincare, Makeup, Food, Supplements, or general Consumer Goods, output "DB".
            - If the query is about Automotive, Machinery, Construction, IT, Electronics, or any other unrelated industry, output "WEB".
            - If unsure, output "DB".
            
            Output only one word: "DB" or "WEB".
            `;
        const decision = await chat([{ role: 'user', content: routerPrompt }]);
        console.log(`[Router] Decision: ${decision}`);

        // 2. Test Vector Search
        console.log('Generating embedding...');
        const vector = await embed(query);
        console.log(`Vector generated (len: ${vector.length})`);

        const pipeline = [
            {
                $vectorSearch: {
                    index: process.env.ATLAS_VECTOR_INDEX || 'vector_index',
                    path: 'embedding',
                    queryVector: vector,
                    numCandidates: 100,
                    limit: 10
                }
            },
            {
                $project: {
                    name: 1,
                    industry: 1,
                    profileText: 1,
                    score: { $meta: 'vectorSearchScore' }
                }
            }
        ];

        console.log('Running Vector Search...');
        const results = await Company.aggregate(pipeline);
        console.log(`Results Found: ${results.length}`);
        results.forEach(r => {
            console.log(`- ${r.name} (${r.industry}) Score: ${r.score}`);
            console.log(`  Profile: ${r.profileText ? r.profileText.substring(0, 50) : 'N/A'}...`);
        });

        // 3. Check what kind of data we actually have
        console.log('\n--- Data Check (Packaging) ---');
        const regexResults = await Company.find({
            $or: [
                { name: /packaging/i },
                { profileText: /packaging/i },
                { industry: /packaging/i },
                { name: /패키징/ },
                { profileText: /패키징/ }
            ]
        }).limit(5).select('name industry profileText embedding');

        console.log(`Regex check found ${regexResults.length} companies with "packaging"/"패키징"`);
        regexResults.forEach(r => {
            console.log(`- ${r.name} (${r.industry}) HasEmbedding: ${r.embedding && r.embedding.length > 0}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

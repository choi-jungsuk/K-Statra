
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// MOCK OR REAL TEST for CLIP
// Since we might not have a GPU locally, we rely on HF Inference API
async function testClip() {
    const apiToken = process.env.HF_API_TOKEN;
    if (!apiToken) {
        console.error("Please set HF_API_TOKEN in .env to test CLIP.");
        return;
    }

    // CLIP Model
    const model = "openai/clip-vit-base-patch32";
    const url = `https://api-inference.huggingface.co/models/${model}`;

    console.log(`Testing CLIP with model: ${model}`);

    // Test 1: Zero-Shot Image Classification (Standard CLIP usage on HF API)
    // Sending Candidate Labels + Image
    try {
        const response = await axios.post(
            url,
            {
                inputs: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Amorepacific_Headquarters.jpg/800px-Amorepacific_Headquarters.jpg", // Sample image
                parameters: {
                    candidate_labels: ["cosmetics company building", "food truck", "university"]
                }
            },
            {
                headers: { Authorization: `Bearer ${apiToken}` }
            }
        );
        console.log("Zero-Shot Classification Result:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("CLIP Method 1 Failed:", err.response?.data || err.message);
    }

    // Test 2: Feature Extraction (Getting Embeddings)
    // NOTE: HF Inference API 'feature-extraction' for CLIP might work differently.
    const embedUrl = `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`;
    try {
        const textRes = await axios.post(
            embedUrl,
            { inputs: "A cosmetics company logo" },
            { headers: { Authorization: `Bearer ${apiToken}` } }
        );
        console.log(`Text Embedding works? Length: ${textRes.data.length} (Sample: ${textRes.data[0]}...)`);
    } catch (err) {
        console.error("CLIP Feature Extraction Failed:", err.response?.data || err.message);
        console.log("Note: Getting raw embeddings from CLIP via HF API often requires 'sentence-transformers/clip-ViT-B-32' or similar mapped models.");
    }
}

testClip();

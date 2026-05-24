const mongoose = require('mongoose');
require('dotenv').config();
const { Company } = require('../src/models/Company');

async function countAutomotive() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const automotiveRegex = /자동차|부품|Automotive|Car parts|EV|Machinery|parts/i;
        const filter = {
            $or: [
                { industry: { $regex: automotiveRegex } },
                { tags: { $in: [automotiveRegex] } },
                { name: { $regex: automotiveRegex } },
                { profileText: { $regex: automotiveRegex } }
            ]
        };
        const count = await Company.countDocuments(filter);
        console.log(`Automotive Companies: ${count}`);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
countAutomotive();

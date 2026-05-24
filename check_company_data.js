
const mongoose = require('mongoose');
require('dotenv').config();
const { Company } = require('./src/models/Company');

async function checkCompany() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const company = await Company.findOne({ name: { $regex: 'Amorepacific', $options: 'i' } });

        if (company) {
            console.log('Company Found:', company.name);
            console.log('DART Field:', JSON.stringify(company.dart, null, 2));
            console.log('Has dart.corpCode:', company.dart && company.dart.corpCode ? 'YES' : 'NO');
        } else {
            console.log('Company not found');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkCompany();

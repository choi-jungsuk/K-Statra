const http = require('http');

const testSearch = (q) => {
    const start = Date.now();
    const path = `/partners/search?q=${encodeURIComponent(q)}`;
    
    const options = {
        hostname: 'localhost',
        port: 4000,
        path: path,
        method: 'GET',
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            const duration = Date.now() - start;
            console.log(`\nQuery: "${q}"`);
            console.log(`Duration: ${duration} ms`);
            if (res.statusCode === 200) {
                const parsed = JSON.parse(data);
                console.log(`\n[Recommendations Found: ${parsed.data ? parsed.data.length : 0}]`);
                if (parsed.data) {
                    parsed.data.forEach((c, i) => {
                        console.log(`${i+1}. ${c.name}`);
                        console.log(`   Location: ${c.location?.city || 'N/A'}, ${c.location?.country || 'Colombia'}`);
                        console.log(`   Profile: ${c.profileText?.substring(0, 150)}...`);
                        console.log(`   Website: ${c.website || 'N/A'}`);
                        console.log('---');
                    });
                }
                if (parsed.aiResponse) {
                    console.log(`\nAI Insight: ${parsed.aiResponse}`);
                }
            } else {
                console.log(`Error: ${res.statusCode}`);
            }
        });
    });
    req.on('error', (e) => console.error(e.message));
    req.end();
};

testSearch('콜롬비아의 자동차부품 수입업체');

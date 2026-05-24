const http = require('http');

const testSearch = (q, industry) => {
    const start = Date.now();
    const path = `/partners/search?q=${encodeURIComponent(q)}${industry ? '&industry=' + encodeURIComponent(industry) : ''}`;
    
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
            console.log(`\nQuery: "${q}" | Filter: "${industry || 'None'}"`);
            console.log(`Completed in ${duration} ms ( ${duration / 1000}s )`);
            if (res.statusCode === 200) {
                const parsed = JSON.parse(data);
                console.log(`Results: ${parsed.data ? parsed.data.length : 0}`);
                if (parsed.data && parsed.data.length > 0) {
                   console.log(`Sample: ${parsed.data[0].name} | ${parsed.data[0].industry}`);
                }
            } else {
                console.log(`Error: ${res.statusCode}`);
            }
        });
    });
    req.on('error', (e) => console.error(e.message));
    req.end();
};

// Test 1: New Query with Filter (Should be faster than 14s if pre-filtering works)
testSearch('Sustainable products', 'Beauty / Consumer Goods / Food');

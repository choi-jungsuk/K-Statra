const http = require('http');

const testSearch = () => {
    const start = Date.now();

    // Make sure the server is running on port 4000 (standard for DemoStatra)
    const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/partners/search?q=' + encodeURIComponent('Recommend me some reliable autoparts exporters in Korea'),
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            const duration = Date.now() - start;
            console.log(`\n======================================`);
            console.log(`Search Completed in ${duration} ms ( ${duration / 1000} seconds )`);
            console.log(`Status Code: ${res.statusCode}`);
            console.log(`Response Length: ${data.length} bytes`);
            if (res.statusCode === 200) {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`Results Found: ${parsed.data ? parsed.data.length : 0}`);
                    if (parsed.data) {
                        parsed.data.forEach(c => console.log(`- ${c.name} | ${c.industry} | ${c.location?.country || 'N/A'}`));
                    }
                    console.log(`Search Type: ${parsed.debug?.searchType || 'Unknown'}`);
                } catch (e) {
                    console.log("Could not parse JSON response");
                }
            } else {
                console.log(`Response snippet: \n${data.substring(0, 500)}`);
            }
            console.log(`======================================\n`);
        });
    });

    req.on('error', (e) => {
        const duration = Date.now() - start;
        console.error(`Request Failed after ${duration}ms: ${e.message}`);
        console.error(`Make sure the backend server (npm run dev) is running on port 4000.`);
    });

    req.end();
};

testSearch();

const http = require('http');

function checkUrl(url) {
    http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => console.log(`[${url}] Status: ${res.statusCode}, Data: ${data}`));
    }).on('error', (err) => {
        console.error(`[${url}] Error: ${err.message}`);
    });
}

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

checkUrl(`${BASE_URL}/api/timer`);
checkUrl(`${BASE_URL}/api/announcement`);

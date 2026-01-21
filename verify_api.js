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

checkUrl('http://localhost:5000/api/timer');
checkUrl('http://localhost:5000/api/announcement');

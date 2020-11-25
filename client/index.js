const fs = require("fs");
const pfs = require('fs').promises;
const http = require('http');

// Http connection info
const options = {
    hostname: 'road.urbanscience.uos.ac.kr',
    port: 80,
    path: '/api/data',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': 0
    }
};


// Already processed files
let processed = [];
fs.watch(__dirname, async (event, file) => {
    if (event == 'change') return;
    if (processed.indexOf(file) >= 0) return;
    if (!file.endsWith('.csv')) return;
    processed.push(file);
    if (fs.existsSync(file)) {
        const csv = fs.readFileSync(file, { encoding: 'utf-8' });
        const lines = csv.split('\n');
        const dataLine = lines[7];
        const dataJson = JSON.stringify(dataLine.split(',').map(x => +x));

        options.headers["Content-Length"] = dataJson.length;

        const req = http.request(options, res => {
            res.on('data', d => process.stdout.write(d));
        });
        req.on('error', error => {
            console.error(error);
        });
        req.write(dataJson);
        req.end();
    }
});
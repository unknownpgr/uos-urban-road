const fs = require("fs");
const pfs = require('fs').promises;
const http = require('http');

function sendData(jsonString) {

    // Http connection info
    const options = {
        hostname: 'road.urbanscience.uos.ac.kr',
        port: 80,
        path: '/api/data',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': jsonString.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('close', () => resolve(data));
        });
        req.on('error', reject);
        req.write(jsonString);
        req.end();
    });
}


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
        const [max_load, max_dist, e_inv] = lines[7].replace(/\r/g, '').split(',').map(x => +x);
        const data = {
            date: Math.floor(Date.now() / 1000),
            long: 0,
            lat: 0,
            alt: 0,
            max_load,
            max_dist,
            e_inv
        };
        console.log('DATA : ', data);
        const dataJson = JSON.stringify(data);
        const response = await sendData(dataJson);
        console.log('RESPONSE : ', response);
    }
});
const fs = require("fs");
const pfs = require('fs').promises;
const http = require('http');
const { spawn } = require('child_process');

const LOG_SENSOR = true;
const LOG_GPS = false;
const LOG_STREAM = false;

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


let gps_lat = -1, gps_long = -1, gps_alt = -1;


// Already processed files
let processed = [];
fs.watch(__dirname, (event, file) => {
    if (event == 'change') return;
    if (processed.indexOf(file) >= 0) return;
    if (!file.endsWith('.csv')) return;
    processed.push(file);
    if (fs.existsSync(file)) {
        let intervalID = setInterval(async () => {
            try {
                const csv = fs.readFileSync(file, { encoding: 'utf-8' });
                const lines = csv.split('\n');
                const [max_load, max_dist, e_inv] = lines[7].replace(/\r/g, '').split(',').map(x => +x);
                const data = {
                    date: Math.floor(Date.now() / 1000),
                    long: gps_long,
                    lat: gps_lat,
                    alt: gps_alt,
                    max_load,
                    max_dist,
                    e_inv
                };
                const dataJson = JSON.stringify(data);
                const response = await sendData(dataJson);
                if (LOG_SENSOR) {
                    console.log('DATA : ', data);
                    console.log('RESPONSE : ', response);
                }
                clearInterval(intervalID);
            } catch {
                console.log('File read failed...Try after 1 second');
            }
        }, 1000);
    }
});

// GPS serial reader subprocess
{
    const gpsClient = spawn('python', ['gps-client.py']);
    gpsClient.stdout.on('data', (data) => {
        try {
            let [a, b, c] = data.toString().replace(/\n|\r/g, '').split(',');
            gps_lat = +a;
            gps_long = +b;
            gps_alt = +c;
            if (LOG_GPS) console.log('Current position = ', gps_lat, gps_long, gps_alt, '(Lat,Long,Alt)');
        } catch {
            gps_lat = gps_long = gps_alt = -2;
        }
    });

}

// Camera streaming subprocess
{
    const camStreaming = spawn('python', ['cam-client.py']);
    camStreaming.stdout.on('data', (data) => {
        try {
            let res = JSON.parse(data.toString());
            if (LOG_STREAM) console.log('Camera streaming = ', res);
        } catch {
            console.log("Camera data sending failed");
        }
    });
}

console.log("Client started");
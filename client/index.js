const fs = require("fs");
const http = require('http');
const { spawn } = require('child_process');

const LOG_SENSOR = true;
const LOG_GPS = true;
const LOG_STREAM = false;

function sendData(path, jsonString) {

    // Http connection info
    const options = {
        hostname: 'road.urbanscience.uos.ac.kr',
        port: 80,
        path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': jsonString.length
        }
    };

    // Create promise for http response
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

// Variable is constant, but attribute is mutable.
const gps_data = {
    lat: -1,
    long: -1,
    alt: -1
};

// Already processed files
let processed = [];
fs.watch(__dirname, (event, file) => {

    // Ignore meaningless events
    if (event == 'change') return;
    if (!file.endsWith('.csv')) return;
    if (processed.indexOf(file) >= 0) return;
    if (!fs.existsSync(file)) return;

    // Retry until file parse success
    processed.push(file);
    let intervalID = setInterval(async () => {
        try {
            // Parse file and get required data
            const csv = fs.readFileSync(file, { encoding: 'utf-8' });
            const lines = csv.split('\n');
            const [max_load, max_dist, e_inv] = lines[7].replace(/\r/g, '').split(',').map(x => +x);

            // Send data to API server
            const data = {
                date: Math.floor(Date.now() / 1000),
                max_load,
                max_dist,
                e_inv,
                ...gps_data
            };
            const dataJson = JSON.stringify(data);
            const response = await sendData('/api/data', dataJson);

            // Parse response
            if (LOG_SENSOR) {
                console.log('DATA : ', data);
                console.log('RESPONSE : ', response);
            }
            clearInterval(intervalID);
        } catch {
            console.log('File read failed...Try after 1 second');
        }
    }, 1000);
});

// GPS serial reader subprocess
{
    const gpsClient = spawn('python', ['gps-client.py']);
    gpsClient.stdout.on('data', (data) => {
        if (!data) return;
        let dataString = data.toString().replace(/\n|\r/g, '');
        try {
            // Data contains coordinate data 
            if (dataString.startsWith('DATA')) {
                dataString = dataString.substring(4);

                // Parse data
                let [a, b, c] = dataString.split(',');

                // Update gps position
                gps_data.lat = +a;
                gps_data.long = +b;
                gps_data.alt = +c;

                // Log
                if (LOG_GPS) {
                    console.log(
                        'Current position = ',
                        gps_data.lat,
                        gps_data.long,
                        gps_data.alt,
                        '(Lat,Long,Alt)');
                }
            } else {
                // Data is just an error message
                if (LOG_GPS) console.log(dataString);
            }
        } catch {
            // Process errors
            gps_data.lat = gps_data.long = gps_data.alt = -2;
        }
    });

}

// Camera streaming subprocess
{
    const camStreaming = spawn('python', ['cam-client.py']);
    camStreaming.stdout.on('data', (data) => {
        try {
            // Just print stdout
            let res = JSON.parse(data.toString());
            if (LOG_STREAM) console.log('Camera streaming = ', res);
        } catch {
            console.log("Camera data sending failed");
        }
    });
}

console.log("Client started");
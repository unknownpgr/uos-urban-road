const fs = require("fs");
const http = require('http');
const { spawn } = require('child_process');
const setting = require('./setting.js');

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

// LWD file watch
{
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
                if (setting.log_sensor) {
                    console.log('[LWD]', 'DATA : ', data);
                    console.log('[LWD]', 'RESPONSE : ', response);
                }
                clearInterval(intervalID);
            } catch {
                console.log('[LWD]', 'File read failed...Try after 1 second');
            }
        }, 1000);
    });
}

// GPS serial reader subprocess
{
    const gpsClient = spawn('python', ['gps-client.py']);
    gpsClient.stdout.on('data', (data) => {
        if (!data) return;
        let dataString = data.toString('utf-8').replace(/\n|\r/g, '');
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
                if (setting.log_gps) {
                    console.log('[GPS]',
                        'Current position = ',
                        gps_data.lat,
                        gps_data.long,
                        gps_data.alt,
                        '(Lat,Long,Alt)');
                }
            } else {
                // Data is just an error message
                if (setting.log_gps) console.log('[GPS]', dataString);
            }
        } catch (e) {
            console.log('[GPS]', e);
            // Process errors
            gps_data.lat = gps_data.long = gps_data.alt = -2;
        }
    });

}

// Camera streaming subprocess
{
    const camStreaming = spawn('python', [setting.camera_mode, ...setting.camera_indexes]);
    camStreaming.stdout.on('data', (data) => {
        if (setting.log_camera) console.log('[CAM]', data.toString('utf-8').trim());
    });
}

console.log(`

           [ 토공다짐도 자동화장비 클라이언트 프로그램 ]

    이 프로그램은 LWD 프로그램이 생성한 토공다짐도 측정 결과 데이터,
    카메라 데이터, GNSS 정보를 서버로 전송하기 위한 프로그램입니다.

    < 프로그램 설정 방법 >
    프로그램의 설정을 위해서는 setting.js 파일을 수정해주시면 됩니다.
    setting.js 내부에 설정 방법이 적혀 있습니다.
    setting.js 파일을 수정하신 후에는 프로그램을 껐다 켜 주시면 변경된 설정이 반영됩니다.

    < 오류가 발생했을 경우 >
    상황에 따라 GPS가 연결되어있음에도 불구하고 GPS를 인식하지 못하는 경우가 발생할 수 있습니다.
    LWD 프로그램과 이 프로그램이 충돌했을 경우에 그런 문제가 발생할 수 있습니다.
    그럴 경우 LWD프로그램은 그대로 켜 놓고, 이 프로그램을 종료했다가 5~10초 정도 기다린 뒤 다시 켜 주시기 바랍니다.

    < 프로그램 종료 방법 >
    프로그램을 끄기 위해서는 창을 닫으시면 됩니다.
    혹은 Ctrl+C를 누르신 후, 프로그램을 종료할지 묻는 메시지가 뜨면 Y를 입력하시고 엔터를 누르셔도 됩니다.

`);
console.log('Setting : ');
console.log(setting);
console.log();
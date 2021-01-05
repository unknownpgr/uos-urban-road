import { add, inv, multiply, subtract, transpose } from "mathjs";

function createCaliPoint(idx, label, useX = true) {
    return {
        idx,
        label,
        useX,
        imgX: 0,
        imgY: 0,
        gpsX: 0,
        gpsY: 0,
    };
}

// Check if given calibration point is set (all required data are entered)
function isSet(point) {
    if (point.useX) {
        return point.gpsX * point.gpsY > 0;
    } else {
        return point.gpsY > 0;
    }
}

// Convert mouse position to canvas pixel position.
function px2cnv(cnv, x, y) {
    let rect = cnv.getBoundingClientRect();
    let scaleX = cnv.width / rect.width;
    let scaleY = cnv.height / rect.height;
    let x_ = (x - rect.left) * scaleX;
    let y_ = (y - rect.top) * scaleY;
    return [x_, y_, scaleX, scaleY];
}

// Calculate GPS to Canvas projection matrix
function getProjectionMatrix(pointA, pointB, flip = true) {
    try {
        const ROTATATION = [
            [0, 1, 0],
            [-1, 0, 0],
            [0, 0, 1],
        ];

        let img1 = [pointA.imgX, pointA.imgY, 1];
        let img2 = [pointB.imgX, pointB.imgY, 1];
        let img3 = add(img1, multiply(ROTATATION, subtract(img2, img1)));

        let gps1 = [pointA.gpsX, pointA.gpsY, 1];
        let gps2 = [pointB.gpsX, pointB.gpsY, 1];
        let gps3;
        if (!flip) {
            gps3 = add(gps1, multiply(ROTATATION, subtract(gps2, gps1)));
        } else {
            gps3 = add(gps1, multiply(transpose(ROTATATION), subtract(gps2, gps1)));
        }

        let img = transpose([img1, img2, img3]);
        let gps = transpose([gps1, gps2, gps3]);

        let ii = inv(img);
        let M = multiply(gps, ii);
        return M;
    } catch {
        return [[0, 0, 0], [0, 0, 0][(0, 0, 0)]];
    }
}

// Horizontal projection
function projectH(M, x, y) {
    try {
        let [x_, y_] = multiply(M, [[x], [y], [1]]);
        return [x_[0], y_[0]];
    } catch {
        return [0, 0];
    }
}

// Vertical projection
function projectV(pA, pB, y, reverse = false) {
    if (reverse) return pA.gpsY + ((y - pA.imgY) * (pB.gpsY - pA.gpsY)) / (pB.imgY - pA.imgY);
    else return pA.imgY + ((y - pA.gpsY) * (pB.imgY - pA.imgY)) / (pB.gpsY - pA.gpsY);
}

export { createCaliPoint, isSet, px2cnv, getProjectionMatrix, projectH, projectV };
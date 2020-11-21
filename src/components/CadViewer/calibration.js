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

function isSet(point) {
    if (point.useX) {
        return point.gpsX * point.gpsY > 0;
    } else {
        return point.gpsY > 0;
    }
}

export { createCaliPoint, isSet };
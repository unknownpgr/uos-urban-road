function getCali(idx, label, useX = true) {
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

const setter = (component, point) => (key) => (value) => component.setState(state => {
    let newState = { ...state };
    newState.cali[point.idx][key] = value;
    return newState;
});

export { getCali, isSet, setter };
function fsBool(bool) {
    if (bool === true) {
        return true;
    } else if (bool === false) {
        return false;
    } else return null;
}

function fsNum(i) {
    return Number.isInteger(i) ? i : null;
}

function fsStr(s) {
    return typeof s === 'string' || s instanceof String ? s : null;
}

function getBatteryInfo() {
    let promise;
    if (window.navigator?.getBattery) {
        promise = window.navigator.getBattery();
    } else {
        promise = Promise.resolve({})
    }

    return promise
        .then(battery => {
            battery = battery ?? {};

            return {
                charging: fsBool(battery.charging),
                charging_time: fsNum(battery.chargingTime),
                discharging_time: fsNum(battery.dischargingTime),
                level: fsNum(battery.level),
            };
        });
}

function getGpuInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return Promise.resolve({
                    vendor: fsStr(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)),
                    renderer: fsStr(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
                });
            }
        }
    } catch (e) {
    }

    return Promise.resolve({
        vendor: null,
        renderer: null,
    });
}

function getNavigatorInfo() {
    const n = window.navigator ?? {};

    let languages;
    if (n.languages && n.languages.length > 0) {
        languages = n.languages.join(',');
    } else {
        languages = null;
    }

    return Promise.resolve({
        app_version: fsStr(n.appVersion),
        device_memory: fsNum(n.deviceMemory),
        hardware_concurrency: fsNum(n.hardwareConcurrency),
        language: fsStr(n.language),
        languages,
        max_touch_points: fsNum(n.maxTouchPoints),
        oscpu: fsStr(n.oscpu),
        platform: fsStr(n.platform),
        useragent: fsStr(n.userAgent),
        vendor: fsStr(n.vendor),
    });
}

function getNetworkInfo() {
    const c = window.navigator?.connection ?? {};

    return Promise.resolve({
        effective_type: fsStr(c.effectiveType),
        downlink: fsNum(c.downlink),
        rtt: fsNum(c.rtt),
        save_data: fsBool(c.saveData),
    })
}

function getScreenInfo() {
    const s = window.screen ?? {};

    return Promise.resolve({
        width: fsNum(s.width),
        height: fsNum(s.height),
        avail_width: fsNum(s.availWidth),
        avail_height: fsNum(s.availHeight),
        color_depth: fsNum(s.colorDepth),
        pixel_depth: fsNum(s.pixelDepth),
        device_pixel_ratio: fsNum(window.devicePixelRatio),
    });
}

function getTimezoneInfo() {
    try {
        const timezone = fsStr(Intl.DateTimeFormat().resolvedOptions().timeZone);
        return Promise.resolve(timezone);
    }
    catch (e) {
        return Promise.resolve(null);
    }
}


function getAllInfo() {
    return Promise.all([
        getBatteryInfo(),
        getGpuInfo(),
        getNavigatorInfo(),
        getNetworkInfo(),
        getScreenInfo(),
        getTimezoneInfo(),
        //getWebRtcInfo(),
    ]).then(([battery, gpu, navigator, network, screen, timezone]) => {
        return {
            battery,
            gpu,
            navigator,
            network,
            screen,
            timezone,
        };
    });
}

function sendData(url, data) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.onerror = () => reject(xhr.statusText);
        xhr.onabort = () => reject();
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject(xhr.statusText);
            }
        }

        xhr.send(data);
    });
}

function tick() {
    getAllInfo()
        .then(data => sendData('/fp', JSON.stringify(data)))
        .catch(() => {});
}

setInterval(tick, 60000);
tick();

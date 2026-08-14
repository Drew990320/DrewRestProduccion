"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localWebApkPath = localWebApkPath;
exports.resolveApkDownloadUrl = resolveApkDownloadUrl;
const fs_1 = require("fs");
const path_1 = require("path");
const distribucion_enlaces_1 = require("./distribucion-enlaces");
const APK_RELATIVE = [
    ['drewrest.apk'],
    ['DrewRest.apk'],
    ['apk', 'drewrest.apk'],
    ['apk', 'DrewRest.apk'],
];
function localWebApkPath(cwd = process.cwd()) {
    const roots = [
        (0, path_1.join)(cwd, '..', 'web'),
        (0, path_1.join)(cwd, '..', '..', 'web'),
        (0, path_1.join)(cwd, '..', '..', 'DrewRest', 'web'),
        (0, path_1.join)(cwd, '..', 'DrewRest', 'web'),
        (0, path_1.join)(cwd, 'web'),
        (0, path_1.join)(cwd, '..', '..', 'apps', 'mobile', 'apk'),
        (0, path_1.join)(cwd, '..', 'apps', 'mobile', 'apk'),
        (0, path_1.join)(cwd, '..', '..', '..', 'apps', 'mobile', 'apk'),
    ];
    for (const root of roots) {
        for (const rel of APK_RELATIVE) {
            const p = (0, path_1.join)(root, ...rel);
            if ((0, fs_1.existsSync)(p))
                return p;
        }
        for (const name of ['drewrest.apk', 'DrewRest.apk']) {
            const p = (0, path_1.join)(root, name);
            if ((0, fs_1.existsSync)(p))
                return p;
        }
    }
    return null;
}
function withHttp(url) {
    const t = url.trim().replace(/\/$/, '');
    if (!t)
        return t;
    if (/^https?:\/\//i.test(t))
        return t;
    if (/^(\d{1,3}\.){3}\d{1,3}/.test(t) || /^localhost\b/i.test(t)) {
        return `http://${t}`;
    }
    return t;
}
function resolveApkDownloadUrl(opts) {
    const env = process.env.MOBILE_APK_DOWNLOAD_URL?.trim();
    if (env)
        return withHttp(env);
    const fromDist = (0, distribucion_enlaces_1.leerDistribucionEnlaces)(opts.cwd).url_apk_movil?.trim();
    if (fromDist)
        return withHttp(fromDist);
    if (opts.ip && localWebApkPath(opts.cwd)) {
        return `http://${opts.ip}:${opts.apiPort}/descargar-app`;
    }
    return null;
}
//# sourceMappingURL=apk-download.js.map
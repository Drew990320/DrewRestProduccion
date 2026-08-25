"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileDownloadController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const red_local_1 = require("./red-local");
const apk_download_1 = require("./apk-download");
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function qrImg(data) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&margin=8&data=${encodeURIComponent(data)}`;
}
let MobileDownloadController = class MobileDownloadController {
    downloadApk(res) {
        const apk = (0, apk_download_1.localWebApkPath)();
        if (!apk) {
            res
                .status(404)
                .type('text/plain; charset=utf-8')
                .send('APK no encontrado. Coloca DrewRest.apk en DrewRest/web o apps/mobile/apk.');
            return;
        }
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="DrewRest.apk"');
        res.setHeader('Cache-Control', 'no-store');
        res.sendFile(apk);
    }
    descargarApp(res) {
        const apk = (0, apk_download_1.localWebApkPath)();
        const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Descargar DrewRest</title>
<style>
body{font-family:sans-serif;background:#EDF3FA;color:#1a1a1a;margin:0;padding:24px;text-align:center}
a{display:inline-block;margin-top:16px;padding:14px 22px;background:#1B4F8A;color:#fff;text-decoration:none;border-radius:10px;font-weight:700}
p{line-height:1.45;color:#334;max-width:28rem;margin:12px auto}
</style></head><body>
<h1>Instalar DrewRest</h1>
${apk
            ? `<p>Pulsa el botón para descargar el APK. Luego permite instalar apps de origen desconocido.</p>
<p><a href="/drewrest.apk">Descargar DrewRest.apk</a></p>
<script>setTimeout(function(){ location.href='/drewrest.apk'; }, 400);</script>`
            : `<p>No hay APK en este PC. Coloca DrewRest.apk en DrewRest\\web.</p>`}
</body></html>`;
        res.type('html').send(html);
    }
    vincular(apiRaw, res) {
        const api = (apiRaw || '').trim();
        const apiEnc = encodeURIComponent(api);
        const deep = api ? `drewrest://pair?api=${apiEnc}` : 'drewrest://pair';
        const intent = api
            ? `intent://pair?api=${apiEnc}#Intent;scheme=drewrest;package=com.drewrest.app;end`
            : 'intent://pair#Intent;scheme=drewrest;package=com.drewrest.app;end';
        const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Vincular DrewRest</title>
<style>
body{font-family:sans-serif;background:#EDF3FA;color:#1a1a1a;margin:0;padding:24px;text-align:center}
a{display:inline-block;margin:10px 8px 0;padding:14px 20px;background:#1B4F8A;color:#fff;text-decoration:none;border-radius:10px;font-weight:700}
a.secondary{background:#fff;color:#1B4F8A;border:2px solid #1B4F8A}
p{line-height:1.45;color:#334;max-width:28rem;margin:12px auto}
</style></head><body>
<h1>Vincular DrewRest</h1>
<p>Si ya instalaste la app, pulsa <b>Abrir DrewRest</b>.</p>
<p>
  <a id="open" href="${escapeHtml(deep)}">Abrir DrewRest</a>
  <a class="secondary" href="/descargar-app">Descargar APK</a>
</p>
<script>
(function(){
  var android = /Android/i.test(navigator.userAgent || '');
  var href = android ? ${JSON.stringify(intent)} : ${JSON.stringify(deep)};
  document.getElementById('open').setAttribute('href', href);
  if (android) setTimeout(function(){ location.href = href; }, 400);
})();
</script>
</body></html>`;
        res.type('html').send(html);
    }
    abrirWeb(toRaw, res) {
        const lan = (0, red_local_1.detectarRedLocal)();
        const webPort = (0, red_local_1.leerPuertoWeb)();
        const ip = lan?.ip ?? null;
        let target = ip ? `http://${ip}:${webPort}/login` : '';
        if (toRaw?.trim() && ip) {
            try {
                const u = new URL(toRaw.trim());
                if ((u.protocol === 'http:' || u.protocol === 'https:') &&
                    u.hostname === ip) {
                    target = `${u.protocol}//${u.host}${u.pathname || '/'}${u.search}`;
                }
            }
            catch {
            }
        }
        if (!target) {
            res.type('html').send(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Abrir web</title></head><body style="font-family:sans-serif;padding:24px;background:#EDF3FA"><h1>Sin IP de red</h1><p>Conecta este PC al Wi‑Fi del restaurante y vuelve a escanear el QR.</p></body></html>`);
            return;
        }
        const safe = escapeHtml(target);
        const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="refresh" content="0;url=${safe}"/>
<title>Abrir DrewRest</title>
<style>
body{font-family:sans-serif;background:#EDF3FA;color:#1a1a1a;margin:0;padding:24px;text-align:center}
a{display:inline-block;margin-top:16px;padding:14px 22px;background:#1B4F8A;color:#fff;text-decoration:none;border-radius:10px;font-weight:700}
p{line-height:1.45;color:#334;max-width:28rem;margin:12px auto}
.url{display:block;margin-top:16px;padding:8px;background:#F4F7FB;border-radius:8px;font-size:12px;word-break:break-all;text-align:left}
</style>
</head><body>
<h1>Abrir DrewRest</h1>
<p>Si no redirige solo, pulsa el botón.</p>
<p><a href="${safe}">Abrir en el navegador</a></p>
<span class="url">${safe}</span>
<script>location.replace(${JSON.stringify(target)});</script>
</body></html>`;
        res.type('html').send(html);
    }
    conectar(res) {
        const lan = (0, red_local_1.detectarRedLocal)();
        const apiPort = Number(process.env.PORT ?? 3000);
        const apk = (0, apk_download_1.localWebApkPath)();
        if (!lan) {
            res.type('html').send(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>Conectar</title></head><body style="font-family:sans-serif;padding:24px"><h1>Sin IP de red</h1><p>Conecta este PC al Wi‑Fi o Ethernet del restaurante.</p></body></html>`);
            return;
        }
        const ip = lan.ip;
        const apiDirect = `http://${ip}:${apiPort}`;
        const webPort = (0, red_local_1.leerPuertoWeb)();
        const webDirect = `http://${ip}:${webPort}`;
        const webCamera = `${webDirect}/login`;
        const apkDirect = `${apiDirect}/descargar-app`;
        const apkCamera = apkDirect;
        const vincularDirect = `${apiDirect}/vincular?api=${encodeURIComponent(apiDirect)}`;
        const vincularCamera = vincularDirect;
        const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Conectar celular · DrewRest</title>
<style>
body{font-family:sans-serif;background:#EDF3FA;color:#1a1a1a;margin:0;padding:20px 16px 40px}
h1{text-align:center;margin:0 0 8px}
.lead{text-align:center;color:#445;max-width:36rem;margin:0 auto 20px;line-height:1.45}
.grid{display:flex;flex-wrap:wrap;gap:20px;justify-content:center}
.card{background:#fff;border:1px solid #c5d4e8;border-radius:14px;padding:16px;width:min(100%,320px);text-align:center}
.card h2{margin:0 0 8px;font-size:18px}
.card p{color:#445;font-size:14px;line-height:1.4}
img{width:220px;height:220px;background:#fff}
.url{display:block;margin-top:10px;padding:8px;background:#F4F7FB;border-radius:8px;font-size:12px;word-break:break-all;text-align:left}
a.btn{display:inline-block;margin-top:12px;padding:12px 18px;background:#1B4F8A;color:#fff;text-decoration:none;border-radius:10px;font-weight:700}
.warn{color:#8a3b00;font-size:13px}
</style></head><body>
<h1>Conectar celular</h1>
<p class="lead">Misma Wi‑Fi. Tres QR: descargar app, vincular local y abrir la página web.</p>
<div class="grid">
  <div class="card">
    <h2>1. Descargar app</h2>
    ${apk
            ? `<p><img alt="QR descargar" src="${qrImg(apkCamera)}"/></p>
           <a class="btn" href="/drewrest.apk">Descargar DrewRest.apk</a>
           <span class="url">${escapeHtml(apkDirect)}</span>`
            : `<p class="warn">No hay DrewRest.apk en este PC.</p>`}
  </div>
  <div class="card">
    <h2>2. Vincular local</h2>
    <p>Con la app instalada, escanea este QR.</p>
    <p><img alt="QR vincular" src="${qrImg(vincularCamera)}"/></p>
    <span class="url">${escapeHtml(vincularDirect)}</span>
  </div>
  <div class="card">
    <h2>3. Página web</h2>
    <p>Abre DrewRest en el navegador del celular.</p>
    <p><img alt="QR página web" src="${qrImg(webCamera)}"/></p>
    <span class="url">${escapeHtml(webDirect)}</span>
  </div>
</div>
</body></html>`;
        res.type('html').send(html);
    }
};
exports.MobileDownloadController = MobileDownloadController;
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)(['drewrest.apk', 'DrewRest.apk']),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MobileDownloadController.prototype, "downloadApk", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)(['descargar-app', 'descargar-app/']),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MobileDownloadController.prototype, "descargarApp", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)(['vincular', 'vincular/']),
    __param(0, (0, common_1.Query)('api')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MobileDownloadController.prototype, "vincular", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)(['abrir-web', 'abrir-web/']),
    __param(0, (0, common_1.Query)('to')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MobileDownloadController.prototype, "abrirWeb", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)(['conectar', 'conectar/']),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MobileDownloadController.prototype, "conectar", null);
exports.MobileDownloadController = MobileDownloadController = __decorate([
    (0, common_1.Controller)()
], MobileDownloadController);
//# sourceMappingURL=mobile-download.controller.js.map
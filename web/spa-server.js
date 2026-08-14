/**
 * Servidor estático mínimo para la app web (solo Node.js, sin npm ni internet).
 * Sirve la carpeta actual con fallback SPA → index.html
 * Si el puerto preferido está ocupado (p. ej. Postgres EDB en 8080), prueba el siguiente.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PREFERRED_PORT = Number(process.env.WEB_PORT || process.argv[2] || 8080);
const MAX_OFFSET = 24;
const ROOT = __dirname;
const PORT_FILE = path.join(ROOT, 'web-port.txt');
let LISTEN_PORT = PREFERRED_PORT;

/** Puertos reservados (p. ej. 8081 = Expo en desarrollo). No usar ni al buscar alternativa. */
const RESERVED_PORTS = new Set(
  String(process.env.WEB_PORT_SKIP || '8081')
    .split(/[,;\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0 && n < 65536),
);

function nextCandidatePort(port, preferred) {
  let next = port + 1;
  while (RESERVED_PORTS.has(next) && next <= preferred + MAX_OFFSET) {
    next += 1;
  }
  return next;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.apk': 'application/vnd.android.package-archive',
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded.replace(/^\/+/, '');
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) return null;
  return file;
}

/** Inyectado en index.html: bloquea Inspeccionar hasta que React autorice (superadmin). */
const OPERATOR_GUARD_SNIPPET = `
<script>
(function(){
  try { document.title = 'DrewRest'; } catch (e) {}
  window.__DREWREST_ALLOW_DEVTOOLS__ = false;
  function allowed(){ return !!window.__DREWREST_ALLOW_DEVTOOLS__; }
  function blockKey(e){
    if (allowed()) return;
    var k = e.key;
    var ctrl = e.ctrlKey || e.metaKey;
    if (k === 'F12') { e.preventDefault(); e.stopPropagation(); return; }
    if (ctrl && e.shiftKey && (k==='I'||k==='i'||k==='J'||k==='j'||k==='C'||k==='c')) {
      e.preventDefault(); e.stopPropagation(); return;
    }
    if (ctrl && !e.shiftKey && (k==='U'||k==='u')) {
      e.preventDefault(); e.stopPropagation();
    }
  }
  document.addEventListener('contextmenu', function(e){ if (!allowed()) e.preventDefault(); }, true);
  document.addEventListener('keydown', blockKey, true);
})();
</script>
`;

/** Conexión móvil del SPA → página /conectar (QRs que la cámara sí abre). */
const CONEXION_REDIRECT_SNIPPET = `
<script>
(function(){
  function go(){
    var p = location.pathname || '';
    if (p === '/conexion-movil' || p === '/conexion-movil/') {
      location.replace('/conectar');
    }
  }
  go();
  var push = history.pushState;
  history.pushState = function(){
    var r = push.apply(this, arguments);
    go();
    return r;
  };
  window.addEventListener('popstate', go);
})();
</script>
`;

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function sendHtml(res, html) {
  const buf = Buffer.from(html, 'utf8');
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store',
  });
  res.end(buf);
}

function sendApk(res, filePath, method) {
  const stat = fs.statSync(filePath);
  const headers = {
    'Content-Type': MIME['.apk'],
    'Content-Length': stat.size,
    'Content-Disposition': 'attachment; filename="DrewRest.apk"',
    'Cache-Control': 'no-store',
  };
  if (method === 'HEAD') {
    res.writeHead(200, headers);
    res.end();
    return;
  }
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

function sendIndex(res) {
  const indexPath = path.join(ROOT, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) {
      res.writeHead(500);
      res.end('index.html no encontrado');
      return;
    }
    let out = html;
    if (!/<title>\s*DrewRest\s*<\/title>/i.test(out)) {
      if (/<title>[^<]*<\/title>/i.test(out)) {
        out = out.replace(/<title>[^<]*<\/title>/i, '<title>DrewRest</title>');
      } else if (/<head[^>]*>/i.test(out)) {
        out = out.replace(/<head[^>]*>/i, (m) => `${m}<title>DrewRest</title>`);
      }
    }
    if (!out.includes('__DREWREST_ALLOW_DEVTOOLS__')) {
      if (/<\/head>/i.test(out)) {
        out = out.replace(/<\/head>/i, `${OPERATOR_GUARD_SNIPPET}${CONEXION_REDIRECT_SNIPPET}</head>`);
      } else {
        out = OPERATOR_GUARD_SNIPPET + CONEXION_REDIRECT_SNIPPET + out;
      }
    } else if (!out.includes('/conectar')) {
      if (/<\/head>/i.test(out)) {
        out = out.replace(/<\/head>/i, `${CONEXION_REDIRECT_SNIPPET}</head>`);
      } else {
        out = CONEXION_REDIRECT_SNIPPET + out;
      }
    }
    const buf = Buffer.from(out, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': buf.length,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'SAMEORIGIN',
    });
    res.end(buf);
  });
}

function resolveLocalApk() {
  const names = [
    'drewrest.apk',
    'DrewRest.apk',
    path.join('apk', 'drewrest.apk'),
    path.join('apk', 'DrewRest.apk'),
  ];
  for (const n of names) {
    const p = path.join(ROOT, n);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function sendDescargarApp(res) {
  const apk = resolveLocalApk();
  const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Descargar DrewRest</title>
<style>
body{font-family:sans-serif;background:#EDF3FA;color:#1a1a1a;margin:0;padding:24px;text-align:center}
a{display:inline-block;margin-top:16px;padding:14px 22px;background:#1B4F8A;color:#fff;text-decoration:none;border-radius:10px;font-weight:700}
p{line-height:1.45;color:#334;max-width:28rem;margin:12px auto}
.muted{color:#667;font-size:14px}
</style>
</head><body>
<h1>Instalar DrewRest</h1>
${
  apk
    ? `<p>Pulsa el botón para descargar el APK. Luego permite instalar apps de origen desconocido.</p>
<p><a href="/drewrest.apk">Descargar DrewRest.apk</a></p>
<p class="muted">Si no empieza sola, el botón descarga el archivo.</p>
<script>setTimeout(function(){ location.href='/drewrest.apk'; }, 500);</script>`
    : `<p>No hay APK en este PC. Coloca DrewRest.apk en la carpeta web y reinicia DrewRest.</p>`
}
</body></html>`;
  sendHtml(res, html);
}

function qrImgSrc(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&margin=8&data=${encodeURIComponent(data)}`;
}

function sendConectar(res) {
  const lan = findRestaurantLanIp();
  const apiPort = Number(process.env.PORT || 3000);
  const apkOk = Boolean(resolveLocalApk());
  if (!lan) {
    sendHtml(
      res,
      `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Conectar celular</title></head><body style="font-family:sans-serif;padding:24px;background:#EDF3FA"><h1>Sin IP de red</h1><p>Conecta este PC al Wi‑Fi o Ethernet del restaurante y recarga.</p></body></html>`,
    );
    return;
  }
  const ip = lan.address;
  const apiDirect = `http://${ip}:${apiPort}`;
  const webPort = LISTEN_PORT;
  const webDirect = `http://${ip}:${webPort}`;
  const webCamera = `http://${ip}.nip.io:${webPort}`;
  const apkDirect = `${apiDirect}/descargar-app`;
  const apkCamera = `http://${ip}.nip.io:${apiPort}/descargar-app`;
  const vincularDirect = `${apiDirect}/vincular?api=${encodeURIComponent(apiDirect)}`;
  const vincularCamera = `http://${ip}.nip.io:${apiPort}/vincular?api=${encodeURIComponent(apiDirect)}`;
  const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
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
code,.url{display:block;margin-top:10px;padding:8px;background:#F4F7FB;border-radius:8px;font-size:12px;word-break:break-all;text-align:left}
a.btn{display:inline-block;margin-top:12px;padding:12px 18px;background:#1B4F8A;color:#fff;text-decoration:none;border-radius:10px;font-weight:700}
.warn{color:#8a3b00;font-size:13px}
</style>
</head><body>
<h1>Conectar celular</h1>
<p class="lead">Misma Wi‑Fi. Tres QR: descargar app, vincular local y abrir la página web. Si la cámara no abre, copia la URL a Chrome.</p>
<div class="grid">
  <div class="card">
    <h2>1. Descargar app</h2>
    <p>Escanea, instala el APK y permite origen desconocido.</p>
    ${
      apkOk
        ? `<p><img alt="QR descargar" src="${qrImgSrc(apkCamera)}"/></p>
           <a class="btn" href="${apiDirect}/drewrest.apk">Descargar DrewRest.apk</a>
           <span class="url">${apkDirect}</span>`
        : `<p class="warn">No hay DrewRest.apk en la carpeta web de este PC.</p>`
    }
  </div>
  <div class="card">
    <h2>2. Vincular local</h2>
    <p>Con la app ya instalada, escanea este QR y pulsa Abrir DrewRest.</p>
    <p><img alt="QR vincular" src="${qrImgSrc(vincularCamera)}"/></p>
    <span class="url">${vincularDirect}</span>
  </div>
  <div class="card">
    <h2>3. Página web</h2>
    <p>Abre DrewRest en el navegador del celular (sin instalar).</p>
    <p><img alt="QR página web" src="${qrImgSrc(webCamera)}"/></p>
    <span class="url">${webDirect}</span>
  </div>
</div>
</body></html>`;
  sendHtml(res, html);
}

function sendVincular(res, reqUrl) {
  let api = '';
  try {
    const u = new URL(reqUrl, 'http://localhost');
    api = (u.searchParams.get('api') || '').trim();
  } catch {
    /* ignore */
  }
  const apiEnc = encodeURIComponent(api);
  const deep = api ? `drewrest://pair?api=${apiEnc}` : 'drewrest://pair';
  const intent = api
    ? `intent://pair?api=${apiEnc}#Intent;scheme=drewrest;package=com.drewrest.app;end`
    : 'intent://pair#Intent;scheme=drewrest;package=com.drewrest.app;end';
  const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Vincular DrewRest</title>
<style>
body{font-family:sans-serif;background:#EDF3FA;color:#1a1a1a;margin:0;padding:24px;text-align:center}
a{display:inline-block;margin:10px 8px 0;padding:14px 20px;background:#1B4F8A;color:#fff;text-decoration:none;border-radius:10px;font-weight:700}
a.secondary{background:#fff;color:#1B4F8A;border:2px solid #1B4F8A}
p{line-height:1.45;color:#334;max-width:28rem;margin:12px auto}
</style>
</head><body>
<h1>Vincular DrewRest</h1>
<p>Si ya instalaste la app, pulsa <b>Abrir DrewRest</b>. Si no, descarga el APK e instálala primero.</p>
<p>
  <a id="open" href="${deep}">Abrir DrewRest</a>
  <a class="secondary" href="/descargar-app">Descargar APK</a>
</p>
<script>
(function(){
  var ua = navigator.userAgent || '';
  var android = /Android/i.test(ua);
  var open = document.getElementById('open');
  var href = android ? ${JSON.stringify(intent)} : ${JSON.stringify(deep)};
  open.setAttribute('href', href);
  if (android) setTimeout(function(){ location.href = href; }, 400);
})();
</script>
</body></html>`;
  sendHtml(res, html);
}

function onRequest(req, res) {
  if (!req.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
    res.writeHead(405);
    res.end();
    return;
  }

  const pathOnly = req.url.split('?')[0];
  if (
    pathOnly === '/conectar' ||
    pathOnly === '/conectar/' ||
    pathOnly === '/conexion-movil' ||
    pathOnly === '/conexion-movil/'
  ) {
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end();
      return;
    }
    sendConectar(res);
    return;
  }
  if (pathOnly === '/vincular' || pathOnly === '/vincular/') {
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end();
      return;
    }
    sendVincular(res, req.url);
    return;
  }
  if (pathOnly === '/descargar-app' || pathOnly === '/descargar-app/') {
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end();
      return;
    }
    sendDescargarApp(res);
    return;
  }
  if (pathOnly === '/drewrest.apk' || pathOnly === '/DrewRest.apk') {
    const apk = resolveLocalApk();
    if (!apk) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('APK no encontrado. Coloca DrewRest.apk en la carpeta web.');
      return;
    }
    sendApk(res, apk, req.method);
    return;
  }

  const filePath = safePath(req.url === '/' ? '/index.html' : req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end();
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      if (req.method === 'HEAD') {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end();
        return;
      }
      // index.html siempre pasa por inyección de título + guardia de operador
      if (path.basename(filePath).toLowerCase() === 'index.html') {
        sendIndex(res);
        return;
      }
      sendFile(res, filePath);
      return;
    }
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end();
      return;
    }
    sendIndex(res);
  });
}

function writePortFile(port) {
  try {
    fs.writeFileSync(PORT_FILE, String(port), 'utf8');
  } catch {
    /* ignore */
  }
}

function findRestaurantLanIp() {
  const exclude =
    /Loopback|VirtualBox|VMware|Hyper-V|vEthernet|WSL|Docker|Virtual|TAP|TUN|Npcap|Bluetooth|VPN|Host-Only|Default Switch|Kernel Debug/i;
  const wifi = /Wi-Fi|WLAN|Wireless|802\.11/i;
  const eth = /Ethernet|Etherneto|Conexi.n de .rea local|\bLAN\b/i;

  /** @type {{ name: string; address: string; kind: string }[]} */
  const candidates = [];

  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    if (!addrs || exclude.test(name)) continue;
    for (const addr of addrs) {
      const family = addr.family;
      if (family !== 'IPv4' && family !== 4) continue;
      if (addr.internal) continue;
      if (addr.address.startsWith('169.254.')) continue;
      if (addr.address.startsWith('192.168.56.')) continue;
      let kind = 'other';
      if (wifi.test(name)) kind = 'wifi';
      else if (eth.test(name) && !wifi.test(name)) kind = 'eth';
      candidates.push({ name, address: addr.address, kind });
    }
  }

  return (
    candidates.find((c) => c.kind === 'wifi') ||
    candidates.find((c) => c.kind === 'eth') ||
    candidates[0] ||
    null
  );
}

function onListening(port, preferred) {
  LISTEN_PORT = port;
  writePortFile(port);
  const lan = findRestaurantLanIp();

  console.log('');
  console.log('App web activa:');
  console.log('');
  console.log(`  En ESTE PC (navegador):  http://localhost:${port}`);
  console.log(`  QR celulares (ESTE PC):  http://localhost:${port}/conectar`);
  if (lan) {
    console.log(`  En el CELULAR (misma red): http://${lan.address}:${port}`);
    console.log(`    Adaptador: ${lan.name}`);
  } else {
    console.log('  En el CELULAR: admin - Conexion movil (QR y URL en la app).');
  }
  console.log('');
  console.log('  (No uses http://0.0.0.0 — esa direccion no abre en el navegador.)');
  console.log('');

  if (port !== preferred) {
    const reserved = [...RESERVED_PORTS].sort((a, b) => a - b).join(', ');
    console.log(`Nota: el puerto ${preferred} estaba ocupado. Se uso el puerto ${port}.`);
    if (reserved) {
      console.log(`      Puertos reservados (no se usan): ${reserved}`);
    }
    console.log('');
  }
}

function tryListen(port, preferred) {
  const server = http.createServer(onRequest);
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      const next = nextCandidatePort(port, preferred);
      if (next > preferred + MAX_OFFSET) {
        console.error('');
        console.error(
          `No hay puerto libre entre ${preferred} y ${preferred + MAX_OFFSET}.`,
        );
        console.error(
          `Reservados: ${[...RESERVED_PORTS].join(', ') || '(ninguno)'}. Cierra otro programa o cambia WEB_PORT.`,
        );
        console.error('');
        process.exit(1);
      }
      const skipHint = RESERVED_PORTS.has(port + 1) ? ' (reservado para desarrollo)' : '';
      console.warn(`Puerto ${port} ocupado, probando ${next}...${skipHint}`);
      tryListen(next, preferred);
      return;
    }
    throw err;
  });
  server.listen(port, '0.0.0.0', () => onListening(port, preferred));
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.on('clientError', (_err, socket) => {
    if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
}

tryListen(PREFERRED_PORT, PREFERRED_PORT);

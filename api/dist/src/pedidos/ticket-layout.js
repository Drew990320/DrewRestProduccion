"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fechaHoraTicket = fechaHoraTicket;
exports.fechaDiaTicket = fechaDiaTicket;
exports.tituloSeccion = tituloSeccion;
exports.separador = separador;
exports.separadorDoble = separadorDoble;
exports.textoGrande = textoGrande;
exports.filaMontoGrande = filaMontoGrande;
exports.encabezadoTicket = encabezadoTicket;
exports.filaDato = filaDato;
exports.bloqueDatos = bloqueDatos;
exports.parrafoCentrado = parrafoCentrado;
const escpos_utils_1 = require("./escpos-utils");
function fechaHoraTicket(fecha) {
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime()))
        return '';
    const partes = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(d);
    const get = (t) => partes.find((p) => p.type === t)?.value ?? '';
    return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
function fechaDiaTicket(fecha) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha.trim());
    if (!m)
        return fecha;
    const dia = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return `${DIAS_SEMANA[dia.getUTCDay()]} ${m[3]}/${m[2]}/${m[1]}`;
}
async function tituloSeccion(printer, opts, texto) {
    await printer.alignLeft();
    await printer.bold(true);
    for (const line of (0, escpos_utils_1.wrapEscPos)(texto, opts.charWidth))
        await printer.println(line);
    await printer.bold(false);
}
async function separador(printer, opts) {
    await printer.println('-'.repeat(opts.charWidth));
}
async function separadorDoble(printer, opts) {
    await printer.println('='.repeat(opts.charWidth));
}
async function textoGrande(printer, opts, texto) {
    await printer.bold(true);
    for (const line of (0, escpos_utils_1.wrapEscPos)(texto, opts.charWidth)) {
        await printer.println(line);
    }
    await printer.bold(false);
}
async function filaMontoGrande(printer, opts, etiqueta, monto) {
    await printer.alignLeft();
    await printer.bold(true);
    await printer.println((0, escpos_utils_1.lineaConPrecio)(etiqueta, monto, opts.charWidth));
    await printer.bold(false);
}
async function encabezadoTicket(printer, opts, params) {
    await printer.alignCenter();
    await separadorDoble(printer, opts);
    await textoGrande(printer, opts, params.titulo);
    for (const s of params.subtitulos ?? []) {
        if (!s)
            continue;
        for (const line of (0, escpos_utils_1.wrapEscPos)(s, opts.charWidth))
            await printer.println(line);
    }
    const marcas = (params.marcas ?? []).filter((m) => Boolean(m));
    if (marcas.length > 0) {
        await printer.bold(true);
        for (const m of marcas) {
            for (const line of (0, escpos_utils_1.wrapEscPos)(`* ${m} *`, opts.charWidth))
                await printer.println(line);
        }
        await printer.bold(false);
    }
    await separadorDoble(printer, opts);
    await printer.alignLeft();
}
function filaDato(etiqueta, valor, width) {
    const v = valor.trim();
    if (!v)
        return etiqueta;
    if (etiqueta.length + 1 + v.length <= width) {
        return etiqueta + ' '.repeat(width - etiqueta.length - v.length) + v;
    }
    return [etiqueta, ...(0, escpos_utils_1.wrapEscPos)(v, width).map((l) => l.padStart(width))].join('\n');
}
async function bloqueDatos(printer, opts, filas) {
    await printer.alignLeft();
    for (const f of filas) {
        if (!f)
            continue;
        const valor = f[1] == null ? '' : String(f[1]);
        if (!valor.trim())
            continue;
        await printer.println(filaDato(f[0], valor, opts.charWidth));
    }
}
async function parrafoCentrado(printer, opts, texto, negrita = false) {
    if (!texto.trim())
        return;
    await printer.alignCenter();
    if (negrita)
        await printer.bold(true);
    for (const line of (0, escpos_utils_1.wrapEscPos)(texto, opts.charWidth))
        await printer.println(line);
    if (negrita)
        await printer.bold(false);
    await printer.alignLeft();
}
//# sourceMappingURL=ticket-layout.js.map
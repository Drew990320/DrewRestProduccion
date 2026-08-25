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
var ComandaPrinterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComandaPrinterService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const latency_metrics_1 = require("../common/latency-metrics");
const impresoras_pos_service_1 = require("../impresoras-pos/impresoras-pos.service");
const impresion_estacion_reglas_1 = require("./impresion-estacion-reglas");
const mesa_label_1 = require("@drewrest/shared-domain/mesa-label");
const impresora_papel_ancho_1 = require("../impresoras-pos/impresora-papel-ancho");
const comanda_escpos_builder_1 = require("./comanda-escpos.builder");
const factura_escpos_builder_1 = require("./factura-escpos.builder");
const domicilio_escpos_builder_1 = require("./domicilio-escpos.builder");
const prueba_impresora_escpos_builder_1 = require("./prueba-impresora-escpos.builder");
const cierre_caja_escpos_builder_1 = require("./cierre-caja-escpos.builder");
const cuentas_divididas_escpos_builder_1 = require("./cuentas-divididas-escpos.builder");
const escpos_paper_status_1 = require("./escpos-paper-status");
const escpos_tcp_1 = require("./escpos-tcp");
const escpos_utils_1 = require("./escpos-utils");
const serialport_loader_1 = require("./serialport-loader");
const pedidos_gateway_1 = require("./pedidos.gateway");
const windows_raw_print_1 = require("./windows-raw-print");
const windows_printer_status_1 = require("./windows-printer-status");
const DEFAULT_CHARS = 32;
const MAX_PRINT_RETRIES = 2;
const DEFAULT_BURST_WINDOW_MS = 5_000;
const DEFAULT_INTER_JOB_DELAY_MS = 300;
function bufferPulsoCajon() {
    return Buffer.concat([
        Buffer.from([0x1b, 0x70, 0x00, 0x19, 0x64]),
        Buffer.from([0x1b, 0x70, 0x01, 0x19, 0x64]),
    ]);
}
let ComandaPrinterService = ComandaPrinterService_1 = class ComandaPrinterService {
    config;
    impresorasPos;
    gateway;
    logger = new common_1.Logger(ComandaPrinterService_1.name);
    colasPorDestino = new Map();
    trabajosPorDestino = new Map();
    tiposPendientesPorDestino = new Map();
    encoladosRecientes = new Map();
    impresionRapida = false;
    takeReminders = new Map();
    constructor(config, impresorasPos, gateway) {
        this.config = config;
        this.impresorasPos = impresorasPos;
        this.gateway = gateway;
    }
    onModuleDestroy() {
        this.cancelAllTakeReminders();
    }
    enabled() {
        const live = process.env.PRINTER_ENABLED?.trim();
        const v = (live || this.config.get('PRINTER_ENABLED') || '')
            .trim()
            .toLowerCase();
        return v === '1' || v === 'true' || v === 'yes';
    }
    charWidthLegacy() {
        const n = Number(this.config.get('PRINTER_WIDTH') ?? DEFAULT_CHARS);
        return (0, impresora_papel_ancho_1.clampCharsPorLinea)(n, DEFAULT_CHARS);
    }
    charWidthForDestino(destino) {
        return (0, impresora_papel_ancho_1.charsPorLineaParaPapelMm)(destino.ancho_papel_mm ?? (0, impresora_papel_ancho_1.papelMmDesdeChars)(this.charWidthLegacy()));
    }
    layoutOptsForDestino(destino) {
        return {
            charWidth: this.charWidthForDestino(destino),
            tamanoFuente: destino.tamano_fuente ?? 1,
            margenInicioLineas: destino.margen_inicio_lineas ?? 0,
            margenFinLineas: destino.margen_fin_lineas ?? 2,
        };
    }
    baudRateDefault() {
        const n = Number(this.config.get('PRINTER_BAUD_RATE') ?? 9600);
        return Number.isFinite(n) && n > 0 ? n : 9600;
    }
    paperCheckAntesDeEnviar() {
        const live = process.env.PRINTER_PAPEL_CHECK?.trim();
        const v = (live || this.config.get('PRINTER_PAPEL_CHECK') || '0')
            .trim()
            .toLowerCase();
        return v === '1' || v === 'true' || v === 'yes';
    }
    takeReminderEnabled() {
        const live = process.env.PRINTER_TAKE_REMINDER?.trim();
        const v = (live ||
            this.config.get('PRINTER_TAKE_REMINDER') ||
            '1')
            .trim()
            .toLowerCase();
        return v !== '0' && v !== 'false' && v !== 'off' && v !== 'no';
    }
    takeReminderDelayMs() {
        const n = Number(process.env.PRINTER_TAKE_REMINDER_DELAY_MS ??
            this.config.get('PRINTER_TAKE_REMINDER_DELAY_MS') ??
            2000);
        return Number.isFinite(n) && n >= 0 ? n : 2000;
    }
    takeReminderIntervalMs() {
        const n = Number(process.env.PRINTER_TAKE_REMINDER_INTERVAL_MS ??
            this.config.get('PRINTER_TAKE_REMINDER_INTERVAL_MS') ??
            1500);
        return Number.isFinite(n) && n >= 300 ? n : 1500;
    }
    takeReminderMaxBeeps() {
        const n = Number(process.env.PRINTER_TAKE_REMINDER_MAX ??
            this.config.get('PRINTER_TAKE_REMINDER_MAX') ??
            10);
        return Number.isFinite(n) && n >= 1 ? Math.min(30, Math.round(n)) : 10;
    }
    destinoKey(destino) {
        return destino.trim().toLowerCase();
    }
    cancelTakeReminder(destino) {
        const key = this.destinoKey(destino);
        const prev = this.takeReminders.get(key);
        if (!prev)
            return;
        prev.abort.abort();
        this.takeReminders.delete(key);
    }
    cancelAllTakeReminders() {
        for (const key of [...this.takeReminders.keys()]) {
            this.cancelTakeReminder(key);
        }
    }
    sleepAbortable(ms, signal) {
        return new Promise((resolve) => {
            if (signal.aborted) {
                resolve();
                return;
            }
            const t = setTimeout(resolve, ms);
            signal.addEventListener('abort', () => {
                clearTimeout(t);
                resolve();
            }, { once: true });
        });
    }
    scheduleTakeReminder(target, baudRate, tipo) {
        if (tipo !== 'comanda' || !this.takeReminderEnabled())
            return;
        if (process.platform === 'win32' && !(0, escpos_tcp_1.parseDestinoTcp)(target)) {
            return;
        }
        const key = this.destinoKey(target);
        this.cancelTakeReminder(target);
        const abort = new AbortController();
        const token = Date.now();
        this.takeReminders.set(key, { token, abort });
        const delayMs = this.takeReminderDelayMs();
        const intervalMs = this.takeReminderIntervalMs();
        const maxBeeps = this.takeReminderMaxBeeps();
        void (async () => {
            try {
                await this.sleepAbortable(delayMs, abort.signal);
                if (abort.signal.aborted)
                    return;
                const inicial = await this.consultarPapel(target, baudRate, {
                    fresh: true,
                });
                if (abort.signal.aborted)
                    return;
                if (inicial?.ticketPendiente !== true) {
                    if (inicial?.ticketPendiente === false) {
                        this.logger.debug(`Papel ya retirado en ${target}; sin recordatorio`);
                    }
                    else {
                        this.logger.debug(`Sin sensor de salida en ${target}; no se recuerda por tiempo`);
                    }
                    return;
                }
                this.logger.log(`Sensor de salida: ticket pendiente en ${target}. Recordatorio hasta retirarlo.`);
                for (let i = 0; i < maxBeeps; i++) {
                    if (abort.signal.aborted)
                        return;
                    if ((this.trabajosPorDestino.get(key) ?? 0) > 0)
                        return;
                    const ahora = await this.consultarPapel(target, baudRate, {
                        fresh: true,
                    });
                    if (abort.signal.aborted)
                        return;
                    if (ahora?.ticketPendiente !== true) {
                        this.logger.debug(`Papel retirado en ${target}; se detiene beep`);
                        return;
                    }
                    this.logger.debug(`Recordatorio tomar papel ${target} (${i + 1}/${maxBeeps})`);
                    await this.alertarSinPapelBeep(target, baudRate, { times: 2 });
                    if (i < maxBeeps - 1) {
                        await this.sleepAbortable(intervalMs, abort.signal);
                    }
                }
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                this.logger.debug(`Recordatorio papel ${target}: ${msg}`);
            }
            finally {
                const cur = this.takeReminders.get(key);
                if (cur?.token === token)
                    this.takeReminders.delete(key);
            }
        })();
    }
    jobCooldownMs() {
        const n = Number(this.config.get('PRINTER_JOB_COOLDOWN_MS') ?? DEFAULT_INTER_JOB_DELAY_MS);
        return Number.isFinite(n) && n >= 0 ? n : DEFAULT_INTER_JOB_DELAY_MS;
    }
    burstWindowMs() {
        const n = Number(this.config.get('PRINTER_BURST_WINDOW_MS') ?? DEFAULT_BURST_WINDOW_MS);
        return Number.isFinite(n) && n >= 0 ? n : DEFAULT_BURST_WINDOW_MS;
    }
    registrarEncolado(destinoKey) {
        const now = Date.now();
        const windowMs = this.burstWindowMs();
        const prev = this.encoladosRecientes.get(destinoKey) ?? [];
        const recent = prev.filter((t) => now - t <= windowMs);
        recent.push(now);
        this.encoladosRecientes.set(destinoKey, recent);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async runWithImpresionRapida(fn) {
        const prev = this.impresionRapida;
        this.impresionRapida = true;
        try {
            return await fn();
        }
        finally {
            this.impresionRapida = prev;
        }
    }
    nuevoJobId() {
        return `pj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }
    emitirEstadoImpresion(jobId, estado, destino, extra) {
        try {
            this.gateway?.emitImpresionEstado({
                jobId,
                estado,
                destino,
                error: extra?.error,
                retries: extra?.retries,
                at: new Date().toISOString(),
            });
        }
        catch {
        }
    }
    esErrorReintentable(r) {
        if (r.impreso)
            return false;
        if (r.codigo_error === 'sin_papel' ||
            r.codigo_error === 'papel_bajo' ||
            r.codigo_error === 'sin_impresora_configurada' ||
            r.codigo_error === 'envio_incierto') {
            return false;
        }
        const err = (r.error ?? '').toLowerCase();
        if (/timeout|etimedout|aborted|exceeded|hang|timed out|econnreset|epipe|econnaborted|broken pipe|reset by peer/.test(err)) {
            return false;
        }
        return /econnrefused|enotfound|ehostunreach|enotconn|could not open|no se pudo abrir|openprinter|impresora no encontrada|access is denied/.test(err);
    }
    falloPudoHaberImpreso(r) {
        if (r.impreso)
            return false;
        const err = (r.error ?? '').toLowerCase();
        return /timeout|etimedout|aborted|econnreset|epipe|econnaborted|broken pipe|reset by peer/.test(err);
    }
    encolarEnDestino(destino, job, opts = {}) {
        const key = destino.trim().toLowerCase();
        const tipo = opts.tipo ?? 'factura';
        const skipCooldownAfter = opts.skipCooldownAfter === true || tipo === 'cajon';
        this.cancelTakeReminder(destino);
        const jobId = this.nuevoJobId();
        const porDelante = this.trabajosPorDestino.get(key) ?? 0;
        this.trabajosPorDestino.set(key, porDelante + 1);
        const tipos = this.tiposPendientesPorDestino.get(key) ?? [];
        tipos.push(tipo);
        this.tiposPendientesPorDestino.set(key, tipos);
        this.registrarEncolado(key);
        (0, latency_metrics_1.trackPrintJobQueued)(jobId, destino);
        this.emitirEstadoImpresion(jobId, 'queued', destino);
        const prev = this.colasPorDestino.get(key) ?? Promise.resolve();
        const run = prev.then(async () => {
            if (porDelante > 0) {
                this.logger.log(`Cola ${destino}: ${porDelante} ticket(s) por delante…`);
            }
            (0, latency_metrics_1.trackPrintJobSent)(jobId);
            this.emitirEstadoImpresion(jobId, 'sent', destino);
            let result = {
                impreso: false,
                error: 'Sin resultado',
                codigo_error: 'otro',
            };
            for (let attempt = 0; attempt <= MAX_PRINT_RETRIES; attempt++) {
                if (attempt > 0) {
                    (0, latency_metrics_1.trackPrintRetry)(jobId);
                    await this.sleep(200 * attempt);
                }
                result = await job();
                result = { ...result, job_id: jobId, destino: result.destino ?? destino };
                if (result.impreso || !this.esErrorReintentable(result))
                    break;
                this.logger.warn(`Reintento impresión ${destino} (${attempt + 1}/${MAX_PRINT_RETRIES}): ${result.error}`);
            }
            const ok = Boolean(result.impreso);
            (0, latency_metrics_1.trackPrintJobFinished)(jobId, ok, result.error);
            this.emitirEstadoImpresion(jobId, ok ? 'completed' : 'error', destino, { error: result.error });
            const colaTipos = this.tiposPendientesPorDestino.get(key) ?? [];
            if (colaTipos[0] === tipo)
                colaTipos.shift();
            const nextTipo = colaTipos[0];
            this.tiposPendientesPorDestino.set(key, colaTipos);
            const remainingAfter = (this.trabajosPorDestino.get(key) ?? 1) - 1;
            const omitirCooldown = skipCooldownAfter || nextTipo === 'cajon';
            if (ok &&
                remainingAfter > 0 &&
                !omitirCooldown &&
                !this.impresionRapida) {
                const ms = this.jobCooldownMs();
                if (ms > 0) {
                    this.logger.log(`Ticket impreso en ${destino}; pausa ${ms}ms (${remainingAfter} en cola)`);
                    await this.sleep(ms);
                }
            }
            return result;
        });
        this.colasPorDestino.set(key, run.then(() => undefined, () => undefined));
        return run.finally(() => {
            const n = (this.trabajosPorDestino.get(key) ?? 1) - 1;
            if (n <= 0) {
                this.trabajosPorDestino.delete(key);
                this.tiposPendientesPorDestino.delete(key);
            }
            else {
                this.trabajosPorDestino.set(key, n);
            }
        });
    }
    filtrarComandaParaEstacion(ticket, destino) {
        const reglas = destino.reglas ?? [];
        if (reglas.length === 0)
            return null;
        const lineas = ticket.lineas.filter((l) => (0, impresion_estacion_reglas_1.lineaPerteneceAEstacion)(l, reglas));
        if (lineas.length === 0)
            return null;
        return { ...ticket, lineas };
    }
    async imprimirComanda(ticket) {
        const destinosAll = await this.impresorasPos.destinosParaRol('cocina');
        if (destinosAll.length === 0) {
            return {
                impreso: false,
                error: 'Sin impresora de cocina configurada',
                codigo_error: 'sin_impresora_configurada',
            };
        }
        const canal = ticket.canal_comanda ??
            (0, mesa_label_1.resolverCanalComanda)({
                mesa_numero: ticket.mesa_numero,
                modo_servicio: ticket.modo_servicio,
            });
        const destinosCanal = destinosAll.filter((d) => (0, mesa_label_1.destinoRecibeCanalComanda)(canal, {
            comanda_mesa: d.comanda_mesa,
            comanda_mostrador: d.comanda_mostrador,
            comanda_para_llevar: d.comanda_para_llevar,
        }));
        if (destinosCanal.length === 0) {
            const etiqueta = canal === 'para_llevar'
                ? 'para llevar'
                : canal === 'mostrador'
                    ? 'mostrador'
                    : 'mesa';
            return {
                impreso: false,
                error: `Ninguna impresora de cocina recibe pedidos de ${etiqueta}`,
                codigo_error: 'sin_impresora_configurada',
            };
        }
        const destinosPlan = destinosAll.map((d, i) => ({
            key: `${d.id_impresora ?? 'x'}:${d.destino}:${i}`,
            es_cocina_maestra: d.es_cocina_maestra,
            reglas: d.reglas,
            destino: d,
        }));
        const plan = (0, impresion_estacion_reglas_1.planificarJobsComanda)(ticket.lineas, destinosPlan);
        const byKey = new Map(destinosPlan.map((d) => [d.key, d.destino]));
        const clavesCanal = new Set(destinosPlan
            .filter((d) => destinosCanal.some((c) => c.id_impresora === d.destino.id_impresora &&
            c.destino === d.destino.destino))
            .map((d) => d.key));
        const jobsPlan = plan.jobs.filter((j) => clavesCanal.has(j.destinoKey));
        const huerfanasPorCanal = [
            ...plan.huerfanasSinDestino,
        ];
        for (const j of plan.jobs) {
            if (clavesCanal.has(j.destinoKey))
                continue;
            if (j.motivo === 'catch_all_huerfanas' && j.lineas !== 'completo') {
                huerfanasPorCanal.push(...j.lineas);
            }
        }
        if (plan.todoOmitido) {
            this.logger.log(`Comanda omitida: todas las líneas marcadas «no imprimir» (canal=${canal})`);
            return { impreso: true, destino: 'omitido' };
        }
        if (huerfanasPorCanal.length > 0) {
            const nombres = huerfanasPorCanal
                .map((l) => l.nombre_producto ?? `prod:${l.id_producto}`)
                .slice(0, 8)
                .join(', ');
            this.logger.warn(`Comanda: ${huerfanasPorCanal.length} línea(s) sin estación ni cocina maestra/catch-all (${nombres}). No se redirigen a otra zona.`);
        }
        if (jobsPlan.length === 0) {
            const huboEstacionFueraDeCanal = plan.jobs.some((j) => (j.motivo === 'estacion' || j.motivo === 'maestra') &&
                !clavesCanal.has(j.destinoKey));
            return {
                impreso: false,
                error: huboEstacionFueraDeCanal
                    ? 'La estación de esos platos no recibe este tipo de pedido (mesa / mostrador / para llevar).'
                    : huerfanasPorCanal.length > 0
                        ? 'Hay platos de cocina sin estación. Configura cocina maestra o asígnalos en Impresoras POS.'
                        : 'Ninguna estación de cocina coincide con este pedido',
                codigo_error: 'sin_estacion_para_lineas',
            };
        }
        const jobs = jobsPlan.map((j) => {
            const destino = byKey.get(j.destinoKey);
            if (j.lineas === 'completo') {
                return { destino, ticket };
            }
            return {
                destino,
                ticket: { ...ticket, lineas: j.lineas },
            };
        });
        const resultados = await Promise.all(jobs.map(({ destino, ticket: t }) => this.imprimirComandaEnDestino(t, destino)));
        const ok = resultados.find((r) => r.impreso);
        if (ok) {
            const fallos = resultados.filter((r) => !r.impreso);
            if (fallos.length) {
                this.logger.warn(`Comanda parcial: ${fallos.map((f) => f.error).join(' | ')}`);
            }
            return ok;
        }
        return (resultados[0] ?? {
            impreso: false,
            error: 'No se pudo imprimir la comanda',
            codigo_error: 'otro',
        });
    }
    async imprimirComandaEnDestino(ticket, destino) {
        let buffer;
        try {
            buffer = await (0, comanda_escpos_builder_1.buildComandaEscPos)(ticket, this.layoutOptsForDestino(destino));
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.error(`Error generando ESC/POS comanda: ${msg}`);
            return { impreso: false, error: `Error generando ticket: ${msg}` };
        }
        return this.encolarEnDestino(destino.destino, () => this.enviarBufferATargets(buffer, 'comanda', [destino.destino], destino.baud_rate), { tipo: 'comanda' });
    }
    async imprimirFactura(ticket) {
        return this.enviarPorRolConBuilder('factura', 'factura', (opts) => (0, factura_escpos_builder_1.buildFacturaEscPos)(ticket, opts));
    }
    async imprimirDomicilio(ticket) {
        return this.enviarPorRolConBuilder('factura', 'factura', (opts) => (0, domicilio_escpos_builder_1.buildDomicilioEscPos)(ticket, opts));
    }
    async imprimirFacturaConCajon(ticket, opts = {}) {
        const abrirCajon = opts.abrirCajon === true;
        const conCopia = opts.conCopia === true;
        if (!abrirCajon && !conCopia) {
            return this.imprimirFactura(ticket);
        }
        if (!abrirCajon && conCopia) {
            const negocio = await this.imprimirFactura({
                ...ticket,
                copia_destinatario: 'negocio',
            });
            if (!negocio.impreso)
                return negocio;
            return this.imprimirFactura({
                ...ticket,
                copia_destinatario: 'cliente',
            });
        }
        if (!this.enabled()) {
            return { impreso: false, omitido: true };
        }
        const destinos = await this.impresorasPos.destinosParaRol('factura');
        if (destinos.length === 0) {
            return {
                impreso: false,
                omitido: true,
                codigo_error: 'sin_impresora_configurada',
            };
        }
        const pulso = bufferPulsoCajon();
        const errors = [];
        for (const destino of destinos) {
            let ticketBuf;
            try {
                ticketBuf = await (0, factura_escpos_builder_1.buildFacturaEscPos)({
                    ...ticket,
                    copia_destinatario: conCopia ? 'negocio' : ticket.copia_destinatario,
                }, this.layoutOptsForDestino(destino));
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                this.logger.error(`Error generando ESC/POS factura: ${msg}`);
                errors.push(`Error generando ticket: ${msg}`);
                continue;
            }
            const combinado = Buffer.concat([pulso, ticketBuf]);
            try {
                const result = await this.encolarEnDestino(destino.destino, () => this.enviarBufferATargets(combinado, 'factura', [destino.destino], destino.baud_rate, { ignorarSensorPapel: false }), { tipo: 'factura', skipCooldownAfter: true });
                if (!result.impreso) {
                    if (result.error)
                        errors.push(result.error);
                    if (this.falloPudoHaberImpreso(result)) {
                        return result;
                    }
                    continue;
                }
                if (!conCopia)
                    return result;
                const cliente = await this.enviarPorRolConBuilder('factura', 'factura', (opts) => (0, factura_escpos_builder_1.buildFacturaEscPos)({ ...ticket, copia_destinatario: 'cliente' }, opts));
                if (!cliente.impreso) {
                    return {
                        ...cliente,
                        error: cliente.error ??
                            'Copia cliente no impresa (la copia negocio sí salió)',
                    };
                }
                return cliente;
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                errors.push(msg);
                this.logger.warn(`Factura+cajón falló (${destino.destino}): ${msg}`);
            }
        }
        return {
            impreso: false,
            error: errors.join(' | ') || 'No se pudo imprimir factura',
            codigo_error: 'otro',
        };
    }
    async abrirCajon() {
        if (!this.enabled()) {
            return { impreso: false, omitido: true };
        }
        const destinos = await this.impresorasPos.destinosParaRol('factura');
        if (destinos.length === 0) {
            return {
                impreso: false,
                omitido: true,
                codigo_error: 'sin_impresora_configurada',
            };
        }
        const buffer = bufferPulsoCajon();
        const errors = [];
        for (const destino of destinos) {
            try {
                const result = await this.encolarEnDestino(destino.destino, () => this.enviarBufferATargets(buffer, 'cajon', [destino.destino], destino.baud_rate, { ignorarSensorPapel: true }), { tipo: 'cajon', skipCooldownAfter: true });
                if (result.impreso)
                    return result;
                if (result.error)
                    errors.push(result.error);
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                errors.push(msg);
                this.logger.warn(`Pulso cajón falló (${destino.destino}): ${msg}`);
            }
        }
        return {
            impreso: false,
            omitido: true,
            error: errors.join(' | ') || 'No se pudo abrir el cajón',
            codigo_error: 'otro',
        };
    }
    async imprimirCierreCaja(ticket) {
        return this.enviarPorRolConBuilder('cierre', 'caja', (opts) => (0, cierre_caja_escpos_builder_1.buildCierreCajaEscPos)(ticket, opts.charWidth));
    }
    async imprimirCuentasDivididas(ticket) {
        return this.enviarPorRolConBuilder('cierre', 'caja', (opts) => (0, cuentas_divididas_escpos_builder_1.buildCuentasDivididasEscPos)(ticket, opts.charWidth));
    }
    async imprimirBaseCaja(ticket) {
        return this.enviarPorRolConBuilder('cierre', 'caja', (opts) => (0, cierre_caja_escpos_builder_1.buildBaseCajaEscPos)(ticket, opts.charWidth));
    }
    async imprimirBaseCajaCierre(ticket) {
        return this.enviarPorRolConBuilder('cierre', 'caja', (opts) => (0, cierre_caja_escpos_builder_1.buildBaseCajaCierreEscPos)(ticket, opts.charWidth));
    }
    async imprimirMovimientoCaja(ticket) {
        return this.enviarPorRolConBuilder('cierre', 'caja', (opts) => (0, cierre_caja_escpos_builder_1.buildMovimientoCajaEscPos)(ticket, opts.charWidth));
    }
    async imprimirItemsMenu(ticket) {
        return this.enviarPorRolConBuilder('cierre', 'caja', (opts) => (0, cierre_caja_escpos_builder_1.buildItemsMenuEscPos)(ticket, opts.charWidth));
    }
    async enviarPorRolConBuilder(tipo, rol, build) {
        const destinos = await this.impresorasPos.destinosParaRol(rol);
        if (destinos.length === 0) {
            return {
                impreso: false,
                error: `Sin impresora de ${rol} configurada`,
                codigo_error: 'sin_impresora_configurada',
            };
        }
        const errors = [];
        for (const destino of destinos) {
            let buffer;
            try {
                buffer = await build(this.layoutOptsForDestino(destino));
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                this.logger.error(`Error generando ESC/POS ${tipo}: ${msg}`);
                errors.push(`Error generando ticket: ${msg}`);
                continue;
            }
            const result = await this.encolarEnDestino(destino.destino, () => this.enviarBufferATargets(buffer, tipo, [destino.destino], destino.baud_rate), { tipo });
            if (result.impreso)
                return result;
            if (result.error)
                errors.push(result.error);
            if (this.falloPudoHaberImpreso(result)) {
                return result;
            }
        }
        return {
            impreso: false,
            error: errors.join(' | ') || `No se pudo imprimir ${tipo}`,
            codigo_error: 'otro',
        };
    }
    async enviarBufferATargets(buffer, tipo, targets, baudRate, opts = {}) {
        if (!this.enabled()) {
            return {
                impreso: false,
                error: 'Impresora deshabilitada. Active PRINTER_ENABLED o una impresora en Impresoras POS.',
            };
        }
        if (targets.length === 0) {
            return {
                impreso: false,
                error: 'Sin destino de impresión',
                codigo_error: 'sin_impresora_configurada',
            };
        }
        const errors = [];
        const chequearPapelPrevio = !opts.ignorarSensorPapel && this.paperCheckAntesDeEnviar();
        for (const target of targets) {
            if (chequearPapelPrevio) {
                const papel = await this.consultarPapel(target, baudRate);
                if (papel?.sinPapel) {
                    this.logger.warn(`Papel no listo en ${target}. Se imprime igual y se avisa con beep.`);
                    await this.alertarSinPapelBeep(target, baudRate);
                }
                else if (papel?.papelBajo) {
                    this.logger.warn(`Papel bajo en ${target}`);
                    await this.alertarSinPapelBeep(target, baudRate, { times: 1 });
                }
            }
            try {
                await this.sendBuffer(target, buffer, baudRate);
                this.logger.log(`${tipo} impresa vía ${target}`);
                this.scheduleTakeReminder(target, baudRate, tipo);
                return { impreso: true, destino: target };
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                errors.push(`${target}: ${msg}`);
                this.logger.warn(`Impresión ${tipo} falló (${target}): ${msg}`);
                if (!opts.ignorarSensorPapel && (0, escpos_tcp_1.parseDestinoTcp)(target)) {
                    try {
                        const trasFallo = await this.consultarPapel(target, baudRate);
                        if (trasFallo?.sinPapel) {
                            this.logger.warn(`Papel no arrancado / sin papel en ${target} tras fallo`);
                            await this.alertarSinPapelBeep(target, baudRate);
                            return {
                                impreso: false,
                                error: `Sin papel en ${target}. Recargue o arranque el rollo en la impresora POS.`,
                                codigo_error: 'sin_papel',
                                destino: target,
                            };
                        }
                        if (trasFallo?.papelBajo) {
                            await this.alertarSinPapelBeep(target, baudRate, { times: 1 });
                        }
                    }
                    catch {
                    }
                }
            }
        }
        return {
            impreso: false,
            error: errors.join(' | '),
            codigo_error: 'otro',
        };
    }
    async consultarEstadoPapel() {
        const destinos = await this.impresorasPos.destinosParaRol('cocina');
        const fallback = destinos[0] ??
            (await this.impresorasPos.destinosParaRol('factura'))[0] ??
            (await this.impresorasPos.destinosParaRol('caja'))[0];
        if (!fallback) {
            return {
                destino: null,
                sin_papel: null,
                papel_bajo: null,
                ticket_pendiente: null,
                error: 'Sin impresora configurada',
            };
        }
        return this.consultarEstadoPapelDestino(fallback.destino, fallback.baud_rate);
    }
    async consultarEstadoPapelDestino(destino, baudRate = null) {
        if (!this.enabled()) {
            return {
                destino: null,
                sin_papel: null,
                papel_bajo: null,
                ticket_pendiente: null,
                error: 'Impresora deshabilitada (PRINTER_ENABLED)',
            };
        }
        const papel = await this.consultarPapel(destino, baudRate, { fresh: true });
        if (!papel) {
            return {
                destino,
                sin_papel: null,
                papel_bajo: null,
                ticket_pendiente: null,
                error: 'No se pudo leer el sensor de papel (revise conexión USB/COM)',
            };
        }
        return {
            destino,
            sin_papel: papel.sinPapel,
            papel_bajo: papel.papelBajo,
            ticket_pendiente: papel.ticketPendiente,
        };
    }
    async consultarPapel(target, baudRate, opts = {}) {
        const lower = target.toLowerCase();
        if (lower.startsWith('printer:')) {
            const name = target.slice('printer:'.length).trim();
            if (!name)
                return null;
            return (0, windows_printer_status_1.consultarPapelWindows)(name, opts);
        }
        const red = (0, escpos_tcp_1.parseDestinoTcp)(target);
        if (red) {
            try {
                return await (0, escpos_tcp_1.consultarPapelTcp)(red.host, red.port);
            }
            catch {
                return null;
            }
        }
        try {
            const comPath = this.normalizeComPath(target);
            return (0, escpos_paper_status_1.consultarPapelSerial)(comPath, baudRate && baudRate > 0 ? baudRate : this.baudRateDefault());
        }
        catch {
            return null;
        }
    }
    async alertarSinPapelBeep(target, baudRate, opts) {
        const beep = (0, escpos_utils_1.buildEscPosBeepBuffer)(opts?.times != null ? { times: opts.times } : undefined);
        if (!beep)
            return;
        try {
            await this.sendBuffer(target, beep, baudRate);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.debug(`Beep sin-papel no enviado a ${target}: ${msg}`);
        }
    }
    async sendBuffer(target, buffer, baudRate) {
        const lower = target.toLowerCase();
        if (lower.startsWith('printer:')) {
            const name = target.slice('printer:'.length).trim();
            if (!name)
                throw new Error('Nombre de impresora vacío');
            if (process.platform !== 'win32') {
                throw new Error('printer: solo en Windows');
            }
            await (0, windows_raw_print_1.printRawWindows)(name, buffer);
            return;
        }
        const red = (0, escpos_tcp_1.parseDestinoTcp)(target);
        if (red) {
            const resuelto = await this.impresorasPos.resolverDestinoRedParaImprimir(target);
            const host = resuelto?.host ?? red.host;
            const port = resuelto?.port ?? red.port;
            await (0, escpos_tcp_1.sendEscPosTcp)(host, port, buffer);
            if (resuelto?.aviso) {
                this.logger.warn(resuelto.aviso);
            }
            return;
        }
        const comPath = this.normalizeComPath(target);
        await this.sendSerial(comPath, buffer, baudRate && baudRate > 0 ? baudRate : this.baudRateDefault());
    }
    normalizeComPath(target) {
        const t = target.trim();
        if (/^COM\d+$/i.test(t)) {
            return `\\\\.\\${t.toUpperCase()}`;
        }
        if (t.startsWith('\\\\.\\')) {
            return t;
        }
        throw new Error(`Destino no reconocido: ${target}`);
    }
    async sendSerial(path, buffer, baud) {
        const SerialPort = await (0, serialport_loader_1.loadSerialPortClass)();
        return new Promise((resolve, reject) => {
            const port = new SerialPort({ path, baudRate: baud, autoOpen: false }, (err) => {
                if (err)
                    reject(err);
            });
            port.open((openErr) => {
                if (openErr) {
                    reject(openErr);
                    return;
                }
                port.write(buffer, (writeErr) => {
                    if (writeErr) {
                        port.close(() => reject(writeErr));
                        return;
                    }
                    port.drain((drainErr) => {
                        port.close(() => {
                            if (drainErr) {
                                resolve();
                                return;
                            }
                            resolve();
                        });
                    });
                });
            });
        });
    }
    async imprimirPrueba() {
        const destinos = await this.impresorasPos.destinosParaRol('cocina');
        const first = destinos[0] ??
            (await this.impresorasPos.destinosParaRol('factura'))[0] ??
            null;
        const destino = first?.destino ?? 'printer:POS';
        return this.imprimirPruebaADestino(destino, first?.baud_rate ?? null, first?.ancho_papel_mm);
    }
    async imprimirPruebaADestino(destino, baudRate = null, anchoPapelMm = null, layout) {
        const mm = (0, impresora_papel_ancho_1.normalizarAnchoPapelMm)(anchoPapelMm ?? (0, impresora_papel_ancho_1.papelMmDesdeChars)(this.charWidthLegacy()));
        const charWidth = (0, impresora_papel_ancho_1.charsPorLineaParaPapelMm)(mm);
        let buffer;
        try {
            buffer = await (0, prueba_impresora_escpos_builder_1.buildPruebaImpresoraEscPos)(destino, {
                charWidth,
                tamanoFuente: layout?.tamano_fuente ?? 1,
                margenInicioLineas: layout?.margen_inicio_lineas ?? 0,
                margenFinLineas: layout?.margen_fin_lineas ?? 2,
            }, mm);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return { impreso: false, error: `Error generando ticket: ${msg}` };
        }
        return this.encolarEnDestino(destino, () => this.enviarBufferATargets(buffer, 'comanda', [destino], baudRate, {
            ignorarSensorPapel: true,
        }), { tipo: 'comanda' });
    }
};
exports.ComandaPrinterService = ComandaPrinterService;
exports.ComandaPrinterService = ComandaPrinterService = ComandaPrinterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => impresoras_pos_service_1.ImpresorasPosService))),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => pedidos_gateway_1.PedidosGateway))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        impresoras_pos_service_1.ImpresorasPosService,
        pedidos_gateway_1.PedidosGateway])
], ComandaPrinterService);
//# sourceMappingURL=comanda-printer.service.js.map
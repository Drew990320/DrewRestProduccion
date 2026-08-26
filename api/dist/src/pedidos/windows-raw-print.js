"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.printRawWindows = printRawWindows;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
let resolvedExe = null;
function candidateRawPrintExes() {
    const fromEnv = process.env.DREWREST_RAW_PRINT_EXE?.trim();
    const cwd = process.cwd();
    const here = __dirname;
    return [
        fromEnv,
        path.join(cwd, 'bin', 'DrewRest.RawPrint.exe'),
        path.join(cwd, 'DrewRest.RawPrint.exe'),
        path.join(here, '..', '..', 'bin', 'DrewRest.RawPrint.exe'),
        path.join(here, '..', '..', '..', 'bin', 'DrewRest.RawPrint.exe'),
        path.join(here, 'DrewRest.RawPrint.exe'),
    ].filter((p) => Boolean(p && p.length > 0));
}
function resolveRawPrintExe() {
    if (resolvedExe)
        return resolvedExe;
    for (const p of candidateRawPrintExes()) {
        try {
            if (fs.existsSync(p)) {
                resolvedExe = p;
                return p;
            }
        }
        catch {
        }
    }
    return null;
}
function mensajeErrorExe(err) {
    if (!err || typeof err !== 'object')
        return String(err);
    const e = err;
    const stderr = Buffer.isBuffer(e.stderr)
        ? e.stderr.toString('utf8')
        : (e.stderr ?? '').toString();
    const stdout = Buffer.isBuffer(e.stdout)
        ? e.stdout.toString('utf8')
        : (e.stdout ?? '').toString();
    const detail = (stderr || stdout || e.message || '').trim();
    if (e.killed || e.code === 'ETIMEDOUT') {
        return detail
            ? `Timeout enviando a la impresora: ${detail}`
            : 'Timeout enviando a la impresora Windows';
    }
    return detail || 'No se pudo imprimir (RawPrint)';
}
async function printRawWindows(printerName, data) {
    const exe = resolveRawPrintExe();
    if (!exe) {
        throw new Error('Falta DrewRest.RawPrint.exe. Reinstala o actualiza DrewRest; no se usa PowerShell para imprimir.');
    }
    const binPath = path.join(os.tmpdir(), `drewrest-comanda-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.bin`);
    await fs.promises.writeFile(binPath, data);
    try {
        await execFileAsync(exe, [printerName, binPath], {
            timeout: 10_000,
            windowsHide: true,
        });
    }
    catch (e) {
        throw new Error(mensajeErrorExe(e));
    }
    finally {
        await fs.promises.unlink(binPath).catch(() => undefined);
    }
}
//# sourceMappingURL=windows-raw-print.js.map
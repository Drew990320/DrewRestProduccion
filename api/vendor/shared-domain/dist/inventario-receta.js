"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recetaIngredienteGeneral = recetaIngredienteGeneral;
exports.costoUnitarioEnStock = costoUnitarioEnStock;
exports.consolidarMovimientos = consolidarMovimientos;
exports.calcularConsumoReceta = calcularConsumoReceta;
exports.elegirSustitucionesPorStock = elegirSustitucionesPorStock;
exports.calcularCostoReceta = calcularCostoReceta;
const inventario_unidades_1 = require("./inventario-unidades");
/**
 * Receta de un solo ingrediente (general), con o sin alternos.
 * Una subreceta o varias líneas es un compuesto: se descuenta al pasar a cocina.
 */
function recetaIngredienteGeneral(receta) {
    const lineas = receta.lineas.filter((l) => !l.opcional);
    if (lineas.length !== 1)
        return null;
    const linea = lineas[0];
    if (linea.id_subreceta)
        return null;
    if (linea.id_articulo == null || !(linea.cantidad > 0))
        return null;
    return linea;
}
/**
 * Costo de una unidad de stock. Si la línea está en una presentación con precio
 * (la caja), usa ese precio repartido en sus unidades. Si el artículo no tiene
 * costo y solo una presentación lo tiene, usa esa.
 */
function costoUnitarioEnStock(art, unidadLinea) {
    const presentaciones = art.presentaciones ?? [];
    const unidad = (0, inventario_unidades_1.normalizarUnidad)(unidadLinea);
    const elegida = presentaciones.find((p) => (0, inventario_unidades_1.normalizarUnidad)(p.nombre) === unidad &&
        p.factor > 0 &&
        p.costo != null &&
        p.costo > 0);
    if (elegida?.costo != null && elegida.factor > 0)
        return elegida.costo / elegida.factor;
    if ((art.costo_unitario ?? 0) > 0)
        return art.costo_unitario ?? 0;
    const conPrecio = presentaciones.filter((p) => p.factor > 0 && p.costo != null && p.costo > 0);
    if (conPrecio.length === 1)
        return conPrecio[0].costo / conPrecio[0].factor;
    return art.costo_unitario ?? 0;
}
function resolverArticuloLinea(linea, sustitucionElegida) {
    if (sustitucionElegida != null)
        return sustitucionElegida;
    if (linea.id_articulo != null)
        return linea.id_articulo;
    const alt = linea.sustituciones?.[0];
    return alt?.id_articulo ?? null;
}
function expandirLinea(linea, porciones, articulos, recetas, conversiones, sustitucionesPorLinea, visitadas) {
    const errores = [];
    const movimientos = [];
    let costo = 0;
    if (linea.id_subreceta) {
        if (visitadas.has(linea.id_subreceta)) {
            errores.push({
                codigo: 'subreceta_desconocida',
                mensaje: `Subreceta circular: ${linea.id_subreceta}`,
                id_linea: linea.id_linea,
            });
            return { movimientos, costo, errores };
        }
        const sub = recetas.get(linea.id_subreceta);
        if (!sub) {
            errores.push({
                codigo: 'subreceta_desconocida',
                mensaje: `Subreceta no encontrada: ${linea.id_subreceta}`,
                id_linea: linea.id_linea,
            });
            return { movimientos, costo, errores };
        }
        const subPorciones = porciones * linea.cantidad;
        const nested = visitadas;
        nested.add(linea.id_subreceta);
        const r = calcularConsumoRecetaInterno(sub, subPorciones, articulos, recetas, conversiones, sustitucionesPorLinea, nested);
        if (!r.ok)
            return { movimientos, costo, errores: r.errores };
        movimientos.push(...r.movimientos);
        costo += r.costo_total;
        return { movimientos, costo, errores };
    }
    const idArt = resolverArticuloLinea(linea, sustitucionesPorLinea.get(linea.id_linea));
    if (idArt == null) {
        if (linea.opcional)
            return { movimientos, costo, errores };
        errores.push({
            codigo: 'linea_sin_articulo',
            mensaje: 'Línea de receta sin artículo ni sustitución',
            id_linea: linea.id_linea,
        });
        return { movimientos, costo, errores };
    }
    const art = articulos.get(idArt);
    if (!art || art.activo === false) {
        errores.push({
            codigo: 'articulo_desconocido',
            mensaje: `Artículo ${idArt} no disponible`,
            id_linea: linea.id_linea,
        });
        return { movimientos, costo, errores };
    }
    let cantidadLinea = linea.cantidad * porciones;
    const sust = linea.sustituciones?.find((s) => s.id_articulo === idArt);
    if (sust?.factor != null)
        cantidadLinea *= sust.factor;
    const conv = (0, inventario_unidades_1.convertirCantidad)(cantidadLinea, linea.unidad, art.unidad_stock, art.conversiones?.length ? [...art.conversiones, ...conversiones] : conversiones);
    if (!conv.ok) {
        errores.push({
            codigo: 'conversion_fallida',
            mensaje: conv.error.mensaje,
            id_linea: linea.id_linea,
        });
        return { movimientos, costo, errores };
    }
    const delta = -(0, inventario_unidades_1.redondearInventario)(conv.cantidad);
    const costoUnit = costoUnitarioEnStock(art, linea.unidad);
    movimientos.push({
        id_articulo: idArt,
        tipo_mov: 'consumo_receta',
        delta,
        unidad: art.unidad_stock,
        costo_unitario: costoUnit,
        modulo_origen: 'cocina',
        observacion: `Receta ${linea.id_linea}`,
    });
    costo += Math.abs(delta) * costoUnit;
    return { movimientos, costo, errores };
}
function calcularConsumoRecetaInterno(receta, porciones, articulos, recetas, conversiones, sustitucionesPorLinea, visitadas) {
    if (!receta.lineas.length) {
        return {
            ok: false,
            errores: [{ codigo: 'receta_vacia', mensaje: 'La receta no tiene líneas' }],
        };
    }
    const movimientos = [];
    const errores = [];
    let costo_total = 0;
    for (const linea of receta.lineas) {
        const r = expandirLinea(linea, porciones, articulos, recetas, conversiones, sustitucionesPorLinea, visitadas);
        movimientos.push(...r.movimientos);
        costo_total += r.costo;
        errores.push(...r.errores);
    }
    if (errores.length)
        return { ok: false, errores };
    return {
        ok: true,
        movimientos: consolidarMovimientos(movimientos),
        costo_total: (0, inventario_unidades_1.redondearInventario)(costo_total),
    };
}
/** Agrupa deltas del mismo artículo en un solo movimiento planificado. */
function consolidarMovimientos(movimientos) {
    const map = new Map();
    for (const m of movimientos) {
        const prev = map.get(m.id_articulo);
        if (!prev) {
            map.set(m.id_articulo, { ...m });
            continue;
        }
        map.set(m.id_articulo, {
            ...prev,
            delta: (0, inventario_unidades_1.redondearInventario)(prev.delta + m.delta),
        });
    }
    return [...map.values()].filter((m) => m.delta !== 0);
}
function calcularConsumoReceta(receta, porciones, articulos, recetas = new Map(), conversiones = [], sustitucionesPorLinea = new Map()) {
    return calcularConsumoRecetaInterno(receta, porciones, articulos, recetas, conversiones, sustitucionesPorLinea, new Set([receta.id_receta]));
}
const EPS_STOCK = 1e-6;
function cantidadEnStock(cantidad, unidad, art, conversiones) {
    const conv = (0, inventario_unidades_1.convertirCantidad)(cantidad, unidad, art.unidad_stock, art.conversiones?.length ? [...art.conversiones, ...conversiones] : conversiones);
    return conv.ok ? (0, inventario_unidades_1.redondearInventario)(conv.cantidad) : null;
}
/**
 * Decide, por línea, si se descuenta el principal o un alterno según el stock vivo.
 * Orden: principal si alcanza → primer alterno que alcance → principal igual (queda negativo).
 * `reservado` acumula lo ya comprometido (otras líneas del mismo pedido) y se actualiza.
 */
function elegirSustitucionesPorStock(receta, porciones, articulos, recetas = new Map(), conversiones = [], reservado = new Map()) {
    const elegidas = new Map();
    const aplicadas = [];
    const disponible = (id) => (articulos.get(id)?.cantidad_actual ?? 0) - (reservado.get(id) ?? 0);
    const reservar = (id, n) => reservado.set(id, (0, inventario_unidades_1.redondearInventario)((reservado.get(id) ?? 0) + n));
    const recorrer = (r, porc, visitadas) => {
        for (const linea of r.lineas) {
            if (linea.id_subreceta) {
                if (visitadas.has(linea.id_subreceta))
                    continue;
                const sub = recetas.get(linea.id_subreceta);
                if (sub) {
                    recorrer(sub, porc * linea.cantidad, new Set([...visitadas, linea.id_subreceta]));
                }
                continue;
            }
            const idP = linea.id_articulo;
            const cantidadLinea = linea.cantidad * porc;
            const principal = idP != null ? articulos.get(idP) : undefined;
            const reqP = principal
                ? cantidadEnStock(cantidadLinea, linea.unidad, principal, conversiones)
                : null;
            if (idP == null)
                continue;
            const dispP = principal ? disponible(idP) : 0;
            if (principal && reqP != null && reqP <= dispP + EPS_STOCK) {
                reservar(idP, reqP);
                continue;
            }
            let usado = null;
            for (const s of linea.sustituciones ?? []) {
                const art = articulos.get(s.id_articulo);
                if (!art || art.activo === false)
                    continue;
                const req = cantidadEnStock(cantidadLinea * (s.factor ?? 1), linea.unidad, art, conversiones);
                if (req != null && req <= disponible(s.id_articulo) + EPS_STOCK) {
                    usado = s.id_articulo;
                    reservar(s.id_articulo, req);
                    break;
                }
            }
            if (usado != null)
                elegidas.set(linea.id_linea, usado);
            else if (reqP != null)
                reservar(idP, reqP);
            aplicadas.push({
                id_linea: linea.id_linea,
                id_principal: idP,
                id_sustituto: usado,
                requerido_principal: reqP ?? 0,
                disponible_principal: dispP,
            });
        }
    };
    recorrer(receta, porciones, new Set([receta.id_receta]));
    return { elegidas, aplicadas };
}
function calcularCostoReceta(receta, articulos, recetas = new Map(), conversiones = []) {
    const r = calcularConsumoReceta(receta, 1, articulos, recetas, conversiones);
    return r.ok ? r.costo_total : 0;
}

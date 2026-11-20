/**
 * Ajuste de precios por fórmula polinómica:
 *
 *   precio nuevo = precio base × (Σ peso_i × índice_i(hoy) / índice_i(base)
 *                                 + peso_fijo × (1 + aumento fijo)
 *                                 + parte que no se ajusta)
 *
 * Los pesos son porcentajes que suman 100: lo que no se asigna a ningún
 * componente queda como "parte que no se ajusta".
 */

export interface SeriesPoint {
    period: string; // "2026-05"
    value: number;
}

export interface IndexComponent {
    kind: 'index';
    key: string;
    label: string;
    /** Peso en %, de 0 a 100. */
    weight: number;
    series: SeriesPoint[];
}

export interface FixedComponent {
    kind: 'fixed';
    label: string;
    weight: number;
    /** Aumento en % que se aplica a esa parte (por ejemplo, el de un decreto). */
    increase: number;
}

export type Component = IndexComponent | FixedComponent;

export interface ComponentResult {
    label: string;
    weight: number;
    /** Variación del componente en %. */
    change: number;
    /** Cuántos puntos del aumento total aporta (peso × variación). */
    contribution: number;
    /** Mes que se usó como "hoy" si el del destino todavía no estaba publicado. */
    usedPeriod?: string;
    basePeriod?: string;
}

export interface AdjustResult {
    newPrice: number;
    totalChange: number;
    unadjustedWeight: number;
    components: ComponentResult[];
}

export class AdjustError extends Error {}

/** El último dato publicado hasta ese mes (el IPC sale con un mes de atraso). */
export function valueAtOrBefore(series: SeriesPoint[], period: string): SeriesPoint | null {
    let best: SeriesPoint | null = null;
    for (const p of series) if (p.period <= period && p.value > 0 && (!best || p.period > best.period)) best = p;
    return best;
}

export function adjustPrice(basePrice: number, basePeriod: string, targetPeriod: string, components: Component[]): AdjustResult {
    if (!(basePrice > 0)) throw new AdjustError('Cargá el precio que querés actualizar.');
    if (targetPeriod < basePeriod) throw new AdjustError('El mes al que querés llevar el precio es anterior al del precio.');
    const active = components.filter((c) => c.weight > 0);
    const assigned = active.reduce((s, c) => s + c.weight, 0);
    if (active.some((c) => c.weight < 0 || c.weight > 100) || assigned > 100.0001) throw new AdjustError('Los pesos no pueden sumar más de 100%.');

    let factor = (100 - assigned) / 100; // la parte que no se ajusta queda igual
    const results: ComponentResult[] = [];
    for (const c of active) {
        const w = c.weight / 100;
        if (c.kind === 'fixed') {
            factor += w * (1 + c.increase / 100);
            results.push({ label: c.label, weight: c.weight, change: c.increase, contribution: w * c.increase });
            continue;
        }
        const base = c.series.find((p) => p.period === basePeriod && p.value > 0);
        if (!base) throw new AdjustError(`No hay dato de ${c.label} para el mes del precio.`);
        const now = valueAtOrBefore(c.series, targetPeriod);
        if (!now) throw new AdjustError(`No hay dato de ${c.label} para el mes de destino.`);
        const ratio = now.value / base.value;
        factor += w * ratio;
        results.push({
            label: c.label,
            weight: c.weight,
            change: (ratio - 1) * 100,
            contribution: w * (ratio - 1) * 100,
            basePeriod: base.period,
            ...(now.period !== targetPeriod ? { usedPeriod: now.period } : {}),
        });
    }
    return { newPrice: basePrice * factor, totalChange: (factor - 1) * 100, unadjustedWeight: 100 - assigned, components: results };
}

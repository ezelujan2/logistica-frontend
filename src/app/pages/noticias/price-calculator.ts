import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SliderModule } from 'primeng/slider';
import { TooltipModule } from 'primeng/tooltip';
import { Indicator } from '../../service/news.service';
import { AdjustError, AdjustResult, adjustPrice, Component as PriceComponent } from './price-adjust';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const FUEL_OPTIONS = [
    { label: 'Nafta súper', value: 'FUEL_NAFTA_SUPER' },
    { label: 'Nafta premium', value: 'FUEL_NAFTA_PREMIUM' },
    { label: 'Gasoil', value: 'FUEL_GASOIL' },
    { label: 'Gasoil premium', value: 'FUEL_GASOIL_PREMIUM' },
    { label: 'GNC', value: 'FUEL_GNC' }
];
const STORAGE_KEY = 'lecma.priceCalculator';
const WEIGHT_FIELDS = ['ipcWeight', 'fuelWeight', 'fixedWeight'] as const;
type WeightField = (typeof WEIGHT_FIELDS)[number];

interface Saved {
    what: string;
    basePeriod: string;
    ipcWeight: number;
    fuelWeight: number;
    fuelKey: string;
    fixedWeight: number;
    fixedIncrease: number;
}

/**
 * Calculadora de ajuste por polinómica: un precio de un mes llevado a otro
 * según cuánto pesan el IPC, un combustible y un aumento fijo (decreto, acuerdo).
 */
@Component({
    selector: 'app-price-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, SelectModule, SelectButtonModule, SliderModule, TooltipModule],
    template: `
        <div class="card mb-0">
            <h2 class="text-lg font-bold m-0">Calculadora de ajuste de precios</h2>
            <p class="text-muted-color m-0 mt-1 mb-5">Elegí un precio de un mes y cuánto pesa cada costo (fórmula polinómica). Te dice cuánto deberías cobrar ahora.</p>

            <div class="grid grid-cols-12 gap-6">
                <div class="col-span-12 xl:col-span-7 flex flex-col gap-6">
                    <!-- 1. El precio -->
                    <section class="flex flex-col gap-3" aria-labelledby="calcStep1">
                        <h3 id="calcStep1" class="!text-base !font-semibold !m-0 flex items-center gap-2"><span class="step" aria-hidden="true">1</span>El precio de partida</h3>
                        <p-selectButton [options]="whatOptions" [(ngModel)]="what" (ngModelChange)="save()" optionLabel="label" optionValue="value" [allowEmpty]="false" ariaLabelledBy="calcStep1" />
                        <div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_1fr] gap-3 items-end">
                            <div class="flex flex-col gap-1">
                                <label for="calcBasePrice" class="text-sm text-muted-color">Precio</label>
                                <p-inputNumber inputId="calcBasePrice" [(ngModel)]="basePrice" mode="currency" currency="ARS" locale="es-AR" [minFractionDigits]="0" [maxFractionDigits]="2" [min]="0" placeholder="$ 0" styleClass="w-full" inputStyleClass="w-full" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label for="calcBasePeriod" class="text-sm text-muted-color">de</label>
                                <p-select inputId="calcBasePeriod" [options]="baseOptions" [(ngModel)]="basePeriod" (ngModelChange)="save()" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                            </div>
                            <span class="hidden sm:block text-muted-color pb-3" aria-hidden="true"><i class="pi pi-arrow-right"></i></span>
                            <div class="flex flex-col gap-1">
                                <label for="calcTargetPeriod" class="text-sm text-muted-color">llevado a</label>
                                <p-select inputId="calcTargetPeriod" [options]="targetOptions" [(ngModel)]="targetPeriod" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                            </div>
                        </div>
                        <p-button *ngIf="what === 'km' && tariffAtBase" [label]="'Usar ' + tariffName + ' de ' + monthLabel(basePeriod) + ' (' + money(tariffAtBase, 2) + ')'" icon="pi pi-download" [text]="true" size="small" styleClass="self-start" (click)="basePrice = tariffAtBase" />
                    </section>

                    <!-- 2. Los pesos -->
                    <fieldset class="flex flex-col gap-4 border-0 p-0 m-0 min-w-0">
                        <legend class="text-base font-semibold p-0 mb-3 flex items-center gap-2"><span class="step" aria-hidden="true">2</span>Cuánto pesa cada costo</legend>
                        <div class="flex flex-wrap gap-2 items-center">
                            <span class="text-sm text-muted-color">Rápido:</span>
                            <p-button *ngFor="let p of presets" [label]="p.label" size="small" [rounded]="true" [outlined]="!isPreset(p)" severity="secondary" (click)="applyPreset(p)" />
                        </div>

                        <!-- Reparto del precio -->
                        <div aria-hidden="true">
                            <div class="flex h-3 rounded-full overflow-hidden gap-[2px] bg-surface-100 dark:bg-surface-800">
                                <div *ngFor="let part of parts" class="h-full transition-all" [style.width.%]="part.weight" [style.background]="part.color"></div>
                            </div>
                        </div>

                        <div *ngFor="let row of rows" class="grid grid-cols-[1fr_6.5rem] sm:grid-cols-[14rem_1fr_6.5rem] gap-x-4 gap-y-2 items-center">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="inline-block w-3 h-3 rounded-sm shrink-0" [style.background]="row.color" aria-hidden="true"></span>
                                <ng-container [ngSwitch]="row.key">
                                    <label *ngSwitchCase="'ipc'" for="calcIpcWeight">Inflación (IPC)</label>
                                    <p-select *ngSwitchCase="'fuel'" [options]="fuelOptions" [(ngModel)]="fuelKey" (ngModelChange)="save()" optionLabel="label" optionValue="value" appendTo="body" size="small" styleClass="w-full" ariaLabel="Qué combustible" />
                                    <span *ngSwitchCase="'fixed'" class="flex items-center gap-2 min-w-0">
                                        <label for="calcFixedIncrease" class="whitespace-nowrap">Aumento fijo</label>
                                        <p-inputNumber inputId="calcFixedIncrease" [(ngModel)]="fixedIncrease" (ngModelChange)="save()" prefix="+" suffix=" %" [minFractionDigits]="0" [maxFractionDigits]="2" size="small" styleClass="w-full" inputStyleClass="w-full" pTooltip="Decreto, acuerdo o lo que quieras sumar" />
                                    </span>
                                </ng-container>
                            </div>
                            <div class="hidden sm:block"><p-slider [ngModel]="row.get()" (ngModelChange)="row.set($event)" [min]="0" [max]="100" [step]="5" [ariaLabel]="'Peso de ' + row.name" /></div>
                            <p-inputNumber [inputId]="row.inputId" [ngModel]="row.get()" (ngModelChange)="row.set($event)" suffix=" %" [min]="0" [max]="100" size="small" styleClass="w-full" inputStyleClass="w-full text-right" [ariaLabel]="'Peso de ' + row.name" [invalid]="assigned > 100" />
                        </div>

                        <div class="grid grid-cols-[1fr_6.5rem] sm:grid-cols-[14rem_1fr_6.5rem] gap-x-4 items-center text-sm" role="status">
                            <span class="flex items-center gap-2"><span class="inline-block w-3 h-3 rounded-sm shrink-0 border border-surface-300 dark:border-surface-600" aria-hidden="true"></span>Queda igual</span>
                            <span class="hidden sm:block"></span>
                            <span class="text-right pr-3" [class.text-red-600]="assigned > 100" [class.dark:text-red-400]="assigned > 100">{{ assigned > 100 ? 'Se pasa' : num(100 - assigned, 0, 2) + ' %' }}</span>
                        </div>
                        <div *ngIf="assigned > 100" class="text-sm text-red-600 dark:text-red-400"><i class="pi pi-exclamation-triangle mr-1" aria-hidden="true"></i>Los pesos suman {{ num(assigned, 0, 2) }}%: no pueden pasar de 100%.</div>
                    </fieldset>
                </div>

                <!-- Resultado -->
                <aside class="col-span-12 xl:col-span-5 rounded-xl bg-surface-50 dark:bg-surface-800 p-5 flex flex-col gap-4 self-start" aria-label="Resultado">
                    <div *ngIf="error && assigned <= 100" class="text-muted-color flex items-start gap-2"><i class="pi pi-info-circle mt-1" aria-hidden="true"></i><span>{{ error }}</span></div>
                    <div *ngIf="assigned > 100" class="text-muted-color">Corregí los pesos para ver el resultado.</div>
                    <ng-container *ngIf="result && !error && assigned <= 100">
                        <div role="status">
                            <div class="text-sm text-muted-color">{{ what === 'km' ? 'Precio por km' : what === 'service' ? 'Precio del servicio' : 'Precio' }} en {{ monthLabel(targetPeriod) }}</div>
                            <div class="text-4xl font-bold mt-1">{{ money(result.newPrice, 2) }}</div>
                            <div class="mt-1"><span class="font-semibold mr-1">{{ pct(result.totalChange) }}</span><span class="text-muted-color">sobre {{ money(basePrice, 2) }} de {{ monthLabel(basePeriod) }}</span></div>
                        </div>
                        <div class="overflow-x-auto" tabindex="0" role="region" aria-labelledby="calcBreakdownCaption">
                            <table class="w-full text-sm">
                                <caption id="calcBreakdownCaption" class="text-left text-muted-color mb-1">Cómo se arma el aumento</caption>
                                <thead>
                                    <tr class="border-b border-surface-200 dark:border-surface-700 text-left">
                                        <th scope="col" class="py-2 pr-2 font-medium">Costo</th>
                                        <th scope="col" class="py-2 px-2 text-right font-medium">Peso</th>
                                        <th scope="col" class="py-2 px-2 text-right font-medium">Subió</th>
                                        <th scope="col" class="py-2 pl-2 text-right font-medium">Aporta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let c of result.components" class="border-b border-surface-200/60 dark:border-surface-700/60">
                                        <th scope="row" class="py-1.5 pr-2 text-left font-normal">{{ c.label }}<div *ngIf="c.usedPeriod" class="text-xs text-muted-color">dato de {{ monthLabel(c.usedPeriod) }}</div></th>
                                        <td class="py-1.5 px-2 text-right whitespace-nowrap">{{ num(c.weight, 0, 2) }}%</td>
                                        <td class="py-1.5 px-2 text-right whitespace-nowrap">{{ pct(c.change) }}</td>
                                        <td class="py-1.5 pl-2 text-right whitespace-nowrap">{{ points(c.contribution) }}</td>
                                    </tr>
                                    <tr *ngIf="result.unadjustedWeight > 0" class="border-b border-surface-200/60 dark:border-surface-700/60">
                                        <th scope="row" class="py-1.5 pr-2 text-left font-normal">Queda igual</th>
                                        <td class="py-1.5 px-2 text-right whitespace-nowrap">{{ num(result.unadjustedWeight, 0, 2) }}%</td>
                                        <td class="py-1.5 px-2 text-right">—</td>
                                        <td class="py-1.5 pl-2 text-right">—</td>
                                    </tr>
                                    <tr class="font-semibold">
                                        <th scope="row" class="py-1.5 pr-2 text-left">Total</th>
                                        <td class="py-1.5 px-2 text-right">100%</td>
                                        <td class="py-1.5 px-2"></td>
                                        <td class="py-1.5 pl-2 text-right whitespace-nowrap">{{ pct(result.totalChange) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <small *ngIf="usesOldData" class="text-muted-color">Algún índice todavía no publicó el mes elegido (el IPC sale a mediados del mes siguiente): se usó el último dato disponible.</small>
                    </ng-container>
                </aside>
            </div>
        </div>
    `,
    styles: [`
        .step { display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border-radius: 999px; font-size: 0.8rem; background: var(--p-primary-color); color: var(--p-primary-contrast-color); }
    `]
})
export class PriceCalculator implements OnChanges {
    @Input() market: Indicator[] = [];

    readonly whatOptions = [
        { label: 'Precio por km', value: 'km' },
        { label: 'Un servicio', value: 'service' },
        { label: 'Otro', value: 'other' }
    ];
    readonly fuelOptions = FUEL_OPTIONS;
    readonly presets = [
        { label: '50% IPC + 50% combustible', ipc: 50, fuel: 50, fixed: 0 },
        { label: '100% IPC', ipc: 100, fuel: 0, fixed: 0 },
        { label: '100% combustible', ipc: 0, fuel: 100, fixed: 0 }
    ];

    /** Mismos colores que el gráfico de evolución (IPC naranja, combustible azul). */
    private readonly colors = { ipc: '#eb6834', fuel: '#2a78d6', fixed: '#6250d6' };

    readonly rows = [
        { key: 'ipc', name: 'la inflación', inputId: 'calcIpcWeight', color: this.colors.ipc, get: () => this.ipcWeight, set: (v: number | null) => this.setWeight('ipcWeight', v) },
        { key: 'fuel', name: 'el combustible', inputId: 'calcFuelWeight', color: this.colors.fuel, get: () => this.fuelWeight, set: (v: number | null) => this.setWeight('fuelWeight', v) },
        { key: 'fixed', name: 'el aumento fijo', inputId: 'calcFixedWeight', color: this.colors.fixed, get: () => this.fixedWeight, set: (v: number | null) => this.setWeight('fixedWeight', v) }
    ];

    /** La barra del reparto: cada costo y lo que queda igual. */
    get parts() {
        const total = Math.min(100, this.assigned);
        const scale = this.assigned > 100 ? 100 / this.assigned : 1;
        return [
            { weight: (this.ipcWeight || 0) * scale, color: this.colors.ipc },
            { weight: (this.fuelWeight || 0) * scale, color: this.colors.fuel },
            { weight: (this.fixedWeight || 0) * scale, color: this.colors.fixed },
            { weight: 100 - total, color: 'transparent' }
        ].filter((p) => p.weight > 0);
    }

    /**
     * Cambia un peso. Si con eso se pasa de 100%, lo que sobra se descuenta de
     * los otros dos, en proporción a lo que pesa cada uno.
     */
    private setWeight(field: WeightField, v: number | null) {
        const value = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
        this[field] = value;
        const others = WEIGHT_FIELDS.filter((f) => f !== field);
        let excess = value + others.reduce((a, f) => a + (this[f] || 0), 0) - 100;
        if (excess > 0) {
            const pool = others.reduce((a, f) => a + (this[f] || 0), 0);
            for (const f of others) {
                const cut = Math.min(this[f] || 0, Math.round((excess * (this[f] || 0)) / pool));
                this[f] = (this[f] || 0) - cut;
            }
            // Lo que quede por redondeo sale del que más pesa.
            excess = WEIGHT_FIELDS.reduce((a, f) => a + (this[f] || 0), 0) - 100;
            if (excess > 0) {
                const biggest = [...others].sort((a, b) => (this[b] || 0) - (this[a] || 0))[0]!;
                this[biggest] = Math.max(0, (this[biggest] || 0) - excess);
            }
        }
        this.save();
    }

    isPreset(p: { ipc: number; fuel: number; fixed: number }): boolean {
        return this.ipcWeight === p.ipc && this.fuelWeight === p.fuel && this.fixedWeight === p.fixed;
    }

    what = 'km';
    basePrice: number | null = null;
    basePeriod = '';
    targetPeriod = '';
    ipcWeight = 50;
    fuelWeight = 50;
    fuelKey = 'FUEL_NAFTA_SUPER';
    fixedWeight = 0;
    fixedIncrease = 0;

    baseOptions: { label: string; value: string }[] = [];
    targetOptions: { label: string; value: string }[] = [];

    constructor() {
        try {
            const saved: Partial<Saved> = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
            Object.assign(this, pick(saved));
        } catch {
            // Sin almacenamiento del navegador se usan los valores por defecto.
        }
    }

    ngOnChanges() {
        const periods = new Set<string>();
        for (const m of this.market) if (m.key === 'CPI_NATIONAL' || m.key.startsWith('FUEL_')) m.series.forEach((p) => periods.add(p.period));
        const sorted = [...periods].sort();
        const latest = sorted[sorted.length - 1] ?? '';
        this.baseOptions = [...sorted].reverse().map((p) => ({ label: this.monthLabel(p), value: p }));
        this.targetOptions = this.baseOptions;
        if (!sorted.includes(this.basePeriod)) this.basePeriod = sorted[Math.max(0, sorted.length - 7)] ?? '';
        if (!sorted.includes(this.targetPeriod)) this.targetPeriod = latest;
    }

    private series(key: string) {
        return this.market.find((m) => m.key === key)?.series ?? [];
    }

    /** La tarifa elegida en la pantalla (la favorita, si no se cambió). */
    get tariffName(): string {
        const t = this.market.find((m) => m.key === 'TARIFF_KM');
        return t?.scope ? `la tarifa ${t.scope}` : 'tu tarifa';
    }

    get tariffAtBase(): number | null {
        const v = this.series('TARIFF_KM').find((p) => p.period === this.basePeriod)?.value;
        return v ? Math.round(v * 100) / 100 : null;
    }

    get assigned(): number {
        return (this.ipcWeight || 0) + (this.fuelWeight || 0) + (this.fixedWeight || 0);
    }

    private get components(): PriceComponent[] {
        const fuelLabel = FUEL_OPTIONS.find((f) => f.value === this.fuelKey)?.label ?? 'Combustible';
        return [
            { kind: 'index', key: 'CPI_NATIONAL', label: 'Inflación (IPC)', weight: this.ipcWeight || 0, series: this.series('CPI_NATIONAL') },
            { kind: 'index', key: this.fuelKey, label: fuelLabel, weight: this.fuelWeight || 0, series: this.series(this.fuelKey) },
            { kind: 'fixed', label: `Aumento fijo (+${(this.fixedIncrease || 0).toLocaleString('es-AR')}%)`, weight: this.fixedWeight || 0, increase: this.fixedIncrease || 0 }
        ];
    }

    /** Se recalcula sola con cada cambio. */
    get calc(): { result: AdjustResult | null; error: string | null } {
        if (!this.basePrice) return { result: null, error: 'Cargá un precio para ver cuánto deberías cobrar.' };
        try {
            return { result: adjustPrice(this.basePrice, this.basePeriod, this.targetPeriod, this.components), error: null };
        } catch (e) {
            return { result: null, error: e instanceof AdjustError ? e.message : 'No se pudo calcular.' };
        }
    }

    get result() {
        return this.calc.result;
    }

    get error() {
        return this.calc.error;
    }

    get usesOldData(): boolean {
        return !!this.result?.components.some((c) => c.usedPeriod);
    }

    applyPreset(p: { ipc: number; fuel: number; fixed: number }) {
        this.ipcWeight = p.ipc;
        this.fuelWeight = p.fuel;
        this.fixedWeight = p.fixed;
        this.save();
    }

    /** Recuerda los pesos en este navegador (el precio no, por si cambia cada vez). */
    save() {
        try {
            const data: Saved = { what: this.what, basePeriod: this.basePeriod, ipcWeight: this.ipcWeight, fuelWeight: this.fuelWeight, fuelKey: this.fuelKey, fixedWeight: this.fixedWeight, fixedIncrease: this.fixedIncrease };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            // Sin almacenamiento: no se recuerda, nada más.
        }
    }

    /** Número con formato argentino (1.234,5). */
    num(v: number | null | undefined, minDecimals = 0, maxDecimals = 2): string {
        if (v === null || v === undefined) return '—';
        return v.toLocaleString('es-AR', { minimumFractionDigits: minDecimals, maximumFractionDigits: maxDecimals });
    }

    /** Pesos con formato argentino ($ 1.631,53): el resto del sistema todavía usa el de EE.UU. */
    money(v: number | null | undefined, decimals = 0): string {
        if (v === null || v === undefined) return '—';
        return v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    monthLabel(period: string | undefined | null): string {
        if (!period) return '';
        return `${MONTHS[Number(period.slice(5, 7)) - 1]} ${period.slice(0, 4)}`;
    }

    pct(v: number): string {
        return `${v > 0 ? '+' : ''}${v.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    }

    points(v: number): string {
        return `${v > 0 ? '+' : ''}${v.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} puntos`;
    }
}

/** Sólo los campos conocidos y con el tipo correcto. */
function pick(s: Partial<Saved>): Partial<Saved> {
    const out: Partial<Saved> = {};
    if (['km', 'service', 'other'].includes(s.what as string)) out.what = s.what;
    if (typeof s.basePeriod === 'string' && /^\d{4}-\d{2}$/.test(s.basePeriod)) out.basePeriod = s.basePeriod;
    if (FUEL_OPTIONS.some((f) => f.value === s.fuelKey)) out.fuelKey = s.fuelKey;
    for (const k of ['ipcWeight', 'fuelWeight', 'fixedWeight', 'fixedIncrease'] as const) {
        if (typeof s[k] === 'number' && isFinite(s[k] as number)) out[k] = s[k] as number;
    }
    return out;
}

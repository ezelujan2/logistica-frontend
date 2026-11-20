import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
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
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, SelectModule, SelectButtonModule],
    template: `
        <div class="card mb-0">
            <h2 class="text-lg font-bold m-0">Calculadora de ajuste de precios</h2>
            <p class="text-muted-color m-0 mt-1 mb-4">Poné un precio de un mes y cuánto pesa cada costo (fórmula polinómica). Te dice cuánto deberías cobrar ahora.</p>

            <div class="grid grid-cols-12 gap-4">
                <!-- Precio de partida -->
                <div class="col-span-12 lg:col-span-5 flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <span id="calcWhatLabel" class="font-medium">¿Qué precio querés actualizar?</span>
                        <p-selectButton [options]="whatOptions" [(ngModel)]="what" (ngModelChange)="save()" optionLabel="label" optionValue="value" [allowEmpty]="false" ariaLabelledBy="calcWhatLabel" />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="col-span-2 sm:col-span-1 flex flex-col gap-2">
                            <label for="calcBasePrice" class="font-medium">Precio</label>
                            <p-inputNumber inputId="calcBasePrice" [(ngModel)]="basePrice" mode="currency" currency="ARS" locale="es-AR" [minFractionDigits]="0" [maxFractionDigits]="2" [min]="0" placeholder="$ 0" styleClass="w-full" inputStyleClass="w-full" />
                        </div>
                        <div class="col-span-2 sm:col-span-1 flex flex-col gap-2">
                            <label for="calcBasePeriod" class="font-medium">Mes de ese precio</label>
                            <p-select inputId="calcBasePeriod" [options]="baseOptions" [(ngModel)]="basePeriod" (ngModelChange)="save()" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                        </div>
                    </div>
                    <p-button *ngIf="what === 'km' && tariffAtBase" [label]="'Usar tu tarifa base de ' + monthLabel(basePeriod) + ' (' + money(tariffAtBase) + ')'" icon="pi pi-download" [text]="true" size="small" styleClass="self-start p-0" (click)="basePrice = tariffAtBase" />
                    <div class="flex flex-col gap-2">
                        <label for="calcTargetPeriod" class="font-medium">Llevarlo a</label>
                        <p-select inputId="calcTargetPeriod" [options]="targetOptions" [(ngModel)]="targetPeriod" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                    </div>
                </div>

                <!-- Pesos -->
                <fieldset class="col-span-12 lg:col-span-7 flex flex-col gap-3 border-0 p-0 m-0 min-w-0">
                    <legend class="sr-only">Cuánto pesa cada costo</legend>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="font-medium" aria-hidden="true">Cuánto pesa cada costo</span>
                        <div class="flex flex-wrap gap-1">
                            <p-button *ngFor="let p of presets" [label]="p.label" size="small" [outlined]="true" severity="secondary" (click)="applyPreset(p)" />
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-2 items-end">
                        <span class="hidden sm:block sm:col-span-5"></span>
                        <span class="hidden sm:block sm:col-span-3 text-sm text-muted-color" aria-hidden="true">Peso</span>
                        <span class="hidden sm:block sm:col-span-4"></span>
                        <label for="calcIpcWeight" class="col-span-12 sm:col-span-5 sm:pb-2">Inflación (IPC)</label>
                        <div class="col-span-6 sm:col-span-3">
                            <p-inputNumber inputId="calcIpcWeight" [(ngModel)]="ipcWeight" (ngModelChange)="save()" suffix=" %" [min]="0" [max]="100" [showButtons]="true" [step]="5" styleClass="w-full" inputStyleClass="w-full" [invalid]="assigned > 100" />
                        </div>
                        <div class="col-span-12 sm:col-span-4"></div>

                        <div class="col-span-12 sm:col-span-5 flex flex-col gap-1">
                            <label for="calcFuelKey">Combustible</label>
                            <p-select inputId="calcFuelKey" [options]="fuelOptions" [(ngModel)]="fuelKey" (ngModelChange)="save()" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <p-inputNumber inputId="calcFuelWeight" [(ngModel)]="fuelWeight" (ngModelChange)="save()" suffix=" %" [min]="0" [max]="100" [showButtons]="true" [step]="5" styleClass="w-full" inputStyleClass="w-full" ariaLabel="Peso del combustible" [invalid]="assigned > 100" />
                        </div>
                        <div class="col-span-12 sm:col-span-4"></div>

                        <div class="col-span-12 sm:col-span-5 flex flex-col gap-1">
                            <label for="calcFixedIncrease">Aumento fijo (decreto, acuerdo)</label>
                            <p-inputNumber inputId="calcFixedIncrease" [(ngModel)]="fixedIncrease" (ngModelChange)="save()" prefix="+" suffix=" %" [minFractionDigits]="0" [maxFractionDigits]="2" styleClass="w-full" inputStyleClass="w-full" />
                        </div>
                        <div class="col-span-6 sm:col-span-3">
                            <p-inputNumber inputId="calcFixedWeight" [(ngModel)]="fixedWeight" (ngModelChange)="save()" suffix=" %" [min]="0" [max]="100" [showButtons]="true" [step]="5" styleClass="w-full" inputStyleClass="w-full" ariaLabel="Peso del aumento fijo" [invalid]="assigned > 100" />
                        </div>
                        <div class="col-span-12 sm:col-span-4"></div>
                    </div>

                    <div id="calcWeightsHelp" class="text-sm" role="status" [class.text-red-600]="assigned > 100" [class.dark:text-red-400]="assigned > 100" [class.text-muted-color]="assigned <= 100">
                        <ng-container *ngIf="assigned <= 100">Sin ajustar: <b>{{ num(100 - assigned, 0, 2) }}%</b> del precio queda igual.</ng-container>
                        <ng-container *ngIf="assigned > 100"><i class="pi pi-exclamation-triangle mr-1"></i>Los pesos suman {{ num(assigned, 0, 2) }}%: no pueden pasar de 100%.</ng-container>
                    </div>
                </fieldset>
            </div>

            <!-- Resultado -->
            <div class="mt-5 pt-4 border-t border-surface-200 dark:border-surface-700">
                <div *ngIf="error && assigned <= 100" class="text-orange-600 dark:text-orange-400"><i class="pi pi-info-circle mr-1"></i>{{ error }}</div>
                <ng-container *ngIf="result && !error && assigned <= 100">
                    <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1" role="status">
                        <span class="text-muted-color">{{ what === 'km' ? 'Precio por km' : what === 'service' ? 'Precio del servicio' : 'Precio' }} en {{ monthLabel(targetPeriod) }}:</span>
                        <span class="text-3xl font-bold">{{ money(result.newPrice, 2) }}</span>
                        <span class="font-semibold">{{ pct(result.totalChange) }} desde {{ monthLabel(basePeriod) }}</span>
                    </div>
                    <div class="overflow-x-auto mt-3" tabindex="0" role="region" aria-labelledby="calcBreakdownCaption">
                        <table class="w-full text-sm">
                            <caption id="calcBreakdownCaption" class="sr-only">Cómo se compone el aumento</caption>
                            <thead>
                                <tr class="border-b border-surface-200 dark:border-surface-700 text-left">
                                    <th scope="col" class="py-2 pr-3">Costo</th>
                                    <th scope="col" class="py-2 px-3 text-right">Peso</th>
                                    <th scope="col" class="py-2 px-3 text-right">Subió</th>
                                    <th scope="col" class="py-2 pl-3 text-right whitespace-nowrap">Aporta al aumento</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let c of result.components" class="border-b border-surface-100 dark:border-surface-800">
                                    <th scope="row" class="py-1 pr-3 text-left font-normal">{{ c.label }}<span *ngIf="c.usedPeriod" class="text-muted-color"> (último dato: {{ monthLabel(c.usedPeriod) }})</span></th>
                                    <td class="py-1 px-3 text-right whitespace-nowrap">{{ num(c.weight, 0, 2) }}%</td>
                                    <td class="py-1 px-3 text-right whitespace-nowrap">{{ pct(c.change) }}</td>
                                    <td class="py-1 pl-3 text-right whitespace-nowrap">{{ points(c.contribution) }}</td>
                                </tr>
                                <tr *ngIf="result.unadjustedWeight > 0" class="border-b border-surface-100 dark:border-surface-800">
                                    <th scope="row" class="py-1 pr-3 text-left font-normal">Sin ajustar</th>
                                    <td class="py-1 px-3 text-right whitespace-nowrap">{{ num(result.unadjustedWeight, 0, 2) }}%</td>
                                    <td class="py-1 px-3 text-right whitespace-nowrap">0,0%</td>
                                    <td class="py-1 pl-3 text-right whitespace-nowrap">0,0 puntos</td>
                                </tr>
                                <tr class="font-semibold">
                                    <th scope="row" class="py-1 pr-3 text-left">Total</th>
                                    <td class="py-1 px-3 text-right whitespace-nowrap">100%</td>
                                    <td class="py-1 px-3"></td>
                                    <td class="py-1 pl-3 text-right whitespace-nowrap">{{ pct(result.totalChange) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <small *ngIf="usesOldData" class="text-muted-color block mt-2">Algún índice todavía no publicó el mes elegido (el IPC sale a mediados del mes siguiente): se usó el último dato disponible.</small>
                </ng-container>
            </div>
        </div>
    `
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

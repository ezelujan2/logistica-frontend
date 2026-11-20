import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Indicator, NewsItem, NewsPage, NewsService } from '../../service/news.service';
import { AuthService } from '../../service/auth.service';
import { LayoutService } from '../../layout/service/layout.service';
import { PriceCalculator } from './price-calculator';

/** Las tres series del gráfico, en orden fijo: el color sigue a la serie, no a su posición. */
const CHART_SERIES = [
    { key: 'FUEL_NAFTA_SUPER', label: 'Nafta súper' },
    { key: 'CPI_NATIONAL', label: 'IPC (inflación)' },
    { key: 'TARIFF_KM', label: 'Tu tarifa por km' }
];
// Paleta categórica validada (slots 1–3) para fondo claro y oscuro.
const COLORS = { light: ['#2a78d6', '#eb6834', '#1baf7a'], dark: ['#3987e5', '#d95926', '#199e70'] };

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Cómo se nombran en la frase de comparación. */
const COMPARISON_LABELS: Record<string, string> = { FUEL_NAFTA_SUPER: 'nafta súper', CPI_NATIONAL: 'inflación (IPC)', TARIFF_KM: 'tu tarifa por km' };

/** Meses que muestra el gráfico (el primero es la base 100). */
const CHART_MONTHS = 13;

@Component({
    selector: 'app-noticias',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ChartModule, SelectButtonModule, TagModule, TooltipModule, ToastModule, PriceCalculator],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="flex flex-col gap-4">
            <div class="card flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 class="text-2xl font-bold m-0">Noticias y costos</h1>
                    <p class="text-muted-color m-0 mt-1">Combustible en Rosario, inflación y noticias de transporte. Se actualiza solo todos los días a las 7.</p>
                </div>
                <p-button *ngIf="canRefresh" label="Actualizar ahora" icon="pi pi-refresh" [outlined]="true" [loading]="refreshing" (click)="refresh()" pTooltip="Busca noticias nuevas con la IA y actualiza los precios" tooltipPosition="left" />
            </div>

            <div *ngIf="loading" class="card text-center text-muted-color">Cargando…</div>

            <ng-container *ngIf="page && !loading">
                <!-- Indicadores -->
                <div class="grid grid-cols-12 gap-4">
                    <div *ngFor="let ind of tiles" class="col-span-12 sm:col-span-6 xl:col-span-3">
                        <div class="card h-full mb-0 flex flex-col gap-2">
                            <div class="flex items-center justify-between gap-2">
                                <span class="font-semibold">{{ ind.label }}</span>
                                <span class="text-xs text-muted-color">{{ periodLabel(ind.changes.last?.period) }}</span>
                            </div>
                            <ng-container *ngIf="ind.changes.last; else noData">
                                <div class="text-2xl font-bold" *ngIf="ind.key !== 'CPI_NATIONAL'">{{ money(ind.changes.last.value) }}<span class="text-sm font-normal text-muted-color"> {{ unitOf(ind.key) }}</span></div>
                                <div class="text-2xl font-bold" *ngIf="ind.key === 'CPI_NATIONAL'">{{ pct(ind.changes.month) }}<span class="text-sm font-normal text-muted-color"> en el mes</span></div>
                                <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                    <span *ngIf="ind.key !== 'CPI_NATIONAL'">Mes: <b>{{ pct(ind.changes.month) }}</b></span>
                                    <span>En el año: <b>{{ pct(ind.changes.yearToDate) }}</b></span>
                                    <span>12 meses: <b>{{ pct(ind.changes.twelveMonths) }}</b></span>
                                </div>
                                <small class="text-muted-color mt-auto">{{ detailOf(ind) }}</small>
                            </ng-container>
                            <ng-template #noData><span class="text-muted-color text-sm">Todavía sin datos.</span></ng-template>
                        </div>
                    </div>
                </div>

                <!-- Comparación -->
                <div class="card mb-0" *ngIf="comparison">
                    <h2 class="text-lg font-bold m-0 mb-1">¿Tus precios acompañan los costos?</h2>
                    <p class="m-0">{{ comparison }}</p>
                    <small class="text-muted-color">Tu tarifa por km es la de la tarifa favorita (la base). Los meses anteriores salen de los cambios de tarifa que quedaron anotados en la auditoría.</small>
                </div>

                <!-- Calculadora de ajuste -->
                <app-price-calculator [market]="page.market" />

                <!-- Evolución -->
                <div class="card mb-0">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                            <h2 class="text-lg font-bold m-0">Evolución de los últimos 12 meses</h2>
                            <small class="text-muted-color">Cada línea arranca en 100 en {{ periodLabel(chartBase) }}: 130 quiere decir que subió 30%.</small>
                        </div>
                        <p-button [label]="showTable ? 'Ver gráfico' : 'Ver tabla'" [icon]="showTable ? 'pi pi-chart-line' : 'pi pi-table'" [text]="true" size="small" (click)="showTable = !showTable" />
                    </div>
                    <div *ngIf="!showTable" style="height: 320px">
                        <p-chart type="line" [data]="chartData()" [options]="chartOptions()" height="320px" />
                    </div>
                    <div *ngIf="showTable" class="overflow-x-auto" tabindex="0" role="region" aria-labelledby="evolutionCaption">
                        <table class="w-full text-sm">
                            <caption id="evolutionCaption" class="sr-only">Evolución de los últimos 12 meses, base 100</caption>
                            <thead>
                                <tr class="border-b border-surface-200 dark:border-surface-700">
                                    <th scope="col" class="text-left py-2 pr-4">Mes</th>
                                    <th scope="col" *ngFor="let s of chartSeries" class="text-right py-2 px-2">{{ s.label }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let p of chartPeriods; let i = index" class="border-b border-surface-100 dark:border-surface-800">
                                    <th scope="row" class="py-1 pr-4 text-left font-normal whitespace-nowrap">{{ periodLabel(p) }}</th>
                                    <td *ngFor="let s of chartSeries" class="text-right py-1 px-2">{{ s.indexed[i] === null ? '—' : num(s.indexed[i], 1, 1) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Noticias -->
                <div class="card mb-0">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h2 class="text-lg font-bold m-0">Noticias de transporte</h2>
                        <p-selectButton [options]="categoryOptions" [(ngModel)]="category" optionLabel="label" optionValue="value" [allowEmpty]="false" size="small" />
                    </div>
                    <div *ngIf="!filteredNews.length" class="text-muted-color py-4 text-center">
                        {{ page.news.length ? 'No hay noticias de esta categoría en el último mes.' : 'Todavía no hay noticias. Se buscan todos los días a las 7.' }}
                    </div>
                    <ul class="list-none p-0 m-0 flex flex-col gap-4">
                        <li *ngFor="let n of filteredNews" class="border-b border-surface-100 dark:border-surface-800 pb-4">
                            <div class="flex flex-wrap items-center gap-2 text-xs text-muted-color mb-1">
                                <span>{{ n.publishedAt | date: 'dd/MM/yyyy' }}</span>
                                <p-tag [value]="page.categories[n.category] || n.category" severity="secondary" styleClass="text-xs" />
                                <span *ngIf="n.source">{{ n.source }}</span>
                            </div>
                            <a [href]="n.url" target="_blank" rel="noopener noreferrer" class="font-semibold text-color hover:underline">{{ n.title }} <i class="pi pi-external-link text-xs text-muted-color" aria-hidden="true"></i><span class="sr-only"> (se abre en otra pestaña)</span></a>
                            <p class="m-0 mt-1 text-sm">{{ n.summary }}</p>
                        </li>
                    </ul>
                    <small class="text-muted-color block mt-3">
                        Los resúmenes los arma la IA a partir del titular: antes de decidir algo, abrí la nota original.
                        <ng-container *ngIf="page.status.lastRun"> Última búsqueda: {{ page.status.lastRun | date: 'dd/MM HH:mm' }}.</ng-container>
                        Gasto de este mes: US$ {{ page.status.costMonthUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}.
                    </small>
                </div>

                <small class="text-muted-color">Fuentes: Secretaría de Energía (precios en surtidor), INDEC (IPC nivel general nacional) y Google Noticias.</small>
            </ng-container>
        </div>
    `
})
export class Noticias implements OnInit {
    private newsService = inject(NewsService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private layout = inject(LayoutService);

    page: NewsPage | null = null;
    loading = true;
    refreshing = false;
    showTable = false;
    category = 'ALL';
    readonly canRefresh = this.authService.hasPermission('viewSystem');

    tiles: Indicator[] = [];
    comparison = '';
    chartPeriods: string[] = [];
    chartBase = '';
    chartSeries: { key: string; label: string; indexed: (number | null)[] }[] = [];

    /** Sube cada vez que llegan datos nuevos: así el gráfico se rearma (también al cambiar de tema). */
    private dataVersion = signal(0);
    readonly chartData = computed(() => {
        this.dataVersion();
        return this.buildChartData(this.layout.isDarkTheme() ? 'dark' : 'light');
    });
    readonly chartOptions = computed(() => {
        this.layout.isDarkTheme();
        return this.buildChartOptions();
    });

    async ngOnInit() {
        await this.load();
    }

    async load() {
        this.loading = true;
        try {
            this.page = await this.newsService.getPage(30);
            this.prepare();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las noticias.' });
        } finally {
            this.loading = false;
        }
    }

    async refresh() {
        this.refreshing = true;
        try {
            const r = await this.newsService.refresh();
            const n = r?.news;
            const detail = n?.error ? `Indicadores actualizados. Noticias: ${n.error}` : n?.skipped ? n.skipped : `Se revisaron ${n?.candidates ?? 0} titulares y se guardaron ${n?.kept ?? 0}.`;
            this.messageService.add({ severity: n?.error ? 'warn' : 'success', summary: 'Actualizado', detail, life: 6000 });
            await this.load();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' });
        } finally {
            this.refreshing = false;
        }
    }

    get categoryOptions() {
        const cats = this.page?.categories ?? {};
        return [{ label: 'Todas', value: 'ALL' }, ...Object.entries(cats).filter(([k]) => this.page?.news.some((n) => n.category === k)).map(([value, label]) => ({ label, value }))];
    }

    get filteredNews(): NewsItem[] {
        const news = this.page?.news ?? [];
        return this.category === 'ALL' ? news : news.filter((n) => n.category === this.category);
    }

    private ind(key: string): Indicator | undefined {
        return this.page?.market.find((m) => m.key === key);
    }

    private prepare() {
        const order = ['FUEL_NAFTA_SUPER', 'FUEL_NAFTA_PREMIUM', 'FUEL_GASOIL', 'FUEL_GASOIL_PREMIUM', 'FUEL_GNC', 'CPI_NATIONAL', 'TARIFF_KM'];
        this.tiles = order.map((k) => this.ind(k)).filter((i): i is Indicator => !!i);

        // Comparación de 12 meses: sólo lo que tiene dato.
        const parts = CHART_SERIES.map((s) => ({ label: COMPARISON_LABELS[s.key] ?? s.label, v: this.ind(s.key)?.changes.twelveMonths ?? null })).filter((p) => p.v !== null);
        this.comparison = parts.length >= 2 ? `En los últimos 12 meses: ${parts.map((p) => `${p.label} ${this.pct(p.v)}`).join(', ')}.` : '';

        // Gráfico: los últimos 13 meses, cada serie en base 100 en el primer mes que tenga dato.
        const all = new Set<string>();
        for (const s of CHART_SERIES) this.ind(s.key)?.series.forEach((p) => all.add(p.period));
        this.chartPeriods = [...all].sort().slice(-CHART_MONTHS);
        this.chartBase = this.chartPeriods[0] ?? '';
        this.chartSeries = CHART_SERIES.map((s) => {
            const at = new Map((this.ind(s.key)?.series ?? []).map((p) => [p.period, p.value]));
            const base = this.chartPeriods.map((p) => at.get(p)).find((v) => v !== undefined && v > 0);
            return { ...s, indexed: this.chartPeriods.map((p) => (base && at.has(p) ? (at.get(p)! / base) * 100 : null)) };
        });
        this.dataVersion.update((v) => v + 1);
    }

    private buildChartData(mode: 'light' | 'dark') {
        return {
            labels: this.chartPeriods.map((p) => this.periodLabel(p)),
            datasets: this.chartSeries.map((s, i) => ({
                label: s.label,
                data: s.indexed,
                borderColor: COLORS[mode][i],
                backgroundColor: COLORS[mode][i],
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 12,
                spanGaps: true,
                tension: 0.25
            }))
        };
    }

    private buildChartOptions() {
        const style = getComputedStyle(document.documentElement);
        const text = style.getPropertyValue('--text-color') || '#334155';
        const muted = style.getPropertyValue('--text-color-secondary') || '#64748b';
        const grid = style.getPropertyValue('--surface-border') || '#e2e8f0';
        return {
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { color: text, usePointStyle: true, pointStyle: 'line' } },
                tooltip: { callbacks: { label: (ctx: any) => (ctx.parsed.y === null ? `${ctx.dataset.label}: sin dato` : `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('es-AR', { maximumFractionDigits: 1 })}`) } }
            },
            scales: {
                x: { ticks: { color: muted }, grid: { display: false } },
                y: { ticks: { color: muted }, grid: { color: grid } }
            }
        };
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

    periodLabel(period: string | undefined | null): string {
        if (!period) return '';
        const [y, m] = period.split('-');
        return `${MONTHS[Number(m) - 1]} ${y}`;
    }

    unitOf(key: string): string {
        return key === 'FUEL_GNC' ? 'por m³' : key === 'TARIFF_KM' ? 'por km' : 'por litro';
    }

    detailOf(ind: Indicator): string {
        if (ind.key === 'CPI_NATIONAL') {
            const p = ind.changes.last?.period;
            return p ? `INDEC, nacional. Último dato: ${MONTHS_LONG[Number(p.slice(5)) - 1]} ${p.slice(0, 4)}.` : 'INDEC';
        }
        if (ind.key === 'TARIFF_KM') return ind.scope ? `Tarifa favorita: ${ind.scope}.` : 'No hay ninguna tarifa marcada como favorita.';
        const where = ind.scope === 'SANTA FE' ? 'Provincia de Santa Fe' : 'Rosario';
        return `${where}, mediana de ${ind.samples ?? '?'} estaciones (horario diurno).`;
    }

    pct(v: number | null | undefined): string {
        if (v === null || v === undefined) return '—';
        return `${v > 0 ? '+' : ''}${v.toLocaleString('es-AR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
    }
}

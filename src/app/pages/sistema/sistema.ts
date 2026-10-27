import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '../../../environments/environment';

// Colores del gráfico de pedidos, validados para daltonismo y contraste en
// modo claro y oscuro (guía de visualización): azul = bien, rojo = con error.
const CHART_COLORS = {
    light: { ok: '#3B82F6', error: '#DC2626' },
    dark: { ok: '#3B82F6', error: '#EF4444' }
};

type Level = 'good' | 'warning' | 'critical';

@Component({
    selector: 'app-sistema',
    standalone: true,
    imports: [CommonModule, ChartModule, TableModule, TagModule, ButtonModule, TooltipModule],
    template: `
        <div class="flex flex-col gap-6">
            <div class="card flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div class="font-semibold text-xl">Estado del sistema</div>
                    <div class="text-sm text-muted-color" *ngIf="status">
                        Versión {{ status.version }} · {{ status.environment }} · arriba hace {{ duration(status.server.uptimeSeconds) }} · actualizado {{ status.checkedAt | date: 'HH:mm:ss' }}
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <p-tag *ngIf="status" [value]="status.database.ok ? 'Base de datos OK' : 'Base de datos sin respuesta'" [severity]="status.database.ok ? 'success' : 'danger'" [icon]="status.database.ok ? 'pi pi-check' : 'pi pi-times'" />
                    <p-tag *ngIf="status" [value]="status.sentryEnabled ? 'Sentry activo' : 'Sentry sin configurar'" [severity]="status.sentryEnabled ? 'success' : 'warn'" [icon]="status.sentryEnabled ? 'pi pi-check' : 'pi pi-exclamation-triangle'" />
                    <p-tag *ngIf="status" [value]="status.assistantConfigured ? 'Asistente configurado' : 'Asistente sin clave'" [severity]="status.assistantConfigured ? 'success' : 'warn'" [icon]="status.assistantConfigured ? 'pi pi-check' : 'pi pi-exclamation-triangle'" />
                    <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" (click)="load()" [loading]="loading" pTooltip="Actualizar" />
                </div>
            </div>

            <div *ngIf="error" class="card text-red-600">{{ error }}</div>

            <ng-container *ngIf="status">
                <!-- Indicadores principales -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 sm:col-span-6 lg:col-span-3 card mb-0">
                        <div class="text-muted-color text-sm mb-1">Pedidos (24 h)</div>
                        <div class="text-3xl font-bold">{{ status.api.requests | number: '1.0-0' }}</div>
                        <div class="text-xs text-muted-color mt-1">desde el último reinicio, si fue hace menos</div>
                    </div>
                    <div class="col-span-12 sm:col-span-6 lg:col-span-3 card mb-0">
                        <div class="text-muted-color text-sm mb-1">Errores del servidor (24 h)</div>
                        <div class="text-3xl font-bold">{{ status.api.errors | number: '1.0-0' }}</div>
                        <div class="text-xs mt-1" [ngClass]="levelText(errorLevel())">
                            <i class="pi" [ngClass]="levelIcon(errorLevel())"></i> {{ errorRate() }} de los pedidos
                        </div>
                    </div>
                    <div class="col-span-12 sm:col-span-6 lg:col-span-3 card mb-0">
                        <div class="text-muted-color text-sm mb-1">Tiempo de respuesta</div>
                        <div class="text-3xl font-bold">{{ status.api.p50 }} ms</div>
                        <div class="text-xs text-muted-color mt-1">mediana · el 95% en menos de {{ status.api.p95 }} ms</div>
                    </div>
                    <div class="col-span-12 sm:col-span-6 lg:col-span-3 card mb-0">
                        <div class="text-muted-color text-sm mb-1">Asistente de IA (mes)</div>
                        <div class="text-3xl font-bold">US$ {{ status.assistant.costMonthUsd | number: '1.2-2' }}</div>
                        <div class="text-xs text-muted-color mt-1">{{ status.assistant.queriesMonth }} consultas · {{ status.assistant.queriesToday }} hoy</div>
                    </div>
                </div>

                <!-- Pedidos por hora -->
                <div class="card">
                    <div class="font-semibold mb-1">Pedidos por hora, últimas 24 horas</div>
                    <div class="text-xs text-muted-color mb-3">En rojo, los que terminaron en error del servidor.</div>
                    <div class="h-64">
                        <p-chart type="bar" [data]="chartData" [options]="chartOptions" height="100%"></p-chart>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <!-- Servidor -->
                    <div class="col-span-12 lg:col-span-6 card mb-0">
                        <div class="font-semibold mb-4">Servidor</div>
                        <div *ngFor="let m of serverMeters()" class="mb-4">
                            <div class="flex justify-between text-sm mb-1">
                                <span>{{ m.label }}</span>
                                <span [ngClass]="levelText(m.level)"><i class="pi" [ngClass]="levelIcon(m.level)"></i> {{ m.text }}</span>
                            </div>
                            <div class="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                                <div class="h-full rounded-full" [ngClass]="levelBar(m.level)" [style.width.%]="m.percent"></div>
                            </div>
                        </div>
                        <div class="text-xs text-muted-color">
                            {{ status.server.cpus }} procesadores · el backend usa {{ bytes(status.server.processMemoryBytes) }} de memoria.
                            Los gráficos históricos del servidor y de cada contenedor están en el panel de Coolify (Servidor › Métricas).
                        </div>
                    </div>

                    <!-- Base de datos -->
                    <div class="col-span-12 lg:col-span-6 card mb-0">
                        <div class="font-semibold mb-4">Base de datos</div>
                        <div *ngIf="!status.database.ok" class="text-red-600 text-sm">{{ status.database.error }}</div>
                        <div *ngIf="status.database.ok" class="grid grid-cols-3 gap-4">
                            <div>
                                <div class="text-muted-color text-sm">Respuesta</div>
                                <div class="text-2xl font-bold">{{ status.database.latencyMs }} ms</div>
                            </div>
                            <div>
                                <div class="text-muted-color text-sm">Tamaño</div>
                                <div class="text-2xl font-bold">{{ bytes(status.database.sizeBytes) }}</div>
                            </div>
                            <div>
                                <div class="text-muted-color text-sm">Conexiones</div>
                                <div class="text-2xl font-bold">{{ status.database.connections }}</div>
                            </div>
                        </div>

                        <div class="font-semibold mt-6 mb-2">Pedidos más lentos</div>
                        <div *ngIf="!status.api.slowest.length" class="text-sm text-muted-color">Todavía no hay suficientes pedidos para medir.</div>
                        <p-table *ngIf="status.api.slowest.length" [value]="status.api.slowest" styleClass="p-datatable-sm text-sm">
                            <ng-template pTemplate="header">
                                <tr><th>Pedido</th><th class="text-right">Veces</th><th class="text-right">95% en menos de</th></tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-r>
                                <tr><td class="font-mono text-xs">{{ r.route }}</td><td class="text-right">{{ r.count }}</td><td class="text-right">{{ r.p95 }} ms</td></tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>

                <!-- Errores de Sentry -->
                <div class="card">
                    <div class="font-semibold mb-1">Errores abiertos (Sentry, últimas 24 horas)</div>
                    <div *ngIf="!status.sentry.configured" class="text-sm text-muted-color">
                        Para ver acá los errores, cargá en el backend las variables SENTRY_AUTH_TOKEN, SENTRY_ORG y SENTRY_PROJECTS.
                    </div>
                    <div *ngFor="let e of status.sentry.errors || []" class="text-sm text-red-600">No se pudo leer {{ e }}</div>
                    <div *ngIf="status.sentry.configured && !status.sentry.issues.length" class="text-sm text-green-700 dark:text-green-400"><i class="pi pi-check"></i> Sin errores abiertos.</div>
                    <p-table *ngIf="status.sentry.issues.length" [value]="status.sentry.issues" styleClass="p-datatable-sm text-sm mt-2">
                        <ng-template pTemplate="header">
                            <tr><th>Error</th><th>Dónde</th><th class="text-right">Veces</th><th class="text-right">Usuarios</th><th>Último</th><th></th></tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-i>
                            <tr>
                                <td>
                                    <p-tag [value]="i.project" severity="secondary" styleClass="text-xs mr-2" />
                                    {{ i.title }}
                                </td>
                                <td class="text-xs text-muted-color">{{ i.where }}</td>
                                <td class="text-right">{{ i.count }}</td>
                                <td class="text-right">{{ i.users }}</td>
                                <td class="whitespace-nowrap">{{ i.lastSeen | date: 'dd/MM HH:mm' }}</td>
                                <td><a [href]="i.link" target="_blank" rel="noopener" class="text-primary">Ver</a></td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </ng-container>
        </div>
    `
})
export class Sistema implements OnInit, OnDestroy {
    status: any = null;
    loading = false;
    error = '';
    chartData: any = null;
    chartOptions: any = null;
    private timer?: ReturnType<typeof setInterval>;

    constructor(private http: HttpClient) {}

    ngOnInit() {
        this.load();
        this.timer = setInterval(() => this.load(), 60_000);
    }

    ngOnDestroy() {
        if (this.timer) clearInterval(this.timer);
    }

    async load() {
        this.loading = true;
        try {
            this.status = await firstValueFrom(this.http.get<any>(`${environment.apiUrl}system/status`));
            this.error = '';
            this.buildChart();
        } catch {
            this.error = 'No se pudo obtener el estado del sistema.';
        } finally {
            this.loading = false;
        }
    }

    private buildChart() {
        const dark = document.documentElement.classList.contains('app-dark');
        const colors = dark ? CHART_COLORS.dark : CHART_COLORS.light;
        const style = getComputedStyle(document.documentElement);
        const text = style.getPropertyValue('--p-text-muted-color').trim() || '#6b7280';
        const grid = style.getPropertyValue('--p-content-border-color').trim() || '#e5e7eb';
        const hours: any[] = this.status.api.hours;
        this.chartData = {
            labels: hours.map((h) => new Date(h.hour).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })),
            datasets: [
                { label: 'Correctos', data: hours.map((h) => h.requests - h.errors), backgroundColor: colors.ok, borderRadius: 4, maxBarThickness: 18 },
                { label: 'Con error', data: hours.map((h) => h.errors), backgroundColor: colors.error, borderRadius: 4, maxBarThickness: 18 }
            ]
        };
        this.chartOptions = {
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top', align: 'end', labels: { color: text, boxWidth: 12 } } },
            scales: {
                x: { stacked: true, ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { display: false } },
                y: { stacked: true, beginAtZero: true, ticks: { color: text, precision: 0 }, grid: { color: grid } }
            }
        };
    }

    errorLevel(): Level {
        const { requests, errors } = this.status.api;
        const rate = requests ? errors / requests : 0;
        return rate < 0.01 ? 'good' : rate < 0.05 ? 'warning' : 'critical';
    }

    errorRate(): string {
        const { requests, errors } = this.status.api;
        return requests ? `${((errors / requests) * 100).toFixed(1)}%` : '0%';
    }

    serverMeters(): Array<{ label: string; percent: number; text: string; level: Level }> {
        const s = this.status.server;
        const level = (p: number): Level => (p < 70 ? 'good' : p < 90 ? 'warning' : 'critical');
        const meters = [];
        const cpu = Math.min(100, (s.load.m5 / s.cpus) * 100);
        meters.push({ label: 'Uso de CPU (promedio 5 min)', percent: cpu, text: `${cpu.toFixed(0)}%`, level: level(cpu) });
        const mem = ((s.memory.totalBytes - s.memory.freeBytes) / s.memory.totalBytes) * 100;
        meters.push({ label: 'Memoria', percent: mem, text: `${this.bytes(s.memory.totalBytes - s.memory.freeBytes)} de ${this.bytes(s.memory.totalBytes)}`, level: level(mem) });
        if (s.disk) {
            const disk = ((s.disk.totalBytes - s.disk.freeBytes) / s.disk.totalBytes) * 100;
            meters.push({ label: 'Disco', percent: disk, text: `${this.bytes(s.disk.freeBytes)} libres de ${this.bytes(s.disk.totalBytes)}`, level: level(disk) });
        }
        return meters;
    }

    levelText(l: Level) {
        return { good: 'text-green-700 dark:text-green-400', warning: 'text-orange-600 dark:text-orange-400', critical: 'text-red-600 dark:text-red-400' }[l];
    }

    levelIcon(l: Level) {
        return { good: 'pi-check-circle', warning: 'pi-exclamation-triangle', critical: 'pi-times-circle' }[l];
    }

    levelBar(l: Level) {
        return { good: 'bg-green-600', warning: 'bg-orange-500', critical: 'bg-red-600' }[l];
    }

    bytes(n: number): string {
        if (!n) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
        return `${(n / Math.pow(1024, i)).toFixed(i >= 3 ? 1 : 0)} ${units[i]}`;
    }

    duration(seconds: number): string {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
    }
}

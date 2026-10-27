import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { environment } from '../../../environments/environment';

// Colores del gráfico de pedidos, validados para daltonismo y contraste en
// modo claro y oscuro (guía de visualización): azul = bien, rojo = con error.
const CHART_COLORS = {
    light: { ok: '#3B82F6', error: '#DC2626' },
    dark: { ok: '#3B82F6', error: '#EF4444' }
};

// CPU, memoria y disco: tres colores validados entre sí para daltonismo, en
// orden fijo. El verde claro queda con poco contraste sobre fondo blanco, por
// eso cada línea lleva además su propio tipo de punto y la leyenda.
const USAGE_COLORS = {
    light: ['#2a78d6', '#eb6834', '#1baf7a'],
    dark: ['#3987e5', '#d95926', '#199e70']
};

type Level = 'good' | 'warning' | 'critical';

@Component({
    selector: 'app-sistema',
    standalone: true,
    imports: [CommonModule, FormsModule, ChartModule, TableModule, TagModule, ButtonModule, TooltipModule, InputTextModule, SelectModule, SelectButtonModule, CheckboxModule],
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
                    <p-tag *ngIf="status" [value]="backupTagText()" [severity]="tagSeverity(status.backups.level)" [icon]="'pi ' + levelIcon(status.backups.level)" />
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

                <!-- Historial: 24 h en vivo, o lo guardado hora por hora (7 días) y
                     día por día (30 y 90 días). Un gráfico por medida, cada uno con
                     su propio eje. -->
                <div class="card">
                    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div class="font-semibold">Historial</div>
                        <p-selectbutton [options]="rangeOptions" [(ngModel)]="range" (onChange)="loadHistory()" optionLabel="label" optionValue="value" size="small" [allowEmpty]="false" />
                    </div>
                    <div *ngIf="historyEmpty()" class="text-sm text-muted-color mb-3">
                        Todavía no hay historial guardado para este período: se guarda una vez por hora desde la versión 2.2.0.
                    </div>
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12">
                            <div class="text-sm font-medium mb-1">Pedidos {{ range === '24h' ? 'por hora' : granularity === 'day' ? 'por día' : 'por hora' }}</div>
                            <div class="text-xs text-muted-color mb-2">En rojo, los que terminaron en error del servidor.</div>
                            <div class="h-64"><p-chart type="bar" [data]="requestsChart" [options]="requestsOptions" height="100%"></p-chart></div>
                        </div>
                        <div class="col-span-12 lg:col-span-6">
                            <div class="text-sm font-medium mb-1">Tiempo de respuesta</div>
                            <div class="text-xs text-muted-color mb-2">El 95% de los pedidos tardó menos que esto (ms){{ granularity === 'day' && range !== '24h' ? ', peor hora del día' : '' }}.</div>
                            <div class="h-56"><p-chart type="line" [data]="latencyChart" [options]="latencyOptions" height="100%"></p-chart></div>
                        </div>
                        <div class="col-span-12 lg:col-span-6">
                            <div class="text-sm font-medium mb-1">Uso del servidor (%)</div>
                            <div class="text-xs text-muted-color mb-2">CPU y memoria{{ granularity === 'day' && range !== '24h' ? ' en promedio del día, disco el máximo' : '' }}. Se guarda una vez por hora.</div>
                            <div class="h-56"><p-chart type="line" [data]="usageChart" [options]="usageOptions" height="100%"></p-chart></div>
                        </div>
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

                <!-- Respaldos: los informa el script de backup del servidor al terminar. -->
                <div class="card">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div class="font-semibold">Respaldos de la base de datos</div>
                        <p-tag *ngIf="status.backups.recent.length" [value]="backupTagText()" [severity]="tagSeverity(status.backups.level)" [icon]="'pi ' + levelIcon(status.backups.level)" />
                    </div>
                    <div *ngIf="!status.backups.configured && !status.backups.recent.length" class="text-sm text-muted-color">
                        Sin configurar. Cargá BACKUP_REPORT_TOKEN en el backend y agregá al script de respaldo del servidor el aviso a /api/backups/report.
                    </div>
                    <div *ngIf="status.backups.configured && !status.backups.recent.length" class="text-sm" [ngClass]="levelText('warning')">
                        <i class="pi pi-exclamation-triangle"></i> Todavía no llegó ningún aviso del script de respaldo.
                    </div>
                    <ng-container *ngIf="status.backups.recent.length">
                        <div class="grid grid-cols-12 gap-4 mb-4">
                            <div class="col-span-12 sm:col-span-4">
                                <div class="text-muted-color text-sm">Último respaldo bueno</div>
                                <div class="text-2xl font-bold">{{ status.backups.lastOk ? (status.backups.lastOk.at | date: 'dd/MM HH:mm') : 'Nunca' }}</div>
                                <div class="text-xs mt-1" [ngClass]="levelText(status.backups.level)" *ngIf="status.backups.hoursSinceOk !== null">hace {{ hoursAgo(status.backups.hoursSinceOk) }}</div>
                            </div>
                            <div class="col-span-12 sm:col-span-4" *ngIf="status.backups.lastOk">
                                <div class="text-muted-color text-sm">Tamaño</div>
                                <div class="text-2xl font-bold">{{ bytes(status.backups.lastOk.sizeBytes) }}</div>
                                <div class="text-xs text-muted-color mt-1">{{ sizeTrend() }}</div>
                            </div>
                            <div class="col-span-12 sm:col-span-4" *ngIf="status.backups.lastOk?.file">
                                <div class="text-muted-color text-sm">Archivo</div>
                                <div class="font-mono text-xs break-all mt-1">{{ status.backups.lastOk.file }}</div>
                            </div>
                        </div>
                        <p-table [value]="status.backups.recent" styleClass="p-datatable-sm text-sm">
                            <ng-template pTemplate="header">
                                <tr><th>Fecha</th><th>Resultado</th><th class="text-right">Tamaño</th><th>Detalle</th></tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-r>
                                <tr>
                                    <td class="whitespace-nowrap">{{ r.at | date: 'dd/MM/yy HH:mm' }}</td>
                                    <td><span [ngClass]="levelText(r.ok ? 'good' : 'critical')"><i class="pi" [ngClass]="levelIcon(r.ok ? 'good' : 'critical')"></i> {{ r.ok ? 'Bien' : 'Falló' }}</span></td>
                                    <td class="text-right whitespace-nowrap">{{ r.sizeBytes ? bytes(r.sizeBytes) : '—' }}</td>
                                    <td class="text-xs text-muted-color">{{ r.message || r.file }}</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </ng-container>
                </div>

                <!-- Copia a Google Calendar: se sincroniza tras cada cambio y cada 10 minutos. -->
                <div class="card" *ngIf="status.googleCalendar">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div class="font-semibold">Google Calendar</div>
                        <p-tag *ngIf="status.googleCalendar.enabled && status.googleCalendar.last" [value]="status.googleCalendar.last.ok ? 'Sincronizado' : 'Con error'" [severity]="status.googleCalendar.last.ok ? 'success' : 'danger'" />
                    </div>
                    <div *ngIf="!status.googleCalendar.enabled" class="text-sm text-muted-color">
                        Desactivado. Para activarlo hay que cargar GOOGLE_SERVICE_ACCOUNT_JSON y los tres GOOGLE_CALENDAR_*_ID en el backend.
                    </div>
                    <div *ngIf="status.googleCalendar.enabled && !status.googleCalendar.last" class="text-sm text-muted-color">Todavía no terminó la primera sincronización.</div>
                    <div *ngIf="status.googleCalendar.last as g" class="text-sm">
                        Última: {{ g.at | date: 'dd/MM HH:mm' }}
                        <span *ngIf="g.ok" class="text-muted-color"> · {{ g.created }} nuevos, {{ g.updated }} actualizados, {{ g.deleted }} borrados</span>
                        <div *ngIf="!g.ok" class="mt-1 font-mono text-xs break-all" [ngClass]="levelText('critical')">{{ g.error }}</div>
                    </div>
                </div>

                <!-- Seguridad: intentos de ingreso, bloqueos y accesos desde lugares nuevos. -->
                <div class="card">
                    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div class="font-semibold">Seguridad: ingresos al sistema</div>
                        <p-selectbutton [options]="securityRangeOptions" [(ngModel)]="securityDays" (onChange)="loadSecurity()" optionLabel="label" optionValue="value" size="small" [allowEmpty]="false" />
                    </div>
                    <div *ngIf="securityError" class="text-sm text-red-600">{{ securityError }}</div>
                    <ng-container *ngIf="security">
                        <div class="grid grid-cols-12 gap-4 mb-4">
                            <div class="col-span-6 lg:col-span-3">
                                <div class="text-muted-color text-sm">Ingresos correctos</div>
                                <div class="text-2xl font-bold">{{ security.totals.ok | number: '1.0-0' }}</div>
                            </div>
                            <div class="col-span-6 lg:col-span-3">
                                <div class="text-muted-color text-sm">Intentos fallidos</div>
                                <div class="text-2xl font-bold">{{ security.totals.failed | number: '1.0-0' }}</div>
                                <div class="text-xs mt-1" [ngClass]="levelText(failedLevel())"><i class="pi" [ngClass]="levelIcon(failedLevel())"></i> {{ failedRate() }} de los intentos</div>
                            </div>
                            <div class="col-span-6 lg:col-span-3">
                                <div class="text-muted-color text-sm">Usuarios bloqueados</div>
                                <div class="text-2xl font-bold">{{ security.blockedUsers.length }}</div>
                            </div>
                            <div class="col-span-6 lg:col-span-3">
                                <div class="text-muted-color text-sm">Ingresos desde un lugar nuevo</div>
                                <div class="text-2xl font-bold">{{ security.newLocations.length }}</div>
                            </div>
                        </div>

                        <div class="flex flex-wrap gap-2 mb-4" *ngIf="security.totals.byReason.length">
                            <p-tag *ngFor="let r of security.totals.byReason" [value]="r.label + ': ' + r.count" [severity]="r.reason === 'ok' ? 'success' : r.reason === 'locked_now' || r.reason === 'blocked' ? 'danger' : 'secondary'" />
                        </div>

                        <div class="grid grid-cols-12 gap-6 mb-4">
                            <div class="col-span-12 lg:col-span-6">
                                <div class="text-sm font-medium mb-2">IPs con más intentos fallidos</div>
                                <div *ngIf="!security.topIps.length" class="text-sm text-muted-color">Ninguno en este período.</div>
                                <p-table *ngIf="security.topIps.length" [value]="security.topIps" styleClass="p-datatable-sm text-sm">
                                    <ng-template pTemplate="header"><tr><th>IP</th><th class="text-right">Fallos</th><th>Cuentas probadas</th><th>Último</th></tr></ng-template>
                                    <ng-template pTemplate="body" let-g>
                                        <tr>
                                            <td class="font-mono text-xs">{{ g.key }}</td>
                                            <td class="text-right">{{ g.count }}</td>
                                            <td class="text-xs" [pTooltip]="g.emails.join(', ')">{{ g.distinctEmails }}</td>
                                            <td class="whitespace-nowrap">{{ g.last | date: 'dd/MM HH:mm' }}</td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </div>
                            <div class="col-span-12 lg:col-span-6">
                                <div class="text-sm font-medium mb-2">Cuentas con más intentos fallidos</div>
                                <div *ngIf="!security.topEmails.length" class="text-sm text-muted-color">Ninguna en este período.</div>
                                <p-table *ngIf="security.topEmails.length" [value]="security.topEmails" styleClass="p-datatable-sm text-sm">
                                    <ng-template pTemplate="header"><tr><th>Email</th><th class="text-right">Fallos</th><th>Último</th></tr></ng-template>
                                    <ng-template pTemplate="body" let-g>
                                        <tr><td class="text-xs break-all">{{ g.key }}</td><td class="text-right">{{ g.count }}</td><td class="whitespace-nowrap">{{ g.last | date: 'dd/MM HH:mm' }}</td></tr>
                                    </ng-template>
                                </p-table>
                            </div>
                            <div class="col-span-12 lg:col-span-6" *ngIf="security.blockedUsers.length">
                                <div class="text-sm font-medium mb-2">Usuarios bloqueados</div>
                                <div *ngFor="let u of security.blockedUsers" class="text-sm py-1">
                                    <i class="pi pi-lock text-red-600 mr-1"></i>{{ u.name || u.email }} <span class="text-xs text-muted-color">· {{ u.email }}</span>
                                </div>
                                <div class="text-xs text-muted-color mt-1">Se desbloquean desde Usuarios.</div>
                            </div>
                            <div class="col-span-12 lg:col-span-6" *ngIf="security.newLocations.length">
                                <div class="text-sm font-medium mb-2">Ingresos desde un lugar nuevo</div>
                                <div class="text-xs text-muted-color mb-2">Desde una IP que ese usuario no usó en los 90 días anteriores. Puede ser normal (otra red, el celular); conviene revisar si no lo reconocen.</div>
                                <div *ngFor="let l of security.newLocations" class="text-sm py-1">
                                    {{ l.user }} <span class="font-mono text-xs">{{ l.ip }}</span> <span class="text-xs text-muted-color">· {{ l.at | date: 'dd/MM HH:mm' }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div class="text-sm font-medium">Últimos intentos</div>
                            <div class="flex flex-wrap items-center gap-3">
                                <label class="flex items-center gap-2 text-sm"><p-checkbox [(ngModel)]="onlyFailed" [binary]="true" /> Sólo fallidos</label>
                                <input pInputText type="text" class="min-w-48" placeholder="Buscar email o IP…" [(ngModel)]="eventSearch" />
                            </div>
                        </div>
                        <p-table [value]="filteredEvents()" [paginator]="true" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" styleClass="p-datatable-sm text-sm">
                            <ng-template pTemplate="header">
                                <tr><th>Fecha</th><th>Usuario</th><th>Resultado</th><th>IP</th><th>Navegador</th></tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-e>
                                <tr>
                                    <td class="whitespace-nowrap">{{ e.at | date: 'dd/MM HH:mm:ss' }}</td>
                                    <td class="text-xs">{{ e.user || e.email }}<div *ngIf="e.user" class="text-muted-color">{{ e.email }}</div></td>
                                    <td><span [ngClass]="levelText(e.success ? 'good' : 'critical')"><i class="pi" [ngClass]="levelIcon(e.success ? 'good' : 'critical')"></i> {{ e.reason }}</span></td>
                                    <td class="font-mono text-xs">{{ e.ip }}</td>
                                    <td class="text-xs text-muted-color max-w-[16rem] truncate" [pTooltip]="e.userAgent">{{ browser(e.userAgent) }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr><td colspan="5" class="text-center text-muted-color">No hay intentos de ingreso que coincidan.</td></tr>
                            </ng-template>
                        </p-table>
                    </ng-container>
                </div>

                <!-- Errores de Sentry: paginados, ordenables y filtrables, para que
                     sigan siendo legibles aunque haya muchos. -->
                <div class="card">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                            <div class="font-semibold">Errores abiertos (Sentry, últimas 24 horas)</div>
                            <div *ngIf="status.sentry.configured" class="text-xs text-muted-color">{{ status.sentry.issues.length }} errores · {{ totalOccurrences() | number: '1.0-0' }} veces en total</div>
                        </div>
                        <a *ngIf="status.sentry.issuesUrl" [href]="status.sentry.issuesUrl" target="_blank" rel="noopener" class="text-sm text-primary"><i class="pi pi-external-link mr-1"></i>Ver todo en Sentry</a>
                    </div>
                    <div *ngIf="!status.sentry.configured" class="text-sm text-muted-color">
                        Para ver acá los errores, cargá en el backend las variables SENTRY_AUTH_TOKEN, SENTRY_ORG y SENTRY_PROJECTS.
                    </div>
                    <div *ngFor="let e of status.sentry.errors || []" class="text-sm text-red-600">No se pudo leer {{ e }}</div>
                    <div *ngIf="status.sentry.configured && !status.sentry.issues.length" class="text-sm text-green-700 dark:text-green-400"><i class="pi pi-check"></i> Sin errores abiertos.</div>

                    <ng-container *ngIf="status.sentry.issues.length">
                        <div class="flex flex-wrap gap-2 mb-3">
                            <input pInputText type="text" class="flex-1 min-w-48" placeholder="Buscar en los errores…" [(ngModel)]="issueSearch" />
                            <p-select [options]="projectOptions()" [(ngModel)]="issueProject" placeholder="Todos los proyectos" [showClear]="true" styleClass="min-w-48" />
                            <p-select [options]="levelOptions()" [(ngModel)]="issueLevel" placeholder="Todos los niveles" [showClear]="true" styleClass="min-w-40" />
                        </div>
                        <p-table [value]="filteredIssues()" [paginator]="true" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" sortField="lastSeen" [sortOrder]="-1" styleClass="p-datatable-sm text-sm">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Error</th>
                                    <th pSortableColumn="count" class="text-right whitespace-nowrap">Veces <p-sortIcon field="count" /></th>
                                    <th pSortableColumn="users" class="text-right whitespace-nowrap">Usuarios <p-sortIcon field="users" /></th>
                                    <th pSortableColumn="lastSeen" class="whitespace-nowrap">Último <p-sortIcon field="lastSeen" /></th>
                                    <th></th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-i>
                                <tr>
                                    <td class="max-w-[36rem]">
                                        <div class="flex items-center gap-2">
                                            <p-tag [value]="i.project" severity="secondary" styleClass="text-xs shrink-0" />
                                            <p-tag *ngIf="i.level !== 'error'" [value]="i.level" [severity]="i.level === 'fatal' ? 'danger' : 'warn'" styleClass="text-xs shrink-0" />
                                            <span class="truncate" [pTooltip]="i.title">{{ i.title }}</span>
                                        </div>
                                        <div class="text-xs text-muted-color truncate" [pTooltip]="i.where">{{ i.where }}</div>
                                    </td>
                                    <td class="text-right">{{ i.count | number: '1.0-0' }}</td>
                                    <td class="text-right">{{ i.users }}</td>
                                    <td class="whitespace-nowrap">{{ i.lastSeen | date: 'dd/MM HH:mm' }}</td>
                                    <td><a [href]="i.link" target="_blank" rel="noopener" class="text-primary">Ver</a></td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr><td colspan="5" class="text-center text-muted-color">Ningún error coincide con los filtros.</td></tr>
                            </ng-template>
                        </p-table>
                    </ng-container>
                </div>
            </ng-container>
        </div>
    `
})
export class Sistema implements OnInit, OnDestroy {
    status: any = null;
    loading = false;
    error = '';
    private timer?: ReturnType<typeof setInterval>;

    // Historial
    rangeOptions = [
        { label: '24 horas', value: '24h' },
        { label: '7 días', value: '7' },
        { label: '30 días', value: '30' },
        { label: '90 días', value: '90' }
    ];
    range = '24h';
    granularity: 'hour' | 'day' = 'hour';
    private history: any[] = [];
    requestsChart: any = null;
    requestsOptions: any = null;
    latencyChart: any = null;
    latencyOptions: any = null;
    usageChart: any = null;
    usageOptions: any = null;

    // Seguridad
    securityRangeOptions = [
        { label: 'Hoy', value: 1 },
        { label: '7 días', value: 7 },
        { label: '30 días', value: 30 }
    ];
    securityDays = 7;
    security: any = null;
    securityError = '';
    onlyFailed = false;
    eventSearch = '';

    issueSearch = '';
    issueProject: string | null = null;
    issueLevel: string | null = null;

    filteredIssues(): any[] {
        const q = this.issueSearch.trim().toLowerCase();
        return (this.status?.sentry?.issues ?? []).filter(
            (i: any) =>
                (!this.issueProject || i.project === this.issueProject) &&
                (!this.issueLevel || i.level === this.issueLevel) &&
                (!q || `${i.title} ${i.where}`.toLowerCase().includes(q))
        );
    }

    projectOptions() {
        return [...new Set<string>((this.status?.sentry?.issues ?? []).map((i: any) => i.project))].map((p) => ({ label: p, value: p }));
    }

    levelOptions() {
        return [...new Set<string>((this.status?.sentry?.issues ?? []).map((i: any) => i.level))].map((l) => ({ label: l, value: l }));
    }

    totalOccurrences(): number {
        return (this.status?.sentry?.issues ?? []).reduce((sum: number, i: any) => sum + (i.count || 0), 0);
    }

    constructor(private http: HttpClient) {}

    ngOnInit() {
        this.load();
        this.loadHistory();
        this.loadSecurity();
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
            if (this.range === '24h') this.buildCharts();
        } catch {
            this.error = 'No se pudo obtener el estado del sistema.';
        } finally {
            this.loading = false;
        }
    }

    async loadHistory() {
        try {
            const days = this.range === '24h' ? 1 : Number(this.range);
            const res = await firstValueFrom(this.http.get<any>(`${environment.apiUrl}system/history?days=${days}`));
            this.history = res.points;
            this.granularity = res.granularity;
        } catch {
            this.history = [];
        }
        this.buildCharts();
    }

    async loadSecurity() {
        try {
            this.security = await firstValueFrom(this.http.get<any>(`${environment.apiUrl}system/security?days=${this.securityDays}`));
            this.securityError = '';
        } catch {
            this.securityError = 'No se pudieron leer los ingresos.';
        }
    }

    historyEmpty(): boolean {
        return this.range !== '24h' && !this.history.length;
    }

    private label(at: string): string {
        if (this.granularity === 'day') {
            const [y, m, d] = at.split('-').map(Number);
            return new Date(y!, m! - 1, d!).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        }
        const date = new Date(at);
        const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        return this.range === '24h' ? time : `${date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${time}`;
    }

    private buildCharts() {
        if (!this.status) return;
        const dark = document.documentElement.classList.contains('app-dark');
        const colors = dark ? CHART_COLORS.dark : CHART_COLORS.light;
        const usageColors = dark ? USAGE_COLORS.dark : USAGE_COLORS.light;
        const style = getComputedStyle(document.documentElement);
        const text = style.getPropertyValue('--p-text-muted-color').trim() || '#6b7280';
        const grid = style.getPropertyValue('--p-content-border-color').trim() || '#e5e7eb';

        // Pedidos y tiempos de las últimas 24 h salen en vivo de la memoria del
        // servidor; el uso del servidor, siempre de lo guardado.
        const live = this.range === '24h';
        const rows: Array<{ label: string; requests: number; errors: number; p95: number }> = live
            ? this.status.api.hours.map((h: any) => ({ label: new Date(h.hour).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), requests: h.requests, errors: h.errors, p95: h.p95 }))
            : this.history.map((p) => ({ label: this.label(p.at), requests: p.requests, errors: p.errors, p95: p.p95Ms }));
        const x = { ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { display: false } };
        const base = { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } };

        this.requestsChart = {
            labels: rows.map((r) => r.label),
            datasets: [
                { label: 'Correctos', data: rows.map((r) => r.requests - r.errors), backgroundColor: colors.ok, borderRadius: 4, maxBarThickness: 18 },
                { label: 'Con error', data: rows.map((r) => r.errors), backgroundColor: colors.error, borderRadius: 4, maxBarThickness: 18 }
            ]
        };
        this.requestsOptions = {
            ...base,
            plugins: { legend: { position: 'top', align: 'end', labels: { color: text, boxWidth: 12 } } },
            scales: { x: { ...x, stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { color: text, precision: 0 }, grid: { color: grid } } }
        };

        this.latencyChart = {
            labels: rows.map((r) => r.label),
            datasets: [{ label: '95% en menos de (ms)', data: rows.map((r) => r.p95 || null), borderColor: colors.ok, backgroundColor: colors.ok, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.3, spanGaps: true }]
        };
        this.latencyOptions = {
            ...base,
            plugins: { legend: { display: false } },
            scales: { x, y: { beginAtZero: true, ticks: { color: text, callback: (v: number) => `${v} ms` }, grid: { color: grid } } }
        };

        const usage = this.history;
        const series: Array<[string, string, string]> = [
            ['CPU', 'cpuPercent', 'circle'],
            ['Memoria', 'memoryPercent', 'rect'],
            ['Disco', 'diskPercent', 'triangle']
        ];
        this.usageChart = {
            labels: usage.map((p) => this.label(p.at)),
            datasets: series.map(([label, key, pointStyle], i) => ({
                label,
                data: usage.map((p) => (p[key] === null ? null : Math.round(p[key]))),
                borderColor: usageColors[i],
                backgroundColor: usageColors[i],
                borderWidth: 2,
                pointStyle,
                pointRadius: usage.length > 48 ? 0 : 3,
                pointHoverRadius: 5,
                tension: 0.3,
                spanGaps: true
            }))
        };
        this.usageOptions = {
            ...base,
            plugins: {
                legend: { position: 'top', align: 'end', labels: { color: text, usePointStyle: true, boxWidth: 8 } },
                tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${c.parsed.y}%` } }
            },
            scales: { x, y: { min: 0, max: 100, ticks: { color: text, stepSize: 25, callback: (v: number) => `${v}%` }, grid: { color: grid } } }
        };
    }

    backupTagText(): string {
        const b = this.status.backups;
        if (!b.configured && !b.recent.length) return 'Respaldo sin configurar';
        if (!b.lastOk) return 'Sin respaldos buenos';
        return b.level === 'good' ? 'Respaldo al día' : 'Respaldo atrasado';
    }

    tagSeverity(l: Level) {
        return ({ good: 'success', warning: 'warn', critical: 'danger' } as const)[l];
    }

    hoursAgo(h: number): string {
        return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} días`;
    }

    // Compara con el respaldo bueno anterior: si de golpe es mucho más chico,
    // probablemente salió incompleto.
    sizeTrend(): string {
        const ok = this.status.backups.recent.filter((r: any) => r.ok && r.sizeBytes);
        if (ok.length < 2) return '';
        const diff = (ok[0].sizeBytes - ok[1].sizeBytes) / ok[1].sizeBytes;
        if (diff < -0.2) return `⚠ ${Math.round(-diff * 100)}% más chico que el anterior`;
        return `${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)}% respecto del anterior`;
    }

    failedLevel(): Level {
        const { ok, failed } = this.security.totals;
        const rate = ok + failed ? failed / (ok + failed) : 0;
        return rate < 0.2 ? 'good' : rate < 0.5 ? 'warning' : 'critical';
    }

    failedRate(): string {
        const { ok, failed } = this.security.totals;
        return ok + failed ? `${((failed / (ok + failed)) * 100).toFixed(0)}%` : '0%';
    }

    filteredEvents(): any[] {
        const q = this.eventSearch.trim().toLowerCase();
        return (this.security?.recent ?? []).filter((e: any) => (!this.onlyFailed || !e.success) && (!q || `${e.email} ${e.user ?? ''} ${e.ip ?? ''}`.toLowerCase().includes(q)));
    }

    browser(ua: string | null): string {
        if (!ua) return '—';
        const name = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Otro';
        const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '';
        return os ? `${name} · ${os}` : name;
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

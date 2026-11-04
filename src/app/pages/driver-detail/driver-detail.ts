import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Driver, DriverService, DriverSummary } from '../../service/driver.service';
import { whatsappLink } from '../../service/client.service';
import { DocumentReminder, DocumentReminderHistoryEntry, ReminderService } from '../../service/reminder.service';
import { SettlementService } from '../../service/settlement.service';
import { Advance, AdvanceService } from '../../service/advance.service';
import { SETTLEMENT_STATUS_LABELS, labelOf } from '../../service/labels';
import { DriverForm, dateOnly } from '../driver-list/driver-form';

type Tab = 'resumen' | 'datos' | 'documentos' | 'pagos';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
    selector: 'app-driver-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TabsModule, TagModule, TableModule, SelectModule, ChartModule, SkeletonModule, ToastModule, TooltipModule, DriverForm],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="card">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div class="flex items-start gap-3">
                    <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" routerLink="/app/drivers" pTooltip="Volver a Choferes" />
                    <div *ngIf="driver; else loadingTitle">
                        <div class="font-bold text-2xl">{{ driver.name }}</div>
                        <div class="text-sm text-muted-color">
                            <span *ngIf="driver.dni">DNI {{ driver.dni }}</span>
                            <span *ngIf="driver.dni && driver.cuit"> · </span>
                            <span *ngIf="driver.cuit">CUIT {{ driver.cuit }}</span>
                            <span *ngIf="age() !== null"> · {{ age() }} años</span>
                        </div>
                        <div class="flex flex-wrap gap-2 mt-2">
                            <p-tag *ngIf="carnetStatus() as st" [value]="st.label" [severity]="st.severity" />
                            <p-tag *ngIf="!driver.cbu && !driver.cbu_alias" value="Sin datos de pago" severity="warn" />
                        </div>
                    </div>
                    <ng-template #loadingTitle><p-skeleton width="16rem" height="2rem" /></ng-template>
                </div>
                <div *ngIf="driver" class="flex flex-wrap gap-2">
                    <a *ngIf="whatsapp(driver.phone) as wa" [href]="wa" target="_blank" rel="noopener"><p-button icon="pi pi-whatsapp" label="WhatsApp" [outlined]="true" severity="success" size="small" /></a>
                    <a *ngIf="driver.emergency_contact_phone" [href]="'tel:' + driver.emergency_contact_phone" [pTooltip]="'Contacto de emergencia: ' + (driver.emergency_contact_name || '') + ' · ' + driver.emergency_contact_phone">
                        <p-button icon="pi pi-heart" label="Emergencia" [outlined]="true" severity="danger" size="small" />
                    </a>
                </div>
            </div>

            <p-tabs *ngIf="driver" [scrollable]="true" [value]="tab" (valueChange)="setTab($any($event))">
                <p-tablist>
                    <p-tab value="resumen"><i class="pi pi-chart-bar mr-2"></i>Resumen</p-tab>
                    <p-tab value="datos"><i class="pi pi-id-card mr-2"></i>Datos</p-tab>
                    <p-tab value="documentos"><i class="pi pi-file mr-2"></i>Documentos</p-tab>
                    <p-tab value="pagos"><i class="pi pi-wallet mr-2"></i>Liquidaciones y adelantos</p-tab>
                </p-tablist>
                <p-tabpanels>
                    <p-tabpanel value="resumen">
                        <div class="flex justify-end mb-4">
                            <p-select [options]="years" [(ngModel)]="year" (onChange)="loadSummary()" styleClass="w-32" />
                        </div>
                        <ng-container *ngIf="summary; else loadingSummary">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                                    <div class="text-sm font-semibold text-muted-color uppercase tracking-wider mb-1">Viajes {{ summary.year }}</div>
                                    <div class="text-3xl font-bold">{{ summary.trips }}</div>
                                    <div class="text-xs text-muted-color mt-2">{{ summary.km | number: '1.0-0' }} km</div>
                                </div>
                                <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                                    <div class="text-sm font-semibold text-muted-color uppercase tracking-wider mb-1">Ganado {{ summary.year }}</div>
                                    <div class="text-3xl font-bold">{{ summary.earnings | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}</div>
                                    <div class="text-xs text-muted-color mt-2" *ngIf="summary.trips">{{ summary.earnings / summary.trips | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }} por viaje</div>
                                </div>
                                <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                                    <div class="text-sm font-semibold text-muted-color uppercase tracking-wider mb-1">A liquidar</div>
                                    <div class="text-3xl font-bold" [class.text-orange-600]="summary.toSettle.amount > 0">{{ summary.toSettle.amount | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}</div>
                                    <div class="text-xs text-muted-color mt-2">{{ summary.toSettle.count }} servicios sin liquidación (todos los años)</div>
                                </div>
                                <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                                    <div class="text-sm font-semibold text-muted-color uppercase tracking-wider mb-1">Adelantos sin descontar</div>
                                    <div class="text-3xl font-bold" [class.text-orange-600]="summary.pendingAdvances.amount > 0">{{ summary.pendingAdvances.amount | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}</div>
                                    <div class="text-xs text-muted-color mt-2">{{ summary.pendingAdvances.count }} adelantos</div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div class="lg:col-span-2 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                                    <div class="font-semibold mb-3">Viajes por mes</div>
                                    <p-chart *ngIf="summary.trips; else noTrips" type="bar" [data]="chartData" [options]="chartOptions" height="240px" />
                                    <ng-template #noTrips><div class="text-center text-muted-color py-12">Sin viajes en {{ summary.year }}.</div></ng-template>
                                </div>
                                <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-700 flex flex-col gap-4">
                                    <div>
                                        <div class="font-semibold mb-2">Clientes con más viajes</div>
                                        <div *ngFor="let c of summary.topClients" class="flex justify-between text-sm py-1 border-b border-surface-100 dark:border-surface-800 last:border-0">
                                            <a class="text-primary cursor-pointer hover:underline" [routerLink]="['/app/clients', c.id]">{{ c.name }}</a>
                                            <span class="text-muted-color">{{ c.trips }} viajes</span>
                                        </div>
                                        <div *ngIf="!summary.topClients.length" class="text-sm text-muted-color">Sin datos.</div>
                                    </div>
                                    <div class="text-sm flex flex-col gap-1 pt-2 border-t border-surface-200 dark:border-surface-700">
                                        <div *ngIf="summary.firstServiceDate"><span class="text-muted-color">Primer viaje:</span> {{ summary.firstServiceDate | date: 'dd/MM/yyyy' }}</div>
                                        <div *ngIf="summary.lastServiceDate"><span class="text-muted-color">Último viaje:</span> {{ summary.lastServiceDate | date: 'dd/MM/yyyy' }}</div>
                                        <div *ngIf="summary.lastSettlement">
                                            <span class="text-muted-color">Última liquidación:</span> {{ summary.lastSettlement.code }} · {{ summary.lastSettlement.totalAmount | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }} ({{ settlementStatus(summary.lastSettlement.status) }})
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ng-container>
                        <ng-template #loadingSummary><p-skeleton height="16rem" /></ng-template>
                    </p-tabpanel>

                    <p-tabpanel value="datos">
                        <div class="max-w-3xl">
                            <app-driver-form *ngIf="draft" [driver]="draft" [submitted]="submitted" />
                            <div class="flex justify-end gap-2 mt-6">
                                <p-button label="Descartar cambios" icon="pi pi-undo" [text]="true" (click)="resetDraft()" />
                                <p-button label="Guardar" icon="pi pi-check" [loading]="saving" (click)="save()" />
                            </div>
                        </div>
                    </p-tabpanel>

                    <p-tabpanel value="documentos">
                        <ng-container *ngIf="docsLoaded; else loadingDocs">
                            <div class="flex justify-between items-center mb-3">
                                <span class="font-semibold text-lg">Vencimientos</span>
                                <p-button label="Ir a Vencimientos" icon="pi pi-external-link" [text]="true" size="small" routerLink="/app/reminders" />
                            </div>
                            <p-table [value]="reminders" size="small" styleClass="mb-8">
                                <ng-template pTemplate="header">
                                    <tr><th>Documento</th><th>Vence</th><th>Estado</th><th>Notas</th></tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-r>
                                    <tr>
                                        <td>{{ r.type }}</td>
                                        <td>{{ r.expirationDate | date: 'dd/MM/yyyy' }}</td>
                                        <td><p-tag *ngIf="expiryStatus(r.expirationDate, r.alertDaysBefore) as st" [value]="st.label" [severity]="st.severity" /></td>
                                        <td class="text-muted-color">{{ r.notes }}</td>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="emptymessage">
                                    <tr><td colspan="4" class="text-center text-muted-color p-4">Sin vencimientos cargados. El del carnet se carga en Datos; los demás, en Vencimientos.</td></tr>
                                </ng-template>
                            </p-table>

                            <div class="font-semibold text-lg mb-3">Renovaciones</div>
                            <p-table [value]="history" size="small" [rows]="10" [paginator]="history.length > 10">
                                <ng-template pTemplate="header">
                                    <tr><th>Fecha</th><th>Documento</th><th>Vencía</th><th>Vence ahora</th><th>Quién</th></tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-h>
                                    <tr>
                                        <td>{{ h.createdAt | date: 'dd/MM/yyyy' }}</td>
                                        <td>{{ h.type }}</td>
                                        <td>{{ (h.previousExpiration | date: 'dd/MM/yyyy') || '-' }}</td>
                                        <td>{{ (h.newExpiration | date: 'dd/MM/yyyy') || '-' }}</td>
                                        <td class="text-muted-color">{{ h.user?.name || h.user?.email || '-' }}</td>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="emptymessage">
                                    <tr><td colspan="5" class="text-center text-muted-color p-4">Sin renovaciones registradas.</td></tr>
                                </ng-template>
                            </p-table>
                        </ng-container>
                        <ng-template #loadingDocs><p-skeleton height="10rem" /></ng-template>
                    </p-tabpanel>

                    <p-tabpanel value="pagos">
                        <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-700 mb-6 max-w-3xl">
                            <div class="font-semibold mb-3">Datos para pagarle</div>
                            <div *ngIf="driver.cbu || driver.cbu_alias; else noPayment" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div *ngIf="driver.cbu" class="flex items-center gap-2">
                                    <span class="text-muted-color">CBU/CVU</span> <span class="font-mono">{{ driver.cbu }}</span>
                                    <p-button icon="pi pi-copy" [rounded]="true" [text]="true" size="small" pTooltip="Copiar" (click)="copy(driver.cbu, 'CBU')" />
                                </div>
                                <div *ngIf="driver.cbu_alias" class="flex items-center gap-2">
                                    <span class="text-muted-color">Alias</span> <span class="font-mono">{{ driver.cbu_alias }}</span>
                                    <p-button icon="pi pi-copy" [rounded]="true" [text]="true" size="small" pTooltip="Copiar" (click)="copy(driver.cbu_alias, 'Alias')" />
                                </div>
                                <div *ngIf="driver.bank"><span class="text-muted-color">Banco</span> {{ driver.bank }}</div>
                                <div><span class="text-muted-color">Titular</span> {{ driver.account_holder || driver.name }}</div>
                            </div>
                            <ng-template #noPayment>
                                <div class="text-sm text-muted-color">Sin datos de pago. Se cargan en la pestaña Datos.</div>
                            </ng-template>
                        </div>

                        <ng-container *ngIf="paymentsLoaded; else loadingPayments">
                            <div class="flex justify-between items-center mb-3">
                                <span class="font-semibold text-lg">Liquidaciones</span>
                                <p-button label="Ir a Liquidaciones" icon="pi pi-external-link" [text]="true" size="small" routerLink="/app/settlements" />
                            </div>
                            <p-table [value]="settlements" size="small" [rows]="10" [paginator]="settlements.length > 10" styleClass="mb-8">
                                <ng-template pTemplate="header">
                                    <tr><th>Código</th><th>Período</th><th>Servicios</th><th class="text-right">Total</th><th>Estado</th></tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-l>
                                    <tr>
                                        <td class="font-medium">{{ l.code }}</td>
                                        <td class="whitespace-nowrap">{{ l.startDate | date: 'dd/MM/yy' }} – {{ l.endDate | date: 'dd/MM/yy' }}</td>
                                        <td>{{ l.services?.length ?? 0 }}</td>
                                        <td class="text-right whitespace-nowrap">{{ l.totalAmount | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</td>
                                        <td><p-tag [value]="settlementStatus(l.status)" [severity]="l.status === 'PAID' ? 'success' : l.status === 'PROCESSED' ? 'info' : 'secondary'" /></td>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="emptymessage">
                                    <tr><td colspan="5" class="text-center text-muted-color p-4">Sin liquidaciones.</td></tr>
                                </ng-template>
                            </p-table>

                            <div class="flex justify-between items-center mb-3">
                                <span class="font-semibold text-lg">Adelantos</span>
                                <p-button label="Ir a Adelantos" icon="pi pi-external-link" [text]="true" size="small" routerLink="/app/advances" />
                            </div>
                            <p-table [value]="advances" size="small" [rows]="10" [paginator]="advances.length > 10">
                                <ng-template pTemplate="header">
                                    <tr><th>Fecha</th><th>Descripción</th><th class="text-right">Monto</th><th>Estado</th></tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-a>
                                    <tr>
                                        <td class="whitespace-nowrap">{{ a.date | date: 'dd/MM/yyyy' }}</td>
                                        <td>{{ a.description || '-' }}</td>
                                        <td class="text-right whitespace-nowrap">{{ a.amount | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</td>
                                        <td><p-tag [value]="a.isDeducted ? 'Descontado' : 'Sin descontar'" [severity]="a.isDeducted ? 'secondary' : 'warn'" /></td>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="emptymessage">
                                    <tr><td colspan="4" class="text-center text-muted-color p-4">Sin adelantos.</td></tr>
                                </ng-template>
                            </p-table>
                        </ng-container>
                        <ng-template #loadingPayments><p-skeleton height="10rem" /></ng-template>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>

            <div *ngIf="notFound" class="text-center py-16 text-muted-color">Chofer no encontrado.</div>
        </div>
    `
})
export class DriverDetail implements OnInit {
    driver: Driver | null = null;
    draft: Driver | null = null;
    notFound = false;
    tab: Tab = 'resumen';
    submitted = false;
    saving = false;

    year = new Date().getFullYear();
    years: number[] = [];
    summary: DriverSummary | null = null;
    chartData: any;
    chartOptions: any;

    docsLoaded = false;
    reminders: DocumentReminder[] = [];
    history: DocumentReminderHistoryEntry[] = [];

    paymentsLoaded = false;
    settlements: any[] = [];
    advances: Advance[] = [];

    readonly whatsapp = whatsappLink;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private driverService: DriverService,
        private reminderService: ReminderService,
        private settlementService: SettlementService,
        private advanceService: AdvanceService,
        private messageService: MessageService
    ) {
        for (let y = this.year; y >= 2024; y--) this.years.push(y);
    }

    private get id(): number {
        return Number(this.route.snapshot.paramMap.get('id'));
    }

    async ngOnInit() {
        const requested = this.route.snapshot.queryParamMap.get('tab') as Tab | null;
        if (requested && ['resumen', 'datos', 'documentos', 'pagos'].includes(requested)) this.tab = requested;
        this.initChartOptions();
        try {
            this.driver = await this.driverService.getDriver(this.id);
            this.resetDraft();
            this.loadTab(this.tab);
        } catch {
            this.notFound = true;
        }
    }

    setTab(tab: Tab) {
        this.tab = tab;
        this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
        this.loadTab(tab);
    }

    /** Cada pestaña trae lo suyo la primera vez que se abre. */
    private loadTab(tab: Tab) {
        if (tab === 'resumen' && !this.summary) this.loadSummary();
        if (tab === 'documentos' && !this.docsLoaded) this.loadDocs();
        if (tab === 'pagos' && !this.paymentsLoaded) this.loadPayments();
    }

    async loadSummary() {
        this.summary = null;
        try {
            this.summary = await this.driverService.getSummary(this.id, this.year);
            this.chartData = {
                labels: MONTHS,
                datasets: [{ label: 'Viajes', data: this.summary.monthly.map((m) => m.trips), backgroundColor: '#0C2340', borderRadius: 4, maxBarThickness: 32 }]
            };
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el resumen' });
        }
    }

    async loadDocs() {
        try {
            const [reminders, history] = await Promise.all([this.reminderService.getReminders(), this.reminderService.getHistory({ driverId: this.id })]);
            this.reminders = reminders.filter((r) => r.driverId === this.id).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
            this.history = history;
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los documentos' });
        } finally {
            this.docsLoaded = true;
        }
    }

    async loadPayments() {
        try {
            const [settlements, advances] = await Promise.all([firstValueFrom(this.settlementService.getSettlements(this.id)), firstValueFrom(this.advanceService.getAdvances(this.id))]);
            this.settlements = settlements;
            this.advances = [...advances].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las liquidaciones' });
        } finally {
            this.paymentsLoaded = true;
        }
    }

    resetDraft() {
        if (!this.driver) return;
        this.draft = {
            ...this.driver,
            birth_date: dateOnly(this.driver.birth_date),
            carnetVencimiento: this.driver.carnetVencimiento ? new Date(this.driver.carnetVencimiento) : null
        };
        this.submitted = false;
    }

    async save() {
        if (!this.draft || !this.driver?.id) return;
        this.submitted = true;
        if (!this.draft.name?.trim()) return;
        this.saving = true;
        try {
            await this.driverService.updateDriver(this.driver.id, this.draft);
            this.driver = await this.driverService.getDriver(this.driver.id);
            this.resetDraft();
            this.docsLoaded = false;
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Datos del chofer actualizados', life: 3000 });
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el chofer' });
        } finally {
            this.saving = false;
        }
    }

    age(): number | null {
        const birth = dateOnly(this.driver?.birth_date);
        if (!birth) return null;
        const now = new Date();
        const years = now.getFullYear() - birth.getFullYear();
        return now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate()) ? years - 1 : years;
    }

    carnetStatus() {
        return this.driver?.carnetVencimiento ? this.expiryStatus(this.driver.carnetVencimiento, 30, 'Carnet') : null;
    }

    expiryStatus(date: string | Date, alertDays: number, prefix = ''): { label: string; severity: 'success' | 'warn' | 'danger' } {
        const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
        const label = (text: string) => (prefix ? `${prefix} ${text.charAt(0).toLowerCase()}${text.slice(1)}` : text);
        if (days < 0) return { label: label(`Vencido hace ${Math.abs(days)}d`), severity: 'danger' };
        if (days <= alertDays) return { label: label(`Vence en ${days}d`), severity: 'warn' };
        return { label: label('Al día'), severity: 'success' };
    }

    settlementStatus(status: string): string {
        return labelOf(SETTLEMENT_STATUS_LABELS, status);
    }

    async copy(text: string | null | undefined, what: string) {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            this.messageService.add({ severity: 'success', summary: `${what} copiado`, life: 2000 });
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'No se pudo copiar', detail: text });
        }
    }

    private initChartOptions() {
        const style = getComputedStyle(document.documentElement);
        const text = style.getPropertyValue('--text-color-secondary');
        const border = style.getPropertyValue('--surface-border');
        this.chartOptions = {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: text }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: text, precision: 0 }, grid: { color: border } }
            }
        };
    }
}

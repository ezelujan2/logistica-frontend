import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ClientService } from '../../service/client.service';
import { FileService } from '../../service/file.service';
import { ArcaStatus, InvoiceService, hasInvoicePdf, isArcaInvoice, purchaseOrderLabel } from '../../service/invoice.service';
import { ServiceService } from '../../service/service.service';
import { DialogModule } from 'primeng/dialog';
import { VOUCHER_TYPES } from '../../service/labels';
import { InvoiceBillingDialog } from './invoice-billing-dialog';
import { InvoiceNoteDialog } from './invoice-note-dialog';

const NOTE_TYPES = [2, 3, 7, 8, 202, 203];
const CREDIT_TYPES = [3, 8, 203];

/**
 * Todas las facturas y notas en un lugar: las emitidas por LECMA en ARCA, las
 * registradas a mano y las históricas (a título personal, antes de octubre
 * 2026). Desde acá también se factura.
 */
@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        SelectModule,
        SelectButtonModule,
        DatePickerModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
        TooltipModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        InvoiceBillingDialog,
        InvoiceNoteDialog
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog />
        <p-dialog [(visible)]="payDialog" [header]="'Marcar pagada ' + (payInvoice?.invoiceNumber ?? '')" [modal]="true" [style]="{ width: '420px' }" [breakpoints]="{ '480px': '95vw' }">
            <div class="flex flex-col gap-3">
                <span class="text-sm">Sus servicios en Pendiente Pago pasan a <b>Pagado</b> y sus reportes se actualizan.</span>
                <div class="flex flex-col gap-2">
                    <label for="pay-date" class="text-sm font-medium">Fecha de cobro <span class="text-muted-color font-normal">(opcional)</span></label>
                    <p-datepicker inputId="pay-date" [(ngModel)]="payDate" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" [maxDate]="today" appendTo="body" styleClass="w-full" placeholder="Hoy" />
                    <small class="text-muted-color">Si la dejás vacía, queda la de hoy.</small>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" severity="secondary" (click)="payDialog = false" />
                <p-button label="Sí, está pagada" icon="pi pi-check" [loading]="paySaving" (click)="confirmPay()" />
            </ng-template>
        </p-dialog>
        <p-dialog [(visible)]="ocDialog" [header]="'OC del reporte ' + (ocReport?.code ?? '')" [modal]="true" [style]="{ width: '420px' }" [breakpoints]="{ '480px': '95vw' }">
            <div class="flex flex-col gap-2">
                <label for="oc-input" class="text-sm font-medium">Orden de compra del cliente</label>
                <input pInputText id="oc-input" [(ngModel)]="ocValue" maxlength="60" placeholder="Ej: 4550003691" (keyup.enter)="saveOc()" autofocus />
                <small class="text-muted-color">Escribí el número completo. Vacío = sin OC. No cambia el PDF del reporte ni la factura de ARCA: sirve para buscar y cruzar pagos.</small>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" severity="secondary" (click)="ocDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="ocSaving" (click)="saveOc()" />
            </ng-template>
        </p-dialog>
        <div class="card">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <div class="font-semibold text-xl">Facturas</div>
                    <div class="text-sm text-muted-color">
                        Facturas y notas de crédito y débito.
                        <span *ngIf="arca?.enabled">ARCA: punto de venta {{ arca?.pointOfSale }}<span *ngIf="arca?.env !== 'produccion'"> · <b class="text-orange-500">entorno de prueba</b></span>.</span>
                        <span *ngIf="arca && !arca.enabled">ARCA no está conectado: las facturas se registran a mano.</span>
                    </div>
                </div>
                <p-button label="Nueva factura" icon="pi pi-plus" (click)="billingVisible = true" />
            </div>

            <div class="grid grid-cols-12 gap-3 mb-4">
                <div class="col-span-12 md:col-span-3">
                    <p-iconfield>
                        <p-inputicon class="pi pi-search" />
                        <input pInputText type="text" [(ngModel)]="q" (keyup.enter)="load()" (blur)="load()" placeholder="Número, reporte, OC o CAE" class="w-full" />
                    </p-iconfield>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <p-select [options]="clients" [(ngModel)]="clientId" optionLabel="name" optionValue="id" placeholder="Todos los clientes" [showClear]="true" [filter]="true" filterBy="name" (onChange)="load()" styleClass="w-full" />
                </div>
                <div class="col-span-12 md:col-span-3">
                    <p-datepicker [(ngModel)]="range" selectionMode="range" [readonlyInput]="true" dateFormat="dd/mm/yy" placeholder="Período" [showIcon]="true" [showButtonBar]="true" (onSelect)="range?.[1] && load()" (onClearClick)="load()" styleClass="w-full" />
                </div>
                <div class="col-span-12 md:col-span-3">
                    <p-select [options]="statuses" [(ngModel)]="status" optionLabel="label" optionValue="value" placeholder="Todos los estados" [showClear]="true" (onChange)="load()" styleClass="w-full" />
                </div>
                <div class="col-span-12 flex flex-wrap items-center gap-3">
                    <p-selectButton [options]="kinds" [(ngModel)]="kind" optionLabel="label" optionValue="value" [allowEmpty]="false" (onChange)="load()" />
                    <p-selectButton [options]="issuers" [(ngModel)]="issuer" optionLabel="label" optionValue="value" [allowEmpty]="false" (onChange)="load()" />
                    <p-button *ngIf="hasFilters" label="Limpiar filtros" icon="pi pi-filter-slash" [text]="true" severity="secondary" (click)="clearFilters()" />
                </div>
            </div>

            <div class="flex flex-wrap gap-6 mb-3 text-sm">
                <span><b>{{ invoices.length }}</b> comprobantes</span>
                <span>Facturado: <b>{{ totals.invoiced | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</b></span>
                <span *ngIf="totals.credited">Notas de crédito: <b>-{{ totals.credited | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</b></span>
            </div>

            <p-table [value]="invoices" dataKey="id" [loading]="loading" [paginator]="invoices.length > 50" [rows]="50" [expandedRowKeys]="expanded" styleClass="p-datatable-sm mobile-cards">
                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 3rem"></th>
                        <th>Fecha</th>
                        <th>Comprobante</th>
                        <th>Cliente</th>
                        <th>Reportes</th>
                        <th class="text-right">Total</th>
                        <th>Estado</th>
                        <th></th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-inv let-expanded="expanded">
                    <tr class="m-card">
                        <td class="m-end">
                            <p-button *ngIf="inv.reports.length || inv.lines.length" type="button" [pRowToggler]="inv" [text]="true" [rounded]="true" size="small" [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
                        </td>
                        <td>{{ inv.date | date: 'dd/MM/yyyy' }}</td>
                        <td class="m-title">
                            <div class="font-semibold whitespace-nowrap" [class.text-purple-600]="!isNote(inv)" [class.dark:text-purple-400]="!isNote(inv)">{{ inv.invoiceNumber }}</div>
                            <div class="text-xs text-muted-color">
                                {{ typeLabel(inv) }}
                                <span *ngIf="inv.associatedInvoice"> de {{ inv.associatedInvoice.invoiceNumber }}</span>
                            </div>
                            <div *ngFor="let n of inv.notes" class="text-xs text-muted-color">↳ {{ n.invoiceNumber }}</div>
                        </td>
                        <td class="m-strong">{{ inv.clientName || '-' }}</td>
                        <td>
                            <div *ngFor="let r of inv.reports" class="whitespace-nowrap">
                                <a *ngIf="r.code" class="cursor-pointer text-primary hover:underline" (click)="openReport(r.code)" pTooltip="Ver el reporte (PDF)" tooltipPosition="top"><i class="pi pi-file-pdf text-xs mr-1"></i>{{ r.code }}</a>
                                <span *ngIf="!r.code">Sin reporte</span><span *ngIf="r.purchaseOrder" class="text-muted-color"> · {{ ocLabel(r.purchaseOrder) }}</span>
                                <p-button *ngIf="canEditOc(inv, r)" [icon]="r.purchaseOrder ? 'pi pi-pencil' : 'pi pi-plus'" [rounded]="true" [text]="true" size="small" severity="secondary" styleClass="w-6 h-6 p-0 ml-1" [pTooltip]="r.purchaseOrder ? 'Cambiar la OC del reporte' : 'Agregar la OC del reporte'" tooltipPosition="top" (click)="editOc(r)" />
                            </div>
                            <div *ngIf="!inv.reports.length && inv.clientReference" class="text-muted-color">{{ inv.clientReference }}</div>
                            <div *ngIf="inv.extraText" class="text-xs text-muted-color italic">{{ inv.extraText }}</div>
                        </td>
                        <td class="m-strong text-right whitespace-nowrap" [class.text-red-600]="isCredit(inv)">{{ isCredit(inv) ? '-' : '' }}{{ inv.total | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</td>
                        <td>
                            <p-tag [value]="statusLabel(inv)" [severity]="statusSeverity(inv)" />
                        </td>
                        <td class="m-actions whitespace-nowrap text-right">
                            <p-button *ngIf="hasInvoicePdf(inv)" icon="pi pi-file-pdf" [rounded]="true" [text]="true" size="small" pTooltip="Descargar PDF" tooltipPosition="top" (click)="pdf(inv)" />
                            <p-button *ngIf="canPay(inv)" icon="pi pi-check-circle" [rounded]="true" [text]="true" size="small" severity="success" pTooltip="Marcar pagada" tooltipPosition="top" (click)="pay(inv)" />
                            <p-button *ngIf="canNote(inv)" icon="pi pi-file-edit" [rounded]="true" [text]="true" size="small" pTooltip="Nota de crédito o débito" tooltipPosition="top" (click)="noteFor = inv" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template #expandedrow let-inv>
                    <tr>
                        <td colspan="8">
                            <div class="md:pl-12 py-2 flex flex-col gap-3">
                                <div *ngIf="inv.annulledBy" class="text-sm text-red-600"><i class="pi pi-ban mr-1"></i>Anulada por {{ inv.annulledBy }}. Estos servicios volvieron a A Facturar.</div>
                                <div *ngIf="(isNote(inv) || !inv.reports.length) && inv.lines.length" class="flex flex-col">
                                    <div *ngFor="let l of inv.lines" class="flex justify-between gap-4 text-sm py-1 border-b border-surface-200 dark:border-surface-700 last:border-0">
                                        <span>{{ l.description }}</span>
                                        <span class="whitespace-nowrap">{{ l.net | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }} + IVA {{ l.rate }}%</span>
                                    </div>
                                </div>
                                <div *ngFor="let r of inv.reports">
                                    <div class="flex justify-between font-semibold text-sm mb-1">
                                        <span>
                                            <a *ngIf="r.code" class="cursor-pointer text-primary hover:underline" (click)="openReport(r.code)"><i class="pi pi-file-pdf text-xs mr-1"></i>Reporte {{ r.code }}</a>
                                            <span *ngIf="!r.code">Servicios sin reporte</span><span *ngIf="r.purchaseOrder" class="font-normal text-muted-color"> · {{ ocLabel(r.purchaseOrder) }}</span></span>
                                        <span *ngIf="r.services.length">{{ r.total | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span>
                                    </div>
                                    <div *ngFor="let s of r.services" class="flex flex-wrap gap-x-4 text-sm py-1 border-b border-surface-200 dark:border-surface-700 last:border-0">
                                        <span class="w-24">{{ s.startDate | date: 'dd/MM/yyyy' }}</span>
                                        <span class="flex-1 min-w-48">#{{ s.id }} · {{ s.origin }} → {{ s.destination }}</span>
                                        <span class="md:w-32 text-right">{{ s.total_amount | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span>
                                    </div>
                                </div>
                                <div *ngIf="inv.cae" class="text-xs text-muted-color">CAE {{ inv.cae }}<span *ngIf="inv.caeDue"> · vence {{ inv.caeDue | date: 'dd/MM/yyyy' }}</span></div>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr><td colspan="8" class="text-center p-6 text-muted-color">No hay comprobantes con esos filtros.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <app-invoice-billing-dialog [(visible)]="billingVisible" (invoiced)="load()" />
        <app-invoice-note-dialog [invoice]="noteFor" [arcaEnabled]="!!arca?.enabled" (closed)="noteFor = null" (emitted)="load()" />
    `
})
export class InvoiceList implements OnInit {
    invoices: any[] = [];
    clients: any[] = [];
    loading = false;
    arca: ArcaStatus | null = null;
    expanded: Record<string, boolean> = {};

    q = '';
    clientId: number | null = null;
    range: Date[] | null = null;
    status: string | null = null;
    kind = 'all';
    issuer = 'all';

    billingVisible = false;
    noteFor: any = null;

    readonly isArcaInvoice = isArcaInvoice;
    readonly hasInvoicePdf = hasInvoicePdf;
    readonly kinds = [
        { label: 'Todo', value: 'all' },
        { label: 'Facturas', value: 'invoice' },
        { label: 'Notas', value: 'note' }
    ];
    readonly issuers = [
        { label: 'Todas', value: 'all' },
        { label: 'LECMA', value: 'LECMA' },
        { label: 'Históricas / personales', value: 'OTHER' }
    ];
    readonly statuses = [
        { label: 'Emitida (sin cobrar)', value: 'ISSUED' },
        { label: 'Pagada', value: 'PAID' },
        { label: 'Anulada', value: 'CANCELLED' }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        private invoiceService: InvoiceService,
        private clientService: ClientService,
        private fileService: FileService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private serviceService: ServiceService
    ) {}

    async ngOnInit() {
        // Desde Servicios: /app/invoices?q=REP-0328 abre las facturas y notas de ese reporte.
        const q = this.route.snapshot.queryParamMap.get('q');
        if (q) this.q = q;
        this.invoiceService.arcaStatus().then((st) => (this.arca = st)).catch(() => (this.arca = null));
        this.clientService.getClients().then((c) => (this.clients = c)).catch(() => {});
        this.load();
    }

    get hasFilters(): boolean {
        return !!this.q.trim() || !!this.clientId || !!this.range?.[0] || !!this.status || this.kind !== 'all' || this.issuer !== 'all';
    }

    clearFilters() {
        this.q = '';
        this.clientId = null;
        this.range = null;
        this.status = null;
        this.kind = 'all';
        this.issuer = 'all';
        // Si se llegó desde un reporte (?q=REP-…), también se saca de la dirección.
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
        this.load();
    }

    async load() {
        this.loading = true;
        try {
            const params: any = {};
            if (this.q.trim()) params.q = this.q.trim();
            if (this.clientId) params.clientId = this.clientId;
            if (this.range?.[0]) params.from = this.range[0].toISOString();
            if (this.range?.[1]) params.to = new Date(this.range[1].getTime() + 86_399_999).toISOString();
            if (this.status) params.status = this.status;
            if (this.kind !== 'all') params.kind = this.kind;
            if (this.issuer !== 'all') params.issuer = this.issuer;
            this.invoices = await firstValueFrom(this.http.get<any[]>(`${environment.apiUrl}invoices`, { params }));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las facturas.' });
        } finally {
            this.loading = false;
        }
    }

    get totals() {
        let invoiced = 0;
        let credited = 0;
        for (const i of this.invoices) {
            if (i.status === 'CANCELLED') continue;
            if (this.isCredit(i)) credited += Number(i.total);
            else invoiced += Number(i.total);
        }
        return { invoiced, credited };
    }

    isNote(inv: any): boolean {
        return NOTE_TYPES.includes(inv.voucherType);
    }

    isCredit(inv: any): boolean {
        return CREDIT_TYPES.includes(inv.voucherType);
    }

    typeLabel(inv: any): string {
        if (inv.issuer === 'OTHER') return 'Histórica / personal';
        const type = VOUCHER_TYPES.find((t) => t.value === inv.voucherType)?.label ?? 'Comprobante';
        return isArcaInvoice(inv) ? `${type} · emitida desde LECMA` : `${type} · registrada a mano`;
    }

    statusLabel(inv: any): string {
        if (inv.status === 'CANCELLED') return 'Anulada';
        if (this.isNote(inv)) return 'Emitida';
        return inv.paid ? 'Pagada' : 'Emitida';
    }

    statusSeverity(inv: any): 'success' | 'info' | 'danger' {
        const label = this.statusLabel(inv);
        return label === 'Anulada' ? 'danger' : label === 'Pagada' ? 'success' : 'info';
    }

    /** Emitida, sin cobrar y con servicios: se puede marcar pagada. */
    canPay(inv: any): boolean {
        return !this.isNote(inv) && inv.status !== 'CANCELLED' && !inv.paid && (inv.reports?.length ?? 0) > 0;
    }

    readonly ocLabel = purchaseOrderLabel;
    ocDialog = false;
    ocSaving = false;
    ocValue = '';
    ocReport: { id: number; code: string | null; purchaseOrder: string | null } | null = null;

    /** Con OC se puede corregir siempre; agregarla, sólo a los clientes que piden orden de compra. */
    canEditOc(inv: any, report: { id: number | null; purchaseOrder: string | null }): boolean {
        if (!report.id) return false;
        if (report.purchaseOrder) return true;
        return !!(this.clients.find((c) => c.id === inv.clientId) as any)?.requires_purchase_order;
    }

    /** Agregar o cambiar la OC de un reporte desde su factura. */
    editOc(report: { id: number; code: string | null; purchaseOrder: string | null }) {
        this.ocReport = report;
        this.ocValue = report.purchaseOrder ?? '';
        this.ocDialog = true;
    }

    async saveOc() {
        if (!this.ocReport) return;
        this.ocSaving = true;
        try {
            // Se guarda tal cual la escriben; el "OC" de adelante lo pone la pantalla.
            const value = this.ocValue.trim().replace(/^o\.?\s*c\.?[\s:#°º.-]*(?=\d)/i, '');
            await this.serviceService.updateGroupNotes(this.ocReport.id, undefined, value);
            this.messageService.add({ severity: 'success', summary: 'OC guardada', detail: `${this.ocReport.code}: ${value ? purchaseOrderLabel(value) : 'sin OC'}`, life: 3000 });
            this.ocDialog = false;
            this.load();
        } catch (e: any) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.error ?? 'No se pudo guardar la OC.' });
        } finally {
            this.ocSaving = false;
        }
    }

    readonly today = new Date();
    payDialog = false;
    paySaving = false;
    payDate: Date | null = null;
    payInvoice: any = null;

    pay(inv: any) {
        this.payInvoice = inv;
        this.payDate = null;
        this.payDialog = true;
    }

    /** La fecha de cobro es opcional: vacía, queda la de hoy. */
    async confirmPay() {
        const inv = this.payInvoice;
        if (!inv) return;
        this.paySaving = true;
        try {
            // Mediodía de ese día, así la fecha no se corre al guardarla.
            const date = this.payDate ? new Date(this.payDate.getFullYear(), this.payDate.getMonth(), this.payDate.getDate(), 12) : null;
            const { paidServices } = await this.invoiceService.pay(inv.id, date);
            this.messageService.add({ severity: 'success', summary: 'Factura pagada', detail: `${inv.invoiceNumber}: ${paidServices} servicio(s) pasaron a Pagado.`, life: 4000 });
            this.payDialog = false;
            this.load();
        } catch (e: any) {
            this.messageService.add({ severity: 'error', summary: 'No se pudo', detail: e?.error?.error ?? 'No se pudo marcar como pagada.', life: 8000 });
        } finally {
            this.paySaving = false;
        }
    }

    /** Factura A, B o FCE de LECMA (emitida desde acá o registrada a mano): se le puede hacer o registrar una nota. */
    canNote(inv: any): boolean {
        return inv.issuer === 'LECMA' && [1, 6, 201].includes(inv.voucherType) && !this.isNote(inv) && inv.status !== 'CANCELLED';
    }

    /** El PDF del reporte, el mismo que se abre desde Servicios. */
    openReport(code: string) {
        this.fileService.open('reports', `${code}.pdf`).catch(() => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir el reporte.' }));
    }

    pdf(inv: any) {
        this.invoiceService.downloadPdf(inv.id, inv.invoiceNumber).catch(() => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el PDF.' }));
    }
}

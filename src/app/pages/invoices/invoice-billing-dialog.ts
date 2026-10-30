import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientService } from '../../service/client.service';
import { ServiceService } from '../../service/service.service';
import { ArcaStatus, InvoiceForm, InvoiceService, emptyInvoiceForm, isInvoiceFormComplete } from '../../service/invoice.service';
import { InvoiceFields } from '../service-list/invoice-fields';
import { ARCA_ACTIVITY_LABELS, DEFAULT_ARCA_ACTIVITY, IVA_CONDITION_LABELS, labelOf, optionsOf } from '../../service/labels';

/**
 * Facturar: cliente, reportes listos para facturar y los datos de la factura.
 * Se emite en ARCA o se registra una hecha a mano. Lo usan la pantalla de
 * Facturas y Servicios › A Facturar; quien lo abre pone el p-confirmDialog y el
 * p-toast.
 */
@Component({
    selector: 'app-invoice-billing-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, SelectModule, SelectButtonModule, TableModule, TagModule, InputTextModule, DatePickerModule, InvoiceFields],
    template: `
        <p-dialog [visible]="visible" (visibleChange)="visibleChange.emit($event)" header="Facturar" [modal]="true" [style]="{ width: '820px', 'max-width': '95vw' }" [maximizable]="true" (onShow)="onShow()">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label class="font-bold">Cliente</label>
                    <p-select [options]="clients" [(ngModel)]="client" optionLabel="name" (onChange)="loadGroups()" placeholder="Elegí el cliente" appendTo="body" styleClass="w-full" [filter]="true" filterBy="name" />
                    <small *ngIf="padronMismatch" class="text-orange-600"><i class="pi pi-exclamation-triangle mr-1"></i>{{ padronMismatch }}</small>
                </div>

                <div *ngIf="arca?.enabled" class="flex flex-wrap items-center gap-3">
                    <p-selectButton [options]="modes" [(ngModel)]="mode" optionLabel="label" optionValue="value" [allowEmpty]="false" />
                    <p-tag *ngIf="mode === 'arca' && arca?.env !== 'produccion'" severity="warn" value="ARCA de prueba: sin validez fiscal" />
                </div>

                <app-invoice-fields *ngIf="client" [form]="form" [clientId]="client.id" [suggest]="true" [arca]="mode === 'arca'" />

                <div *ngIf="client">
                    <h3 class="font-bold text-lg mb-2">Reportes listos para facturar</h3>
                    <p-table [value]="groups" [(selection)]="selected" dataKey="id" [scrollable]="true" scrollHeight="300px" [loading]="loading">
                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                                <th>Reporte</th>
                                <th>OC del cliente<span *ngIf="client?.requires_purchase_order" class="text-orange-600"> *</span></th>
                                <th>Viajes</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-group>
                            <tr>
                                <td><p-tableCheckbox [value]="group" /></td>
                                <td>{{ group.code }}</td>
                                <td><input pInputText [(ngModel)]="purchaseOrders[group.id]" [placeholder]="client?.requires_purchase_order ? 'Obligatoria' : 'Opcional'" [class.ng-invalid]="client?.requires_purchase_order && !purchaseOrders[group.id]?.trim()" [class.ng-dirty]="client?.requires_purchase_order && !purchaseOrders[group.id]?.trim()" class="w-32 p-inputtext-sm" /></td>
                                <td>{{ group.serviceCount }}</td>
                                <td class="text-right">{{ group.totalAmount | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr><td colspan="5" class="text-center p-4">Este cliente no tiene reportes listos para facturar.</td></tr>
                        </ng-template>
                    </p-table>
                    <div *ngIf="missingPurchaseOrders" class="text-sm text-orange-600 mt-2"><i class="pi pi-exclamation-triangle mr-1"></i>Este cliente pide orden de compra: completá la OC de cada reporte elegido.</div>
                    <div *ngIf="selected.length" class="text-right mt-2">Total: <b>{{ selectedTotal | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</b></div>
                </div>

                <div *ngIf="client && mode === 'arca'" class="grid grid-cols-12 gap-3">
                    <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                        <label class="font-bold">Actividad</label>
                        <p-select [options]="activities" [(ngModel)]="activity" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                    </div>
                    <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                        <label class="font-bold">Vencimiento del pago</label>
                        <p-datepicker [(ngModel)]="paymentDue" dateFormat="dd/mm/yy" [showIcon]="true" [minDate]="form.issueDate ?? today" appendTo="body" styleClass="w-full" />
                    </div>
                </div>

                <div *ngIf="mode === 'arca' && freightAtReducedRate" class="text-sm text-orange-600">
                    <i class="pi pi-exclamation-triangle mr-1"></i>Hay fletes con IVA al 10,5%: el transporte de carga suele ir al 21%. Revisá el IVA de esos servicios antes de emitir.
                </div>

                <div *ngIf="client && mode === 'arca'" class="flex flex-col gap-2">
                    <label class="font-bold">Texto adicional <span class="font-normal text-muted-color">(opcional)</span></label>
                    <input pInputText [(ngModel)]="extraText" maxlength="200" placeholder="Ej: Traslados de personal octubre" class="w-full" />
                </div>

                <div *ngIf="mode === 'arca' && selected.length" class="rounded border border-surface-200 dark:border-surface-700 p-3 text-sm">
                    <div class="font-semibold mb-2">Así salen las filas de la factura</div>
                    <div *ngFor="let g of selected" class="flex justify-between gap-4 py-1">
                        <span>{{ lineText(g) }}</span>
                        <span class="whitespace-nowrap">{{ g.totalAmount | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</span>
                    </div>
                    <div *ngIf="vatIncluded" class="text-xs text-muted-color mt-2">Factura B: los importes van con el IVA incluido, sin discriminar.</div>
                    <div *ngIf="fceRequired" class="text-xs text-orange-600 mt-2">
                        <i class="pi pi-exclamation-triangle mr-1"></i>Empresa del registro de FCE y el total supera {{ arca?.fceMin | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}: corresponde FCE A.
                    </div>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="visibleChange.emit(false)" />
                <p-button *ngIf="mode === 'arca'" label="Emitir en ARCA" icon="pi pi-send" severity="success" (click)="confirmArca()" [loading]="busy" [disabled]="!client || !selected.length || busy || missingPurchaseOrders" />
                <p-button *ngIf="mode !== 'arca'" label="Registrar factura" icon="pi pi-check" severity="success" (click)="register()" [loading]="busy" [disabled]="!client || !selected.length || !complete(form) || busy || missingPurchaseOrders" />
            </ng-template>
        </p-dialog>
    `
})
export class InvoiceBillingDialog {
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    /** Cliente con el que se abre (por ejemplo, el de los servicios seleccionados). */
    @Input() presetClientId: number | null = null;
    /** Avisa cuando se facturó, con la factura creada. */
    @Output() invoiced = new EventEmitter<any>();

    clients: any[] = [];
    client: any = null;
    groups: any[] = [];
    selected: any[] = [];
    form: InvoiceForm = emptyInvoiceForm();
    arca: ArcaStatus | null = null;
    mode: 'arca' | 'manual' = 'manual';
    readonly modes = [
        { label: 'Emitir en ARCA', value: 'arca' },
        { label: 'Registrar una hecha a mano', value: 'manual' }
    ];
    /** OC de cada reporte, editable acá; se guarda en el reporte al facturar. */
    purchaseOrders: Record<number, string> = {};
    extraText = '';
    /** Actividad de LECMA que se informa en ARCA. */
    readonly activities = optionsOf(ARCA_ACTIVITY_LABELS);
    activity = DEFAULT_ARCA_ACTIVITY;
    loading = false;
    busy = false;
    readonly complete = isInvoiceFormComplete;

    constructor(
        private clientService: ClientService,
        private serviceService: ServiceService,
        private invoiceService: InvoiceService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    /** Exentos y consumidores finales: Factura B, con el IVA incluido sin discriminar. */
    get vatIncluded(): boolean {
        return this.client?.iva_condition === 'EXENTO' || this.client?.iva_condition === 'CONSUMIDOR_FINAL';
    }

    /** Igual que el backend: "Honorarios por servicios según Reporte REP-0123 OC3196 - texto". */
    lineText(group: any): string {
        const oc = this.purchaseOrders[group.id]?.trim();
        const base = `Honorarios por servicios según Reporte ${group.code}${oc ? ' ' + oc : ''}`;
        return this.extraText.trim() ? `${base} - ${this.extraText.trim()}` : base;
    }

    /** Cliente que pide OC: cada reporte elegido tiene que tenerla. */
    get missingPurchaseOrders(): boolean {
        return !!this.client?.requires_purchase_order && this.selected.some((g) => !this.purchaseOrders[g.id]?.trim());
    }

    /** Fletes con IVA reducido: el transporte de carga suele ir al 21%. */
    get freightAtReducedRate(): boolean {
        return this.selected.some((g) => g.billable.some((s: any) => s.serviceType === 'FREIGHT' && Number(s.taxRatePercentage) === 10.5));
    }

    /** Vencimiento del pago: emisión + plazo del cliente (30 días si no tiene), salvo que se cambie a mano. */
    private customPaymentDue: Date | null = null;
    readonly today = new Date();

    get paymentDue(): Date {
        if (this.customPaymentDue) return this.customPaymentDue;
        const d = new Date(this.form.issueDate ?? new Date());
        d.setDate(d.getDate() + (this.client?.payment_terms_days ?? 30));
        return d;
    }

    set paymentDue(value: Date) {
        this.customPaymentDue = value;
    }

    /** Empresa del registro de FCE y el total llega al mínimo: va FCE A. */
    get fceRequired(): boolean {
        return !!this.client?.receives_fce && !!this.arca?.fceMin && this.selectedTotal >= this.arca.fceMin;
    }

    get selectedTotal(): number {
        return this.selected.reduce((sum, g) => sum + g.totalAmount, 0);
    }

    async onShow() {
        this.client = null;
        this.padronMismatch = null;
        this.groups = [];
        this.selected = [];
        this.form = emptyInvoiceForm();
        this.purchaseOrders = {};
        this.extraText = '';
        this.activity = DEFAULT_ARCA_ACTIVITY;
        this.customPaymentDue = null;
        this.invoiceService
            .arcaStatus()
            .then((st) => {
                this.arca = st;
                this.mode = st.enabled ? 'arca' : 'manual';
            })
            .catch(() => {
                this.arca = null;
                this.mode = 'manual';
            });
        if (!this.clients.length) this.clients = await this.clientService.getClients();
        if (this.presetClientId) {
            this.client = this.clients.find((c) => c.id === this.presetClientId) ?? null;
            if (this.client) this.loadGroups();
        }
    }

    /**
     * Reportes en "Generado" o "A Facturar" (son el mismo paso). Sólo cuentan
     * los servicios que se pueden facturar: ni cancelados ni ya facturados.
     */
    /** Si la condición frente al IVA de la ficha no coincide con la de ARCA. */
    padronMismatch: string | null = null;

    private async checkPadron() {
        this.padronMismatch = null;
        const client = this.client;
        if (!this.arca?.enabled || !client?.cuit) return;
        try {
            const p = await this.invoiceService.padron(client.cuit);
            if (this.client !== client || !p.ivaCondition || p.ivaCondition === client.iva_condition) return;
            const saved = client.iva_condition ? labelOf(IVA_CONDITION_LABELS, client.iva_condition) : 'sin cargar';
            this.padronMismatch = `En ARCA figura como ${labelOf(IVA_CONDITION_LABELS, p.ivaCondition)} y en la ficha del cliente está ${saved}. Revisalo en Clientes antes de emitir.`;
        } catch {
            // Sin respuesta del padrón se factura igual.
        }
    }

    async loadGroups() {
        this.selected = [];
        this.form = emptyInvoiceForm();
        this.checkPadron();
        if (!this.client) return;
        this.loading = true;
        try {
            const groups = await this.serviceService.getGroups({ clientId: this.client.id, status: 'GENERATED,PENDING_INVOICE' });
            this.groups = groups
                .map((g: any) => {
                    const billable = (g.services ?? []).filter((s: any) => s.status !== 'CANCELLED' && !s.invoiceId);
                    return { ...g, billable, serviceCount: billable.length, totalAmount: billable.reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0) };
                })
                .filter((g: any) => g.serviceCount > 0);
            this.purchaseOrders = Object.fromEntries(this.groups.map((g) => [g.id, g.purchaseOrder ?? '']));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los reportes.' });
        } finally {
            this.loading = false;
        }
    }

    private selectedPurchaseOrders(): Record<number, string> {
        return Object.fromEntries(this.selected.map((g) => [g.id, this.purchaseOrders[g.id] ?? '']));
    }

    private serviceIds(): number[] {
        return this.selected.flatMap((g) => g.billable.map((s: any) => s.id));
    }

    confirmArca() {
        const type = this.form.voucherType === 201 ? 'Factura de Crédito Electrónica A' : this.form.voucherType === 6 ? 'Factura B' : 'Factura A';
        if ((this.form.voucherType === 6) !== this.vatIncluded) {
            const due = this.vatIncluded ? 'Factura B' : 'Factura A o FCE';
            this.messageService.add({ severity: 'warn', summary: 'Tipo de factura', detail: `A este cliente le corresponde ${due} según su condición frente al IVA.` });
            return;
        }
        if (this.fceRequired && this.form.voucherType === 1) {
            this.messageService.add({ severity: 'warn', summary: 'Tipo de factura', detail: 'El cliente está en el registro de FCE y el total llega al mínimo: corresponde FCE A.' });
            return;
        }
        if (this.form.voucherType === 201 && !this.client.receives_fce) {
            this.messageService.add({ severity: 'warn', summary: 'Tipo de factura', detail: 'El cliente no está marcado como empresa del registro de FCE: corresponde Factura A.' });
            return;
        }
        if (!this.client.address?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el domicilio', detail: 'El domicilio del cliente es obligatorio en la factura. Cargalo en Clientes.' });
            return;
        }
        const total = this.selectedTotal.toLocaleString('es-AR', { maximumFractionDigits: 2 });
        const freight = this.freightAtReducedRate ? '<br><br><b>Ojo:</b> hay fletes con IVA al 10,5%; el transporte de carga suele ir al 21%.' : '';
        const test = this.arca?.env !== 'produccion' ? '<br><br><b>ARCA de prueba:</b> la factura no tiene validez fiscal.' : '';
        this.confirmationService.confirm({
            header: 'Emitir en ARCA',
            message: `Se va a emitir una <b>${type}</b> a <b>${this.client.name}</b> por aprox. <b>$${total}</b> (${this.selected.length} reporte/s), con vencimiento del pago el <b>${this.paymentDue.toLocaleDateString('es-AR')}</b>.${freight}<br><br>Una vez emitida no se puede editar: se corrige con nota de crédito.${test}`,
            acceptLabel: 'Emitir',
            rejectLabel: 'Cancelar',
            accept: () => this.emit()
        });
    }

    private async emit() {
        this.busy = true;
        try {
            const invoice = await this.invoiceService.emitArca(this.serviceIds(), this.client.id, this.form, this.selectedPurchaseOrders(), this.extraText, this.activity, this.customPaymentDue);
            this.messageService.add({ severity: 'success', summary: 'Factura emitida', detail: `${invoice.invoiceNumber} · CAE ${invoice.cae}`, life: 8000 });
            this.invoiceService.downloadPdf(invoice.id, invoice.invoiceNumber).catch(() => {});
            this.done(invoice);
        } catch (error: any) {
            this.messageService.add({ severity: 'error', summary: 'ARCA', detail: error?.error?.error ?? 'No se pudo emitir la factura.', life: 12000 });
        } finally {
            this.busy = false;
        }
    }

    async register() {
        this.busy = true;
        try {
            const invoice = await this.invoiceService.createInvoice(this.serviceIds(), this.client.id, this.form, this.selectedPurchaseOrders());
            this.messageService.add({ severity: 'success', summary: 'Factura registrada', detail: invoice.invoiceNumber });
            this.done(invoice);
        } catch (error: any) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.error?.error ?? 'No se pudo registrar la factura.' });
        } finally {
            this.busy = false;
        }
    }

    private done(invoice: any) {
        this.visibleChange.emit(false);
        this.invoiced.emit(invoice);
    }
}

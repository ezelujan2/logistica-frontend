import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Client, ClientContact, ClientService, whatsappLink } from '../../service/client.service';
import { ServiceService } from '../../service/service.service';
import { hasInvoicePdf, InvoiceService } from '../../service/invoice.service';
import { AuthService } from '../../service/auth.service';
import { IVA_CONDITION_LABELS, SERVICE_STATUS_LABELS, SERVICE_TYPE_LABELS, labelOf } from '../../service/labels';
import { ClientForm } from '../client-list/client-form';
import { ClientStats } from '../client-stats/client-stats';

type Tab = 'resumen' | 'datos' | 'contactos' | 'historial';

/** Cuántos meses hacia atrás muestra la pestaña de servicios y facturas. */
const HISTORY_MONTHS = 12;

@Component({
    selector: 'app-client-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TabsModule, TagModule, TableModule, DialogModule, InputTextModule, TextareaModule, SkeletonModule, ToastModule, TooltipModule, ClientForm, ClientStats],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="card">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div class="flex items-start gap-3">
                    <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" routerLink="/app/clients" pTooltip="Volver a Clientes" />
                    <div *ngIf="client; else loadingTitle">
                        <div class="font-bold text-2xl">{{ client.name }}</div>
                        <div class="text-sm text-muted-color">
                            <span *ngIf="client.legal_name && client.legal_name !== client.name">{{ client.legal_name }} · </span>
                            <span *ngIf="client.cuit">CUIT {{ client.cuit }}</span>
                            <span *ngIf="!client.cuit">Sin CUIT</span>
                            <span *ngIf="client.createdAt"> · Cliente desde {{ client.createdAt | date: 'MM/yyyy' }}</span>
                        </div>
                        <div class="flex flex-wrap gap-2 mt-2">
                            <p-tag *ngIf="client.iva_condition" [value]="ivaLabel(client.iva_condition)" severity="secondary" />
                            <p-tag *ngIf="client.requires_purchase_order" value="Pide OC" severity="info" />
                            <p-tag *ngIf="client.receives_fce" value="Registro de FCE" severity="info" />
                            <p-tag *ngIf="!client.address" value="Sin domicilio: no se puede facturar en ARCA" severity="warn" />
                        </div>
                    </div>
                    <ng-template #loadingTitle><p-skeleton width="16rem" height="2rem" /></ng-template>
                </div>
                <div *ngIf="client" class="flex gap-2">
                    <a *ngIf="whatsapp(client.phone) as wa" [href]="wa" target="_blank" rel="noopener"><p-button icon="pi pi-whatsapp" label="WhatsApp" [outlined]="true" severity="success" size="small" /></a>
                    <a *ngIf="client.email" [href]="'mailto:' + client.email"><p-button icon="pi pi-envelope" label="Email" [outlined]="true" size="small" /></a>
                </div>
            </div>

            <p-tabs *ngIf="client" [scrollable]="true" [value]="tab" (valueChange)="setTab($any($event))">
                <p-tablist>
                    <p-tab *ngIf="canViewStats" value="resumen"><i class="pi pi-chart-bar mr-2"></i>Resumen</p-tab>
                    <p-tab value="datos"><i class="pi pi-id-card mr-2"></i>Datos</p-tab>
                    <p-tab value="contactos"><i class="pi pi-users mr-2"></i>Contactos <span class="text-muted-color ml-1">({{ client.contacts?.length ?? 0 }})</span></p-tab>
                    <p-tab value="historial"><i class="pi pi-list mr-2"></i>Servicios y facturas</p-tab>
                </p-tablist>
                <p-tabpanels>
                    <p-tabpanel *ngIf="canViewStats" value="resumen">
                        <app-client-stats *ngIf="tab === 'resumen'" [client]="client.id!" [embedded]="true" />
                    </p-tabpanel>

                    <p-tabpanel value="datos">
                        <div class="max-w-4xl">
                            <app-client-form *ngIf="draft" [client]="draft" [submitted]="submitted" />
                            <div class="flex justify-end gap-2 mt-6">
                                <p-button label="Descartar cambios" icon="pi pi-undo" [text]="true" (click)="resetDraft()" />
                                <p-button label="Guardar" icon="pi pi-check" [loading]="saving" (click)="save()" />
                            </div>
                        </div>
                    </p-tabpanel>

                    <p-tabpanel value="contactos">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-sm text-muted-color">Las personas de la empresa a las que se les escribe.</span>
                            <p-button label="Agregar contacto" icon="pi pi-plus" size="small" (click)="editContact()" />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div *ngFor="let c of client.contacts" class="p-4 rounded-xl border border-surface-200 dark:border-surface-700 flex flex-col gap-2">
                                <div class="flex justify-between items-start gap-2">
                                    <div>
                                        <div class="font-semibold">{{ c.name }}</div>
                                        <div *ngIf="c.role" class="text-sm text-muted-color">{{ c.role }}</div>
                                    </div>
                                    <div class="flex">
                                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" size="small" pTooltip="Editar" (click)="editContact(c)" />
                                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" size="small" severity="danger" pTooltip="Eliminar" (click)="deleteContact(c)" />
                                    </div>
                                </div>
                                <div *ngIf="c.phone" class="text-sm"><i class="pi pi-phone text-xs mr-2 text-muted-color"></i>{{ c.phone }}</div>
                                <div *ngIf="c.email" class="text-sm break-all"><i class="pi pi-envelope text-xs mr-2 text-muted-color"></i>{{ c.email }}</div>
                                <div *ngIf="c.comments" class="text-sm italic text-muted-color whitespace-pre-line">{{ c.comments }}</div>
                                <div class="flex gap-2 mt-auto pt-2">
                                    <a *ngIf="whatsapp(c.phone) as wa" [href]="wa" target="_blank" rel="noopener"><p-button icon="pi pi-whatsapp" label="WhatsApp" [outlined]="true" severity="success" size="small" /></a>
                                    <a *ngIf="c.email" [href]="'mailto:' + c.email"><p-button icon="pi pi-envelope" label="Email" [outlined]="true" size="small" /></a>
                                </div>
                            </div>
                        </div>
                        <div *ngIf="!client.contacts?.length" class="text-center text-muted-color py-10">Todavía no hay contactos cargados.</div>
                    </p-tabpanel>

                    <p-tabpanel value="historial">
                        <ng-container *ngIf="historyLoaded; else loadingHistory">
                            <div class="font-semibold text-lg mb-2">Servicios <span class="text-sm font-normal text-muted-color">(últimos {{ historyMonths }} meses)</span></div>
                            <p-table [value]="services" [rows]="10" [paginator]="services.length > 10" size="small" styleClass="mb-8">
                                <ng-template pTemplate="header">
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Recorrido</th>
                                        <th>Chofer</th>
                                        <th>Estado</th>
                                        <th class="text-right">Total</th>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-s>
                                    <tr>
                                        <td class="whitespace-nowrap">{{ s.startDate | date: 'dd/MM/yyyy' }}</td>
                                        <td>{{ serviceTypeLabel(s.serviceType) }}</td>
                                        <td>{{ s.origin || '-' }} <span *ngIf="s.destination">→ {{ s.destination }}</span></td>
                                        <td>{{ s.drivers?.[0]?.name || '-' }}</td>
                                        <td><p-tag [value]="serviceStatusLabel(s.status)" severity="secondary" /></td>
                                        <td class="text-right whitespace-nowrap">{{ s.total_amount | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</td>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="emptymessage">
                                    <tr><td colspan="6" class="text-center text-muted-color p-4">Sin servicios en este período.</td></tr>
                                </ng-template>
                            </p-table>

                            <div class="font-semibold text-lg mb-2">Facturas</div>
                            <p-table [value]="invoices" [rows]="10" [paginator]="invoices.length > 10" size="small">
                                <ng-template pTemplate="header">
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Número</th>
                                        <th class="text-right">Total</th>
                                        <th>Estado</th>
                                        <th></th>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-inv>
                                    <tr>
                                        <td class="whitespace-nowrap">{{ inv.date | date: 'dd/MM/yyyy' }}</td>
                                        <td class="font-medium">{{ inv.invoiceNumber }}</td>
                                        <td class="text-right whitespace-nowrap">{{ inv.total | currency: 'ARS' : 'symbol-narrow' : '1.2-2' }}</td>
                                        <td><p-tag [value]="invoiceStatus(inv)" [severity]="invoiceStatus(inv) === 'Pagada' ? 'success' : invoiceStatus(inv) === 'Anulada' ? 'danger' : 'info'" /></td>
                                        <td class="text-right">
                                            <p-button *ngIf="hasInvoicePdf(inv)" icon="pi pi-file-pdf" [rounded]="true" [text]="true" size="small" pTooltip="Descargar PDF" (click)="pdf(inv)" />
                                        </td>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="emptymessage">
                                    <tr><td colspan="5" class="text-center text-muted-color p-4">Sin facturas registradas.</td></tr>
                                </ng-template>
                            </p-table>
                        </ng-container>
                        <ng-template #loadingHistory><p-skeleton height="12rem" /></ng-template>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>

            <div *ngIf="notFound" class="text-center py-16 text-muted-color">Cliente no encontrado.</div>
        </div>

        <p-dialog [(visible)]="contactDialog" [style]="{ width: '440px' }" [header]="contact.id ? 'Editar contacto' : 'Nuevo contacto'" [modal]="true" styleClass="p-fluid">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="c_name">Nombre</label>
                    <input pInputText id="c_name" [(ngModel)]="contact.name" autofocus />
                    <small class="p-error" *ngIf="contactSubmitted && !contact.name?.trim()">El nombre es obligatorio.</small>
                </div>
                <div class="flex flex-col gap-2">
                    <label for="c_role">Cargo o área</label>
                    <input pInputText id="c_role" [(ngModel)]="contact.role" placeholder="Ej. Compras, Tesorería" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="c_phone">Teléfono</label>
                    <input pInputText id="c_phone" [(ngModel)]="contact.phone" placeholder="Ej. 341 555-1234" />
                    <small *ngIf="contact.phone && !whatsapp(contact.phone)" class="text-muted-color">Con código de área (10 dígitos) aparece el botón de WhatsApp.</small>
                </div>
                <div class="flex flex-col gap-2">
                    <label for="c_email">Email</label>
                    <input pInputText id="c_email" [(ngModel)]="contact.email" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="c_comments">Comentarios</label>
                    <textarea pTextarea id="c_comments" [(ngModel)]="contact.comments" rows="3" placeholder="Ej. Recibe las facturas"></textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="contactDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [text]="true" [loading]="saving" (click)="saveContact()" />
            </ng-template>
        </p-dialog>
    `
})
export class ClientDetail implements OnInit {
    client: Client | null = null;
    draft: Client | null = null;
    notFound = false;
    tab: Tab = 'datos';
    canViewStats = false;
    submitted = false;
    saving = false;

    contactDialog = false;
    contactSubmitted = false;
    contact: ClientContact = { name: '' };

    readonly historyMonths = HISTORY_MONTHS;
    historyLoaded = false;
    services: any[] = [];
    invoices: any[] = [];

    readonly whatsapp = whatsappLink;
    readonly hasInvoicePdf = hasInvoicePdf;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private clientService: ClientService,
        private serviceService: ServiceService,
        private invoiceService: InvoiceService,
        private messageService: MessageService,
        authService: AuthService
    ) {
        this.canViewStats = authService.hasPermission('viewStatistics');
    }

    async ngOnInit() {
        const requested = this.route.snapshot.queryParamMap.get('tab') as Tab | null;
        const tabs: Tab[] = ['datos', 'contactos', 'historial', ...(this.canViewStats ? (['resumen'] as Tab[]) : [])];
        this.tab = requested && tabs.includes(requested) ? requested : this.canViewStats ? 'resumen' : 'datos';
        try {
            this.client = await this.clientService.getClient(Number(this.route.snapshot.paramMap.get('id')));
            this.resetDraft();
            if (this.tab === 'historial') this.loadHistory();
        } catch (err: any) {
            this.notFound = true;
        }
    }

    setTab(tab: Tab) {
        this.tab = tab;
        this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
        if (tab === 'historial' && !this.historyLoaded) this.loadHistory();
    }

    resetDraft() {
        if (!this.client) return;
        const { contacts, ...data } = this.client;
        this.draft = { ...data };
        this.submitted = false;
    }

    async save() {
        if (!this.draft || !this.client?.id) return;
        this.submitted = true;
        if (!this.draft.name?.trim()) return;
        this.saving = true;
        try {
            const saved = await this.clientService.updateClient(this.client.id, this.draft);
            this.client = { ...saved, contacts: this.client.contacts };
            this.resetDraft();
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Datos del cliente actualizados', life: 3000 });
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el cliente' });
        } finally {
            this.saving = false;
        }
    }

    editContact(contact?: ClientContact) {
        this.contact = contact ? { ...contact } : { name: '' };
        this.contactSubmitted = false;
        this.contactDialog = true;
    }

    async saveContact() {
        if (!this.client?.id) return;
        this.contactSubmitted = true;
        if (!this.contact.name?.trim()) return;
        this.saving = true;
        try {
            const saved = await this.clientService.saveContact(this.client.id, this.contact);
            const others = (this.client.contacts ?? []).filter((c) => c.id !== saved.id);
            this.client.contacts = [...others, saved].sort((a, b) => a.name.localeCompare(b.name));
            this.contactDialog = false;
        } catch (e: any) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.error ?? 'No se pudo guardar el contacto' });
        } finally {
            this.saving = false;
        }
    }

    async deleteContact(contact: ClientContact) {
        if (!this.client?.id || !contact.id) return;
        if (!confirm(`¿Eliminar a ${contact.name} de los contactos?`)) return;
        try {
            await this.clientService.deleteContact(this.client.id, contact.id);
            this.client.contacts = (this.client.contacts ?? []).filter((c) => c.id !== contact.id);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el contacto' });
        }
    }

    async loadHistory() {
        if (!this.client?.id) return;
        const since = new Date();
        since.setMonth(since.getMonth() - HISTORY_MONTHS);
        try {
            const [services, invoices] = await Promise.all([
                this.serviceService.getServices({ clientId: this.client.id, startDate: since.toISOString() }),
                this.invoiceService.getInvoices({ clientId: this.client.id })
            ]);
            this.services = [...services].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            this.invoices = invoices;
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los servicios y facturas' });
        } finally {
            this.historyLoaded = true;
        }
    }

    pdf(inv: any) {
        this.invoiceService.downloadPdf(inv.id, inv.invoiceNumber).catch(() => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el PDF.' }));
    }

    invoiceStatus(inv: any): string {
        if (inv.status === 'CANCELLED') return 'Anulada';
        return inv.paid ? 'Pagada' : 'Emitida';
    }

    ivaLabel(value: string): string {
        return labelOf(IVA_CONDITION_LABELS, value);
    }

    serviceTypeLabel(value: string): string {
        return labelOf(SERVICE_TYPE_LABELS, value);
    }

    serviceStatusLabel(value: string): string {
        return labelOf(SERVICE_STATUS_LABELS, value);
    }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { QuoteService, Quote, QuoteItem, QuoteTemplate } from '../../service/quote.service';
import { Client, ClientService } from '../../service/client.service';
import { ConfigurationService, SystemConfiguration } from '../../service/configuration.service';
import { HelpButtonComponent } from '../../shared/help-button.component';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-quote-list',
    template: `
        <div class="card">
            <p-toast></p-toast>

            <div class="flex items-center gap-2 font-semibold text-xl mb-4">Cotizaciones <app-help-button pageKey="quotes" /></div>

            <p-table #dt1 [value]="quotes" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true"
                [globalFilterFields]="['code', 'contactName', 'client.name']" styleClass="p-datatable-sm" responsiveLayout="stack" breakpoint="960px">
                <ng-template pTemplate="caption">
                    <div class="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                        <div class="flex items-center gap-2">
                            <p-select [options]="statusFilterOptions" [(ngModel)]="selectedStatusFilter" optionLabel="label" optionValue="value" placeholder="Filtrar por estado" (onChange)="onStatusFilterChange()" styleClass="w-48"></p-select>
                        </div>
                        <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            <p-button label="Nueva Cotización" icon="pi pi-plus" (click)="openNew()" styleClass="w-full md:w-auto" />
                            <p-iconfield styleClass="w-full md:w-auto">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="dt1.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." class="w-full md:w-auto" />
                            </p-iconfield>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="header">
                    <tr class="text-sm">
                        <th pSortableColumn="code" style="min-width: 8rem">Código <p-sortIcon field="code" /></th>
                        <th pSortableColumn="contactName" style="min-width: 12rem">Cliente / Contacto <p-sortIcon field="contactName" /></th>
                        <th pSortableColumn="createdAt" style="min-width: 8rem">Fecha <p-sortIcon field="createdAt" /></th>
                        <th style="min-width: 5rem">Items</th>
                        <th pSortableColumn="totalAmount" style="min-width: 8rem">Total <p-sortIcon field="totalAmount" /></th>
                        <th style="min-width: 8rem">Estado</th>
                        <th style="min-width: 6rem">Servicios</th>
                        <th style="min-width: 14rem">Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-quote>
                    <tr>
                        <td><span class="font-mono font-bold">{{ quote.code }}</span></td>
                        <td>
                            <div class="flex flex-col">
                                <span class="font-semibold">{{ quote.contactName }}</span>
                                <span *ngIf="quote.client" class="text-xs text-gray-500">{{ quote.client.name }}</span>
                            </div>
                        </td>
                        <td>{{ quote.createdAt | date:'dd/MM/yyyy' }}</td>
                        <td>{{ quote.items?.length || 0 }}</td>
                        <td class="font-semibold">{{ formatCurrency(quote.totalAmount || 0) }}</td>
                        <td><p-tag [value]="getStatusLabel(quote.status)" [severity]="getStatusSeverity(quote.status)" /></td>
                        <td>
                            <span *ngIf="quote.convertedServices?.length > 0" class="text-sm font-semibold text-green-600">{{ quote.convertedServices.length }} servicio(s)</span>
                            <span *ngIf="!quote.convertedServices?.length" class="text-gray-400">-</span>
                        </td>
                        <td>
                            <div class="flex gap-1 flex-wrap">
                                <p-button *ngIf="quote.status === 'DRAFT'" icon="pi pi-pencil" [rounded]="true" [text]="true" pTooltip="Editar" tooltipPosition="top" (click)="editQuote(quote)" />
                                <p-button *ngIf="quote.status === 'DRAFT'" icon="pi pi-send" [rounded]="true" [text]="true" severity="info" pTooltip="Enviar" tooltipPosition="top" (click)="sendQuote(quote)" />
                                <p-button *ngIf="quote.status === 'SENT'" icon="pi pi-check" [rounded]="true" [text]="true" severity="success" pTooltip="Aceptar" tooltipPosition="top" (click)="acceptQuote(quote)" />
                                <p-button *ngIf="quote.status === 'SENT'" icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" pTooltip="Rechazar" tooltipPosition="top" (click)="rejectQuote(quote)" />
                                <p-button *ngIf="quote.status === 'ACCEPTED'" icon="pi pi-arrow-right" [rounded]="true" [text]="true" severity="success" pTooltip="Convertir a Servicios" tooltipPosition="top" (click)="convertToServices(quote)" />
                                <p-button icon="pi pi-copy" [rounded]="true" [text]="true" severity="secondary" pTooltip="Duplicar" tooltipPosition="top" (click)="duplicateQuote(quote)" />
                                <p-button icon="pi pi-file-pdf" [rounded]="true" [text]="true" severity="warn" pTooltip="Ver PDF" tooltipPosition="top" (click)="openPdf(quote)" />
                                <p-button *ngIf="quote.status === 'DRAFT'" icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Eliminar" tooltipPosition="top" (click)="deleteQuote(quote)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr><td colspan="8" class="text-center p-4">No se encontraron cotizaciones.</td></tr>
                </ng-template>
            </p-table>

            <!-- Create/Edit Quote Dialog -->
            <p-dialog [(visible)]="quoteDialog" [style]="{ width: '900px', 'max-width': '95vw' }" [header]="quote.id ? 'Editar Cotización' : 'Nueva Cotización'" [modal]="true" styleClass="p-fluid" [maximizable]="true" [focusOnShow]="false">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">

                        <!-- Section 1: Client Data -->
                        <p-panel header="Datos del Cliente">
                            <div class="flex flex-col gap-4">
                                <div class="flex flex-col gap-2">
                                    <label for="clientId">Cliente (opcional)</label>
                                    <p-select [options]="clients" [(ngModel)]="quote.clientId" optionLabel="name" optionValue="id" placeholder="Seleccionar cliente..." appendTo="body" styleClass="w-full" [filter]="true" filterBy="name" [showClear]="true" (onChange)="onClientSelect($event.value)"></p-select>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="flex flex-col gap-2">
                                        <label for="contactName">Nombre de Contacto *</label>
                                        <input type="text" pInputText id="contactName" [(ngModel)]="quote.contactName" class="w-full" required />
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label for="contactEmail">Email</label>
                                        <input type="text" pInputText id="contactEmail" [(ngModel)]="quote.contactEmail" class="w-full" />
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label for="contactPhone">Teléfono</label>
                                        <input type="text" pInputText id="contactPhone" [(ngModel)]="quote.contactPhone" class="w-full" />
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="flex flex-col gap-2">
                                        <label for="validUntil">Válida hasta</label>
                                        <p-datepicker [(ngModel)]="quote.validUntil" dateFormat="dd/mm/yy" appendTo="body" styleClass="w-full" [style]="{'width':'100%'}" inputStyleClass="w-full"></p-datepicker>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label>Tarifa</label>
                                        <p-select [options]="configs" [(ngModel)]="quote.configurationId" optionLabel="name" optionValue="id" placeholder="Seleccionar tarifa..." appendTo="body" styleClass="w-full" (onChange)="onConfigSelect($event.value)"></p-select>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label>Forma de Cobro</label>
                                        <p-select [options]="billingTypes" [(ngModel)]="quote.billingType" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" (onChange)="calculateTotals()"></p-select>
                                    </div>
                                </div>
                            </div>
                        </p-panel>

                        <!-- Section 2: Items -->
                        <p-panel header="Items de la Cotización">
                            <div class="flex flex-col gap-3">
                                <div *ngFor="let item of quote.items; let i = index" class="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div class="flex justify-between items-center mb-3">
                                        <span class="font-semibold text-sm text-gray-600">Ítem {{ i + 1 }}</span>
                                        <p-button icon="pi pi-trash" severity="danger" [text]="true" size="small" (click)="removeItem(i)" [disabled]="quote.items!.length <= 1"></p-button>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div class="flex flex-col gap-2">
                                            <label class="text-sm">Tipo de Servicio</label>
                                            <p-select [options]="serviceTypes" [(ngModel)]="item.serviceType" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full"></p-select>
                                        </div>
                                        <div class="flex flex-col gap-2">
                                            <label class="text-sm">Origen</label>
                                            <input type="text" pInputText [(ngModel)]="item.origin" class="w-full" />
                                        </div>
                                        <div class="flex flex-col gap-2">
                                            <label class="text-sm">Destino</label>
                                            <input type="text" pInputText [(ngModel)]="item.destination" class="w-full" />
                                        </div>
                                        <div class="flex flex-col gap-2">
                                            <label class="text-sm">KM Estimados</label>
                                            <p-inputNumber [(ngModel)]="item.estimatedKm" mode="decimal" [minFractionDigits]="0" styleClass="w-full" inputStyleClass="w-full" (onInput)="calculateTotals()"></p-inputNumber>
                                        </div>
                                        <div class="flex flex-col gap-2">
                                            <label class="text-sm">Horas Estimadas</label>
                                            <p-inputNumber [(ngModel)]="item.estimatedHours" mode="decimal" [minFractionDigits]="0" styleClass="w-full" inputStyleClass="w-full" (onInput)="calculateTotals()"></p-inputNumber>
                                        </div>
                                        <div class="flex flex-col gap-2">
                                            <label class="text-sm">Precio por KM</label>
                                            <p-inputNumber [(ngModel)]="item.kmPrice" mode="currency" currency="USD" locale="en-US" styleClass="w-full" inputStyleClass="w-full" (onInput)="calculateTotals()"></p-inputNumber>
                                        </div>
                                        <div class="flex flex-col gap-2">
                                            <label class="text-sm">Precio por Hora</label>
                                            <p-inputNumber [(ngModel)]="item.hourPrice" mode="currency" currency="USD" locale="en-US" styleClass="w-full" inputStyleClass="w-full" (onInput)="calculateTotals()"></p-inputNumber>
                                        </div>
                                        <div class="flex flex-col gap-2">
                                            <label class="text-sm">Precio KM Extra</label>
                                            <p-inputNumber [(ngModel)]="item.extraKmPrice" mode="currency" currency="USD" locale="en-US" styleClass="w-full" inputStyleClass="w-full" (onInput)="calculateTotals()"></p-inputNumber>
                                        </div>
                                    </div>
                                    <div class="mt-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                                        <span class="text-xs text-gray-500">Subtotal ítem</span>
                                        <div class="font-bold text-lg">{{ formatCurrency(calculateItemTotal(item)) }}</div>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <p-button label="+ Agregar ítem" icon="pi pi-plus" [text]="true" (click)="addItem()"></p-button>
                                </div>
                            </div>
                        </p-panel>

                        <!-- Bottom: Discount, Notes -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex flex-col gap-4">
                                <div class="flex flex-col gap-2">
                                    <label>Descuento (%)</label>
                                    <p-inputNumber [(ngModel)]="quote.discount" suffix="%" styleClass="w-full" inputStyleClass="w-full" (onInput)="calculateTotals()"></p-inputNumber>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <label>Notas (visibles para el cliente)</label>
                                    <textarea pTextarea [(ngModel)]="quote.notes" rows="3" class="w-full"></textarea>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <label>Notas Internas</label>
                                    <textarea pTextarea [(ngModel)]="quote.internalNotes" rows="3" class="w-full"></textarea>
                                </div>
                            </div>

                            <!-- Totals -->
                            <div class="flex flex-col gap-2">
                                <div class="bg-gray-50 dark:bg-surface-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div class="flex flex-col gap-3">
                                        <div class="flex justify-between text-sm">
                                            <span>Subtotal:</span>
                                            <span class="font-semibold">{{ formatCurrency(totals.subtotal) }}</span>
                                        </div>
                                        <div *ngIf="totals.discount > 0" class="flex justify-between text-sm text-green-600">
                                            <span>Descuento ({{ quote.discount || 0 }}%):</span>
                                            <span class="font-semibold">- {{ formatCurrency(totals.discount) }}</span>
                                        </div>
                                        <div *ngIf="quote.billingType === 'OFFICIAL_A'" class="flex justify-between text-sm text-blue-600">
                                            <span>IVA (21%):</span>
                                            <span class="font-semibold">+ {{ formatCurrency(totals.tax) }}</span>
                                        </div>
                                        <div *ngIf="quote.billingType !== 'OFFICIAL_A'" class="flex justify-between text-sm text-gray-400">
                                            <span>IVA: No aplica</span>
                                            <span>-</span>
                                        </div>
                                        <p-divider></p-divider>
                                        <div class="flex justify-between text-xl font-bold">
                                            <span>Total:</span>
                                            <span>{{ formatCurrency(totals.total) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="footer">
                    <div class="flex justify-end gap-2">
                        <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="quoteDialog = false" />
                        <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveQuote()" />
                    </div>
                </ng-template>
            </p-dialog>

        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, DialogModule, FormsModule, SelectModule, MultiSelectModule, InputNumberModule, TextareaModule, DatePickerModule, ToastModule, PanelModule, DividerModule, CheckboxModule, TooltipModule, HelpButtonComponent],
    providers: [MessageService]
})
export class QuoteList implements OnInit {
    quotes: Quote[] = [];
    clients: Client[] = [];
    configs: SystemConfiguration[] = [];
    favoriteConfig: SystemConfiguration | null = null;

    loading: boolean = true;
    quoteDialog: boolean = false;

    quote: any = this.getEmptyQuote();

    selectedStatusFilter: string = '';
    @ViewChild('dt1') dt1!: Table;

    totals = { subtotal: 0, discount: 0, tax: 0, total: 0 };

    private currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    statusFilterOptions = [
        { label: 'Todos', value: '' },
        { label: 'Borrador', value: 'DRAFT' },
        { label: 'Enviada', value: 'SENT' },
        { label: 'Aceptada', value: 'ACCEPTED' },
        { label: 'Rechazada', value: 'REJECTED' },
        { label: 'Vencida', value: 'EXPIRED' },
        { label: 'Convertida', value: 'CONVERTED' }
    ];

    serviceTypes = [
        { label: 'Servicio', value: 'SERVICE' },
        { label: 'Mensajería', value: 'MESSAGING' },
        { label: 'Conducción', value: 'DRIVING' },
        { label: 'Media Rueda', value: 'HALF_ROUND' },
        { label: 'Otro', value: 'OTHER' }
    ];

    billingTypes = [
        { label: 'Factura A (IVA 21%)', value: 'OFFICIAL_A' },
        { label: 'Monotributo (sin IVA)', value: 'MONOTRIBUTO' },
        { label: 'Informal (sin IVA)', value: 'INFORMAL' }
    ];

    constructor(
        private quoteService: QuoteService,
        private clientService: ClientService,
        private configService: ConfigurationService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadQuotes();
        this.loadClients();
        this.loadConfiguration();
    }

    // --- Data Loading ---

    async loadQuotes() {
        this.loading = true;
        try {
            const filters: any = {};
            if (this.selectedStatusFilter) {
                filters.status = this.selectedStatusFilter;
            }
            this.quotes = await this.quoteService.getQuotes(filters);
        } catch (error) {
            console.error('Error loading quotes:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error cargando cotizaciones' });
        } finally {
            this.loading = false;
        }
    }

    async loadClients() {
        try {
            this.clients = await this.clientService.getClients();
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    }

    loadConfiguration() {
        this.configService.getConfigs().subscribe({
            next: (data) => {
                this.configs = data;
                this.favoriteConfig = data.find(c => c.isFavorite) || data[0] || null;
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error cargando configuración' })
        });
    }

    onStatusFilterChange() {
        this.loadQuotes();
    }

    // --- Empty Objects ---

    getEmptyQuote(): any {
        return {
            id: undefined,
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            clientId: null,
            validUntil: null,
            billingType: 'OFFICIAL_A',
            configurationId: this.favoriteConfig?.id || null,
            discount: 0,
            notes: '',
            internalNotes: '',
            items: [this.getEmptyItem()]
        };
    }

    getEmptyItem(): QuoteItem {
        return {
            serviceType: 'SERVICE',
            origin: '',
            destination: '',
            estimatedKm: 0,
            estimatedHours: 0,
            kmPrice: this.favoriteConfig?.kmPrice || 0,
            hourPrice: this.favoriteConfig?.hourPrice || 0,
            extraKmPrice: this.favoriteConfig?.extraKmPrice || 0
        };
    }

    // --- Dialog Actions ---

    openNew() {
        this.quote = this.getEmptyQuote();
        this.calculateTotals();
        this.quoteDialog = true;
    }

    async editQuote(quote: Quote) {
        try {
            const full = await this.quoteService.getQuoteById(quote.id!);
            this.quote = {
                ...full,
                validUntil: full.validUntil ? new Date(full.validUntil as string) : null,
                items: full.items && full.items.length > 0 ? full.items : [this.getEmptyItem()]
            };
            this.calculateTotals();
            this.quoteDialog = true;
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error cargando cotización' });
        }
    }

    async saveQuote() {
        if (!this.quote.contactName?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre de contacto es obligatorio' });
            return;
        }

        try {
            const payload = {
                contactName: this.quote.contactName,
                contactEmail: this.quote.contactEmail,
                contactPhone: this.quote.contactPhone,
                clientId: this.quote.clientId || null,
                validUntil: this.quote.validUntil,
                billingType: this.quote.billingType || 'OFFICIAL_A',
                configurationId: this.quote.configurationId || null,
                discount: this.quote.discount || 0,
                notes: this.quote.notes,
                internalNotes: this.quote.internalNotes,
                items: this.quote.items
            };

            if (this.quote.id) {
                await this.quoteService.updateQuote(this.quote.id, payload);
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Cotización actualizada correctamente' });
            } else {
                await this.quoteService.createQuote(payload);
                this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Cotización creada correctamente' });
            }
            this.quoteDialog = false;
            this.loadQuotes();
        } catch (error: any) {
            console.error('Error saving quote:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.error?.message || 'Error guardando cotización' });
        }
    }

    // --- Status Actions ---

    async sendQuote(quote: Quote) {
        try {
            await this.quoteService.sendQuote(quote.id!);
            this.messageService.add({ severity: 'success', summary: 'Enviada', detail: 'Cotización enviada correctamente' });
            this.loadQuotes();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error enviando cotización' });
        }
    }

    async acceptQuote(quote: Quote) {
        try {
            await this.quoteService.acceptQuote(quote.id!);
            this.messageService.add({ severity: 'success', summary: 'Aceptada', detail: 'Cotización aceptada' });
            this.loadQuotes();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error aceptando cotización' });
        }
    }

    async rejectQuote(quote: Quote) {
        try {
            await this.quoteService.rejectQuote(quote.id!);
            this.messageService.add({ severity: 'warn', summary: 'Rechazada', detail: 'Cotización rechazada' });
            this.loadQuotes();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error rechazando cotización' });
        }
    }

    async convertToServices(quote: Quote) {
        try {
            await this.quoteService.convertToServices(quote.id!);
            this.messageService.add({ severity: 'success', summary: 'Convertida', detail: 'Cotización convertida a servicios' });
            this.loadQuotes();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error convirtiendo cotización' });
        }
    }

    async duplicateQuote(quote: Quote) {
        try {
            await this.quoteService.duplicateQuote(quote.id!);
            this.messageService.add({ severity: 'success', summary: 'Duplicada', detail: 'Cotización duplicada correctamente' });
            this.loadQuotes();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error duplicando cotización' });
        }
    }

    async deleteQuote(quote: Quote) {
        try {
            await this.quoteService.deleteQuote(quote.id!);
            this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Cotización eliminada' });
            this.loadQuotes();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error eliminando cotización' });
        }
    }

    async openPdf(quote: Quote) {
        if (!quote.id) return;
        try {
            const result: any = await this.quoteService.getQuotePdf(quote.id);
            if (result?.url) {
                window.open(result.url, '_blank');
            }
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error generando PDF' });
        }
    }

    // --- Item Management ---

    addItem() {
        this.quote.items = this.quote.items || [];
        this.quote.items.push(this.getEmptyItem());
    }

    removeItem(index: number) {
        if (this.quote.items && this.quote.items.length > 1) {
            this.quote.items.splice(index, 1);
            this.calculateTotals();
        }
    }

    // --- Client Selection ---

    onClientSelect(clientId: number | null) {
        if (clientId) {
            const client = this.clients.find(c => c.id === clientId);
            if (client) {
                this.quote.contactName = client.name || this.quote.contactName;
                this.quote.contactEmail = client.email || this.quote.contactEmail;
                this.quote.contactPhone = client.phone || this.quote.contactPhone;
            }
        }
    }

    onConfigSelect(configId: number | null) {
        if (configId) {
            const config = this.configs.find(c => c.id === configId);
            if (config && this.quote.items) {
                for (const item of this.quote.items) {
                    item.kmPrice = config.kmPrice;
                    item.hourPrice = config.hourPrice;
                    item.extraKmPrice = config.extraKmPrice;
                }
                this.calculateTotals();
            }
        }
    }

    // --- Calculations ---

    calculateItemTotal(item: QuoteItem): number {
        const kmTotal = (item.estimatedKm || 0) * (item.kmPrice || 0);
        const hourTotal = (item.estimatedHours || 0) * (item.hourPrice || 0);
        return kmTotal + hourTotal;
    }

    calculateTotals() {
        const items: QuoteItem[] = this.quote.items || [];
        const subtotal = items.reduce((sum: number, item: QuoteItem) => sum + this.calculateItemTotal(item), 0);
        const discountPercent = this.quote.discount || 0;
        const discountAmount = subtotal * (discountPercent / 100);
        const afterDiscount = subtotal - discountAmount;
        const taxRate = this.quote.billingType === 'OFFICIAL_A' ? 0.21 : 0;
        const tax = afterDiscount * taxRate;
        const total = afterDiscount + tax;

        this.totals = {
            subtotal,
            discount: discountAmount,
            tax,
            total
        };
    }

    // --- Formatting & Labels ---

    formatCurrency(value: number): string {
        return this.currencyFormatter.format(value);
    }

    getStatusLabel(status: string | undefined): string {
        const labels: Record<string, string> = {
            'DRAFT': 'Borrador',
            'SENT': 'Enviada',
            'ACCEPTED': 'Aceptada',
            'REJECTED': 'Rechazada',
            'EXPIRED': 'Vencida',
            'CONVERTED': 'Convertida'
        };
        return labels[status || ''] || status || '';
    }

    getStatusSeverity(status: string | undefined): 'secondary' | 'info' | 'success' | 'danger' | 'warn' | 'contrast' | undefined {
        const severities: Record<string, 'secondary' | 'info' | 'success' | 'danger' | 'warn' | 'contrast'> = {
            'DRAFT': 'secondary',
            'SENT': 'info',
            'ACCEPTED': 'success',
            'REJECTED': 'danger',
            'EXPIRED': 'warn',
            'CONVERTED': 'contrast'
        };
        return severities[status || ''] || undefined;
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { HelpButtonComponent } from '../../shared/help-button.component';
import { QuoteService, QuoteTemplate } from '../../service/quote.service';
import { ClientService, Client } from '../../service/client.service';
import { ConfigurationService, SystemConfiguration } from '../../service/configuration.service';

@Component({
    selector: 'app-quote-templates',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="flex items-center gap-2 font-semibold text-xl mb-4">Plantillas de Cotización <app-help-button pageKey="quote-templates" /></div>
            <p-table #dt1 [value]="templates" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true" [globalFilterFields]="['name', 'origin', 'destination', 'serviceType']">
                <ng-template pTemplate="caption">
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold">Listado de Plantillas</span>
                        <div class="flex gap-2">
                            <p-button label="Nueva Plantilla" icon="pi pi-plus" (click)="openNew()" />
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="dt1.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." />
                            </p-iconfield>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="header">
                    <tr>
                        <th pSortableColumn="name">Nombre <p-sortIcon field="name" /></th>
                        <th pSortableColumn="serviceType">Tipo <p-sortIcon field="serviceType" /></th>
                        <th>Ruta</th>
                        <th pSortableColumn="estimatedKm">KM Est. <p-sortIcon field="estimatedKm" /></th>
                        <th pSortableColumn="kmPrice">Precio/KM <p-sortIcon field="kmPrice" /></th>
                        <th pSortableColumn="isFavorite">Favorita <p-sortIcon field="isFavorite" /></th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-t>
                    <tr>
                        <td>{{ t.name }}</td>
                        <td>{{ getServiceTypeLabel(t.serviceType) }}</td>
                        <td>{{ t.origin && t.destination ? t.origin + ' → ' + t.destination : t.origin || t.destination || '-' }}</td>
                        <td>{{ t.estimatedKm }}</td>
                        <td>{{ t.kmPrice | currency:'USD' }}</td>
                        <td class="text-center">
                            <i [class]="t.isFavorite ? 'pi pi-star-fill text-yellow-500' : 'pi pi-star text-gray-400'"></i>
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="editTemplate(t)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteTemplate(t)" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="templateDialog" [style]="{ width: '650px' }" header="Detalles de Plantilla" [modal]="true" [maximizable]="true" styleClass="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="name">Nombre</label>
                            <input type="text" pInputText id="name" [(ngModel)]="template.name" required autofocus />
                            <small class="p-error" *ngIf="submitted && !template.name">El nombre es obligatorio.</small>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="clientId">Cliente</label>
                                <p-select id="clientId" [(ngModel)]="template.clientId" [options]="clients" optionLabel="name" optionValue="id" placeholder="Seleccionar cliente" [showClear]="true"></p-select>
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="serviceType">Tipo de Servicio</label>
                                <p-select id="serviceType" [(ngModel)]="template.serviceType" [options]="serviceTypes" optionLabel="label" optionValue="value" placeholder="Seleccionar tipo"></p-select>
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="origin">Origen</label>
                                <input type="text" pInputText id="origin" [(ngModel)]="template.origin" />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="destination">Destino</label>
                                <input type="text" pInputText id="destination" [(ngModel)]="template.destination" />
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="estimatedKm">KM Estimados</label>
                                <p-inputNumber id="estimatedKm" [(ngModel)]="template.estimatedKm"></p-inputNumber>
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="estimatedHours">Horas Estimadas</label>
                                <p-inputNumber id="estimatedHours" [(ngModel)]="template.estimatedHours"></p-inputNumber>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>Cargar precios desde tarifa</label>
                            <p-select [options]="configs" [(ngModel)]="selectedConfigId" optionLabel="name" optionValue="id" placeholder="Seleccionar tarifa..." [showClear]="true" appendTo="body" styleClass="w-full" (onChange)="onConfigSelect($event.value)"></p-select>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="kmPrice">Precio/KM</label>
                                <p-inputNumber id="kmPrice" [(ngModel)]="template.kmPrice" mode="currency" currency="USD" locale="en-US"></p-inputNumber>
                            </div>
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="hourPrice">Precio/Hora</label>
                                <p-inputNumber id="hourPrice" [(ngModel)]="template.hourPrice" mode="currency" currency="USD" locale="en-US"></p-inputNumber>
                            </div>
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="extraKmPrice">Precio KM Extra</label>
                                <p-inputNumber id="extraKmPrice" [(ngModel)]="template.extraKmPrice" mode="currency" currency="USD" locale="en-US"></p-inputNumber>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="notes">Notas</label>
                            <textarea id="notes" pInputText [(ngModel)]="template.notes" rows="3"></textarea>
                        </div>
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="template.isFavorite" [binary]="true" inputId="isFavorite"></p-checkbox>
                            <label for="isFavorite">Favorita</label>
                        </div>
                    </div>
                </ng-template>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="templateDialog = false" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveTemplate()" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, FormsModule, SelectModule, InputNumberModule, ToastModule, CheckboxModule, TagModule, HelpButtonComponent],
    providers: [MessageService]
})
export class QuoteTemplates implements OnInit {
    templates: QuoteTemplate[] = [];
    clients: Client[] = [];
    configs: SystemConfiguration[] = [];
    selectedConfigId: number | null = null;
    template: QuoteTemplate = { name: '', serviceType: 'SERVICE', estimatedKm: 0, estimatedHours: 0, kmPrice: 0, hourPrice: 0, extraKmPrice: 0, isFavorite: false };
    templateDialog: boolean = false;
    loading: boolean = true;
    submitted: boolean = false;

    serviceTypes = [
        { label: 'Servicio', value: 'SERVICE' },
        { label: 'Mensajería', value: 'MESSAGING' },
        { label: 'Conducción', value: 'DRIVING' },
        { label: 'Media Rueda', value: 'HALF_ROUND' },
        { label: 'Otro', value: 'OTHER' }
    ];

    constructor(private quoteService: QuoteService, private clientService: ClientService, private messageService: MessageService, private configService: ConfigurationService) {}

    ngOnInit() {
        this.loadTemplates();
        this.loadClients();
        this.loadConfigs();
    }

    async loadTemplates() {
        this.loading = true;
        try {
            this.templates = await this.quoteService.getTemplates();
        } catch (error) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las plantillas' });
        } finally {
            this.loading = false;
        }
    }

    async loadClients() {
        try {
            this.clients = await this.clientService.getClients();
        } catch (error) {
            console.error(error);
        }
    }

    loadConfigs() {
        this.configService.getConfigs().subscribe({
            next: (data) => this.configs = data,
            error: () => {}
        });
    }

    onConfigSelect(configId: number | null) {
        if (configId) {
            const config = this.configs.find(c => c.id === configId);
            if (config) {
                this.template.kmPrice = config.kmPrice;
                this.template.hourPrice = config.hourPrice;
                this.template.extraKmPrice = config.extraKmPrice;
            }
        }
    }

    getServiceTypeLabel(value: string): string {
        return this.serviceTypes.find(t => t.value === value)?.label || value;
    }

    openNew() {
        this.template = { name: '', serviceType: 'SERVICE', estimatedKm: 0, estimatedHours: 0, kmPrice: 0, hourPrice: 0, extraKmPrice: 0, isFavorite: false };
        this.selectedConfigId = null;
        this.submitted = false;
        this.templateDialog = true;
    }

    editTemplate(t: QuoteTemplate) {
        this.template = { ...t };
        this.selectedConfigId = null;
        this.templateDialog = true;
    }

    async saveTemplate() {
        this.submitted = true;

        if (this.template.name?.trim()) {
            try {
                if (this.template.id) {
                    await this.quoteService.updateTemplate(this.template.id, this.template);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Plantilla actualizada', life: 3000 });
                } else {
                    await this.quoteService.createTemplate(this.template);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Plantilla creada', life: 3000 });
                }
                this.templateDialog = false;
                this.template = { name: '', serviceType: 'SERVICE', estimatedKm: 0, estimatedHours: 0, kmPrice: 0, hourPrice: 0, extraKmPrice: 0, isFavorite: false };
                this.loadTemplates();
            } catch (error) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la plantilla' });
            }
        }
    }

    async deleteTemplate(t: QuoteTemplate) {
        if (!t.id) return;
        if (confirm('¿Está seguro de que desea eliminar esta plantilla?')) {
            try {
                await this.quoteService.deleteTemplate(t.id);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Plantilla eliminada', life: 3000 });
                this.loadTemplates();
            } catch (error) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la plantilla' });
            }
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
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
import { Service, ServiceService } from '../../service/service.service';
import { ConfigurationService, SystemConfiguration } from '../../service/configuration.service';
import { Client, ClientService } from '../../service/client.service';
import { Driver, DriverService } from '../../service/driver.service';
import { Vehicle, VehicleService } from '../../service/vehicle.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-service-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="font-semibold text-xl mb-4">Servicios (Viajes)</div>

            <!-- Acciones Masivas -->
            <div *ngIf="selectedServices.length > 0" class="flex gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 items-center animate-fadein">
                <span class="font-bold text-blue-700 dark:text-blue-300">{{selectedServices.length}} seleccionados</span>
                <p-divider layout="vertical"></p-divider>
                <p-button label="Ver Resumen / Facturar" icon="pi pi-receipt" severity="success" [text]="true" (click)="openSummary()"></p-button>
            </div>

            <p-table #dt1 [value]="services" [(selection)]="selectedServices" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true"
                [globalFilterFields]="['origin', 'destination', 'status']" styleClass="p-datatable-sm" responsiveLayout="stack" breakpoint="960px">
                <ng-template pTemplate="caption">
                    <div class="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                        <span class="text-xl font-bold">{{ getHeaderTitle() }}</span>
                        <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            <p-button label="Nuevo Servicio" icon="pi pi-plus" (click)="openNew()" styleClass="w-full md:w-auto" />
                            <p-button label="Configuración" icon="pi pi-cog" severity="secondary" (click)="openConfig()" styleClass="w-full md:w-auto" />
                            <p-iconfield styleClass="w-full md:w-auto">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="dt1.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." class="w-full md:w-auto" />
                            </p-iconfield>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 4rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
                        <th pSortableColumn="startDate">Inicio <p-sortIcon field="startDate" /></th>
                        <th pSortableColumn="serviceType">Tipo <p-sortIcon field="serviceType" /></th>
                        <th pSortableColumn="origin">Origen <p-sortIcon field="origin" /></th>
                        <th pSortableColumn="destination">Destino <p-sortIcon field="destination" /></th>
                        <th>Detalles</th>
                        <th>Clientes</th>
                        <th>Choferes</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-service>
                    <tr>
                        <td><p-tableCheckbox [value]="service"></p-tableCheckbox></td>
                        <td>{{ service.startDate | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td><p-tag [value]="getServiceTypeLabel(service.serviceType)" severity="info"></p-tag></td>
                        <td>{{ service.origin }}</td>
                        <td>{{ service.destination }}</td>
                        <td>{{ service.details }}</td>
                        <td>
                            <span *ngFor="let c of service.clients; let last=last">{{c.name}}{{!last ? ', ' : ''}}</span>
                        </td>
                        <td>
                            <span *ngFor="let d of service.drivers; let last=last">{{d.name}}{{!last ? ', ' : ''}}</span>
                        </td>
                        <td><p-tag [value]="getMmStatusLabel(service.status)" [severity]="getSeverity(service.status)" /></td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="editService(service)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteService(service)" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="serviceDialog" [style]="{ width: '900px', 'max-width': '95vw' }" header="Detalles del Servicio" [modal]="true" styleClass="p-fluid" [maximizable]="true" [focusOnShow]="false">
                <ng-template pTemplate="content">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <!-- Columna Izquierda: General y Trayecto -->
                        <div class="flex flex-col gap-4">
                            <p-panel header="Información General" styleClass="mb-3">
                                <div class="flex flex-col gap-4">
                                    <div class="flex gap-4">
                                        <div class="flex flex-col gap-2 flex-1">
                                            <label for="startDate">Fecha Inicio</label>
                                            <p-datepicker [(ngModel)]="service.startDate" [showTime]="true" dateFormat="dd/mm/yy" appendTo="body" styleClass="w-full"></p-datepicker>
                                        </div>
                                        <div class="flex flex-col gap-2 flex-1">
                                            <label for="endDate">Fecha Fin</label>
                                            <p-datepicker [(ngModel)]="service.endDate" [showTime]="true" dateFormat="dd/mm/yy" appendTo="body" styleClass="w-full"></p-datepicker>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label for="serviceType">Tipo de Servicio</label>
                                        <p-select [options]="serviceTypes" [(ngModel)]="service.serviceType" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full"></p-select>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label for="status">Estado</label>
                                        <p-select [options]="statuses" [(ngModel)]="service.status" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full"></p-select>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label for="billingType">Tipo de Facturación</label>
                                        <p-select [options]="billingTypes" [(ngModel)]="service.billingType" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full"></p-select>
                                    </div>
                                </div>
                            </p-panel>

                            <p-panel header="Trayecto">
                                <div class="flex flex-col gap-4">
                                    <div class="flex flex-col gap-2">
                                        <label for="origin">Origen</label>
                                        <input type="text" pInputText id="origin" [(ngModel)]="service.origin" class="w-full" />
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label for="destination">Destino</label>
                                        <input type="text" pInputText id="destination" [(ngModel)]="service.destination" class="w-full" />
                                    </div>
                                    <div class="grid grid-cols-12 gap-4">
                                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                            <label for="kmTraveled">KM Recorridos</label>
                                            <p-inputNumber [(ngModel)]="service.kmTraveled" mode="decimal" [minFractionDigits]="2" styleClass="w-full"></p-inputNumber>
                                        </div>
                                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                            <label for="waitingHours">Horas de Espera</label>
                                            <p-inputNumber [(ngModel)]="service.waitingHours" mode="decimal" [minFractionDigits]="2" styleClass="w-full"></p-inputNumber>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label for="details">Detalles Adicionales</label>
                                        <textarea pTextarea [(ngModel)]="service.details" rows="3" class="w-full"></textarea>
                                    </div>
                                </div>
                            </p-panel>
                        </div>

                        <!-- Columna Derecha: Relaciones y Costos -->
                        <div class="flex flex-col gap-4">
                            <p-panel header="Asignaciones" styleClass="mb-3">
                                <div class="flex flex-col gap-4">
                                    <div class="flex flex-col gap-2">
                                        <label>Clientes</label>
                                        <p-multiSelect [options]="clientsList" [(ngModel)]="service.clientIds" optionLabel="name" optionValue="id" placeholder="Seleccionar Clientes" display="chip" appendTo="body" styleClass="w-full"></p-multiSelect>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label>Choferes</label>
                                        <p-multiSelect [options]="driversList" [(ngModel)]="service.driverIds" optionLabel="name" optionValue="id" placeholder="Seleccionar Choferes" display="chip" appendTo="body" styleClass="w-full"></p-multiSelect>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label>Autos</label>
                                        <p-multiSelect [options]="vehiclesList" [(ngModel)]="service.vehicleIds" optionLabel="plate" optionValue="id" placeholder="Seleccionar Autos" display="chip" appendTo="body" styleClass="w-full">
                                            <ng-template let-car pTemplate="item">
                                                <div class="flex align-items-center gap-2">
                                                    <span>{{ car.plate }} - {{ car.model }}</span>
                                                </div>
                                            </ng-template>
                                        </p-multiSelect>
                                    </div>
                                </div>
                            </p-panel>

                            <p-panel header="Precios (Opcional - Sobrescribe defaults)">
                                <div class="flex flex-col gap-4">
                                    <div class="grid grid-cols-12 gap-4">
                                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                            <label>Precio KM (Cliente)</label>
                                            <p-inputNumber [(ngModel)]="service.kmPriceOverride" mode="currency" currency="USD" locale="en-US" styleClass="w-full"></p-inputNumber>
                                        </div>
                                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                            <label>Precio Hora (Cliente)</label>
                                            <p-inputNumber [(ngModel)]="service.hourPriceOverride" mode="currency" currency="USD" locale="en-US" styleClass="w-full"></p-inputNumber>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-12 gap-4">
                                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                            <label>Precio KM (Chofer)</label>
                                            <p-inputNumber [(ngModel)]="service.driverKmPriceOverride" mode="currency" currency="USD" locale="en-US" styleClass="w-full"></p-inputNumber>
                                        </div>
                                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                            <label>Precio Hora (Chofer)</label>
                                            <p-inputNumber [(ngModel)]="service.driverHourPriceOverride" mode="currency" currency="USD" locale="en-US" styleClass="w-full"></p-inputNumber>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label>Descuento (%)</label>
                                        <p-inputNumber [(ngModel)]="service.discountPercentage" suffix="%" styleClass="w-full"></p-inputNumber>
                                    </div>
                                </div>
                            </p-panel>

                            <!-- Totales Cards -->
                            <div class="grid grid-cols-2 gap-4">
                                <!-- Card Cliente -->
                                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm flex flex-col items-center justify-center">
                                    <span class="text-blue-600 dark:text-blue-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Cliente</span>
                                    <span class="text-2xl font-bold text-gray-800 dark:text-white">{{ calculateClientTotal | currency:'USD' }}</span>
                                    <span *ngIf="service.discountPercentage" class="text-xs text-green-600 mt-1">Desc. {{service.discountPercentage}}% aplicado</span>
                                </div>

                                <!-- Card Chofer -->
                                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800 shadow-sm flex flex-col items-center justify-center">
                                    <span class="text-green-600 dark:text-green-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Chofer</span>
                                    <span class="text-2xl font-bold text-gray-800 dark:text-white">{{ calculateDriverTotal | currency:'USD' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sección de Gastos -->
                    <p-divider align="left"><b>Gastos Extra</b></p-divider>
                    <div class="flex flex-col gap-2">
                         <div *ngFor="let expense of service.expenses; let i = index" class="grid grid-cols-12 gap-2 items-end">
                            <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                                <label *ngIf="i===0">Tipo</label>
                                <p-select [options]="expenseTypes" [(ngModel)]="expense.type" appendTo="body" styleClass="w-full"></p-select>
                            </div>
                            <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                                <label *ngIf="i===0">Monto</label>
                                <p-inputNumber [(ngModel)]="expense.amount" mode="currency" currency="USD" locale="en-US" styleClass="w-full"></p-inputNumber>
                            </div>
                            <div class="col-span-12 md:col-span-5 flex flex-col gap-2">
                                <label *ngIf="i===0">Descripción</label>
                                <input type="text" pInputText [(ngModel)]="expense.description" class="w-full" />
                            </div>
                            <div class="col-span-12 md:col-span-1 flex justify-center pb-1">
                                <p-button icon="pi pi-trash" severity="danger" [text]="true" (click)="removeExpense(i)"></p-button>
                            </div>
                         </div>
                         <div class="mt-2">
                             <p-button label="Agregar Gasto" icon="pi pi-plus" [text]="true" (click)="addExpense()"></p-button>
                         </div>
                    </div>

                </ng-template>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveService()" />
                </ng-template>
            </p-dialog>

            <p-dialog [(visible)]="configDialog" [style]="{ width: '450px' }" header="Configuración General" [modal]="true" styleClass="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                             <label class="font-bold">Precios Cliente (Default)</label>
                             <div class="grid grid-cols-2 gap-4">
                                <div class="flex flex-col gap-2">
                                    <label>Precio KM</label>
                                    <p-inputNumber [(ngModel)]="config.kmPrice" mode="currency" currency="USD" locale="en-US" styleClass="w-full"></p-inputNumber>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <label>Precio Hora</label>
                                    <p-inputNumber [(ngModel)]="config.hourPrice" mode="currency" currency="USD" locale="en-US" styleClass="w-full"></p-inputNumber>
                                </div>
                             </div>
                        </div>
                         <p-divider></p-divider>
                         <div class="flex flex-col gap-2">
                             <label class="font-bold">Precios Chofer (Default)</label>
                             <div class="grid grid-cols-2 gap-4">
                                <div class="flex flex-col gap-2">
                                    <label>Precio KM</label>
                                    <p-inputNumber [(ngModel)]="config.driverKmPrice" mode="currency" currency="USD" locale="en-US" styleClass="w-full"></p-inputNumber>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <label>Precio Hora</label>
                                    <p-inputNumber [(ngModel)]="config.driverHourPrice" mode="currency" currency="USD" locale="en-US" styleClass="w-full"></p-inputNumber>
                                </div>
                             </div>
                        </div>
                    </div>
                </ng-template>
                 <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="configDialog = false" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveConfig()" />
                </ng-template>
            </p-dialog>
            <p-dialog [(visible)]="summaryDialog" [style]="{ width: '500px' }" header="Resumen de Servicios" [modal]="true" styleClass="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-surface-800 rounded-lg">
                            <span class="text-sm text-gray-500">Servicios Seleccionados ({{selectedServices.length}})</span>

                            <!-- Lista Resumen -->
                            <div class="max-h-80 overflow-y-auto flex flex-col gap-2 mt-2">
                                <div *ngFor="let s of selectedServices" class="flex flex-col border-b pb-2 gap-1 px-1">
                                    <div class="flex justify-between items-start">
                                        <div class="flex flex-col">
                                            <span class="font-bold text-sm text-gray-800 dark:text-white">{{ s.startDate | date:'dd/MM HH:mm' }} - {{getServiceTypeLabel(s.serviceType)}}</span>
                                            <span class="text-xs text-gray-600 dark:text-gray-300">{{ s.origin }} <i class="pi pi-arrow-right text-[10px]"></i> {{ s.destination }}</span>
                                        </div>
                                        <div class="flex flex-col items-end">
                                            <!-- Fallback logic for price handling -->
                                            <div *ngIf="s.discountPercentage; else noDiscount">
                                                 <span class="text-xs text-gray-400 line-through mr-1">{{ ((s.total_amount || s.totalAmount || 0) + getDiscountValue(s)) | currency:'USD' }}</span>
                                                 <span class="font-bold text-gray-800 dark:text-white">{{ (s.total_amount || s.totalAmount || 0) | currency:'USD' }}</span>
                                                 <div class="flex justify-end mt-1">
                                                     <p-tag severity="success" styleClass="text-[10px] py-0 px-1">
                                                         <span class="flex items-center gap-1">
                                                             <i class="pi pi-tag text-[10px]"></i>
                                                             <span>-{{s.discountPercentage}}% ({{getDiscountValue(s) | currency:'USD'}})</span>
                                                         </span>
                                                     </p-tag>
                                                 </div>
                                            </div>
                                            <ng-template #noDiscount>
                                                <span class="font-bold text-gray-800 dark:text-white">{{ (s.total_amount || s.totalAmount || 0) | currency:'USD' }}</span>
                                            </ng-template>
                                        </div>
                                    </div>
                                    <span *ngIf="s.details" class="text-xs text-gray-500 italic px-2 border-l-2 border-gray-300">{{ s.details }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="summaryConfig.addVat" [binary]="true" inputId="summaryVat" (onChange)="calculateSummaryTotal()"></p-checkbox>
                            <label for="summaryVat">Adicionar 21% IVA</label>
                        </div>

                        <p-divider></p-divider>

                        <div class="flex flex-col gap-2">
                             <div class="flex justify-between">
                                 <span>Subtotal:</span>
                                 <span>{{ summaryConfig.subtotal | currency:'USD' }}</span>
                             </div>
                             <div class="flex justify-between text-blue-600" *ngIf="summaryConfig.addVat">
                                 <span>IVA (21%):</span>
                                 <span>+ {{ summaryConfig.tax | currency:'USD' }}</span>
                             </div>
                             <div class="flex justify-between font-bold text-xl mt-2 p-2 bg-gray-100 dark:bg-surface-700 rounded">
                                 <span>Total:</span>
                                 <span>{{ summaryConfig.total | currency:'USD' }}</span>
                             </div>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="footer">
                    <p-button label="Cerrar" icon="pi pi-times" [text]="true" (click)="summaryDialog = false" />
                    <!-- Placeholder for future action -->
                    <!-- <p-button label="Confirmar" icon="pi pi-check" (click)="confirmSummary()" /> -->
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, DialogModule, FormsModule, SelectModule, MultiSelectModule, InputNumberModule, TextareaModule, DatePickerModule, ToastModule, PanelModule, DividerModule, CheckboxModule],

    providers: [MessageService, ServiceService, ClientService, DriverService, VehicleService, ConfigurationService]
})
export class ServiceList implements OnInit {
    services: Service[] = [];
    service: any = this.getEmptyService();

    // Lists for dropdowns
    clientsList: Client[] = [];
    driversList: Driver[] = [];
    vehiclesList: Vehicle[] = [];

    loading: boolean = true;
    serviceDialog: boolean = false;
    configDialog: boolean = false;
    config: SystemConfiguration = { id: 0, kmPrice: 0, hourPrice: 0, driverKmPrice: 0, driverHourPrice: 0 };
    submitted: boolean = false;
    activeStatusFilter: string | undefined = undefined;

    statuses = [
        { label: 'Creado', value: 'CREATED' },
        { label: 'Pendiente', value: 'PENDING' },
        { label: 'Detalles Enviados', value: 'DETAILS_SENT' },
        { label: 'Verificado', value: 'VERIFIED' },
        { label: 'Facturado', value: 'INVOICED' },
        { label: 'Factura Enviada', value: 'INVOICE_SENT' },
        { label: 'Pagado', value: 'PAID' },
        { label: 'Cancelado', value: 'CANCELLED' }
    ];

    billingTypes = [
        { label: 'Factura A/B', value: 'OFFICIAL_A' },
        { label: 'Monotributo', value: 'MONOTRIBUTO' },
        { label: 'Informal', value: 'INFORMAL' }
    ];

    expenseTypes = [
         { label: 'Combustible', value: 'FUEL' },
         { label: 'Peaje', value: 'TOLL' },
         { label: 'Lavadero', value: 'WASH' },
         { label: 'Comida', value: 'SNACK' },
         { label: 'Otro', value: 'OTHER' }
    ];

    serviceTypes = [
        { label: 'Servicio', value: 'SERVICE' },
        { label: 'Mensajeria', value: 'MESSAGING' },
        { label: 'Conducción', value: 'DRIVING' }
    ];

    constructor(
        private serviceService: ServiceService,
        private clientService: ClientService,
        private driverService: DriverService,
        private vehicleService: VehicleService,
        private configService: ConfigurationService,
        private messageService: MessageService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const statusParam = params.get('status');
            this.handleStatusChange(statusParam);
        });
    }

    handleStatusChange(status: string | null) {
        const statusMap: any = {
            'created': 'CREATED',
            'pending': 'PENDING',
            'details_sent': 'DETAILS_SENT',
            'verified': 'VERIFIED',
            'invoiced': 'INVOICED',
            'invoice_sent': 'INVOICE_SENT',
            'paid': 'PAID',
            'cancelled': 'CANCELLED',
            'all': undefined
        };
        this.activeStatusFilter = statusMap[status || 'all'];
        this.loadAllData();
    }

    getHeaderTitle() {
        const titles: any = {
            'CREATED': 'Servicios Creados',
            'PENDING': 'Servicios Pendientes',
            'DETAILS_SENT': 'Detalles Enviados',
            'VERIFIED': 'Servicios Verificados',
            'INVOICED': 'Servicios Facturados',
            'INVOICE_SENT': 'Factura Enviada',
            'PAID': 'Servicios Pagados',
            'CANCELLED': 'Servicios Cancelados'
        };
        return titles[this.activeStatusFilter || ''] || 'Todos los Servicios';
    }

    async loadAllData() {
        this.loading = true;
        try {
            const filters: any = {};
            if (this.activeStatusFilter) {
                filters.status = this.activeStatusFilter;
            }

            const [services, clients, drivers, vehicles] = await Promise.all([
                this.serviceService.getServices(filters),
                this.clientService.getClients(),
                this.driverService.getDrivers(),
                this.vehicleService.getVehicles()
            ]);

            this.services = services;
            this.clientsList = clients;
            this.driversList = drivers;
            this.vehiclesList = vehicles;

        } catch (error) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error cargando datos iniciales' });
        } finally {
            this.loading = false;
        }
    }

    openNew() {
        this.service = this.getEmptyService();
        this.submitted = false;

        // Load config defaults
        this.configService.getConfig().subscribe({
            next: (config) => {
                this.service.kmPriceOverride = config.kmPrice;
                this.service.hourPriceOverride = config.hourPrice;
                this.service.driverKmPriceOverride = config.driverKmPrice;
                this.service.driverHourPriceOverride = config.driverHourPrice;
                this.serviceDialog = true;
            },
            error: () => {
                this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo cargar la configuración default'});
                this.serviceDialog = true; // Open anyway
            }
        });
    }

    openConfig() {
        this.configService.getConfig().subscribe({
            next: (config) => {
                this.config = config;
                this.configDialog = true;
            },
            error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error cargando configuración'})
        });
    }

    saveConfig() {
        this.configService.updateConfig(this.config).subscribe({
            next: (newConfig) => {
                this.config = newConfig;
                this.messageService.add({severity:'success', summary:'Actualizado', detail:'Configuración global actualizada'});
                this.configDialog = false;
            },
            error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error guardando configuración'})
        });
    }

    getEmptyService() {
        return {
            startDate: new Date(),
            endDate: null,
            serviceType: 'SERVICE',
            origin: '',
            destination: '',
            status: 'CREATED',
            billingType: 'INFORMAL',
            clientIds: [],
            driverIds: [],
            vehicleIds: [],
            expenses: []
        };
    }

    editService(service: any) {
        // Prepare service object for editing (map relations to IDs if needed)
        // Since backend returns arrays of objects for relations, we might need to exact IDs
        // However, Prisma usually sends full objects if included.
        // Let's assume input needs IDs.

        this.service = {
            ...service,
            startDate: new Date(service.startDate),
            endDate: service.endDate ? new Date(service.endDate) : null,
            serviceType: service.serviceType || 'SERVICE',
            // Map snake_case from backend to camelCase for frontend form
            kmTraveled: service.km_traveled,
            waitingHours: service.waiting_hours,
            billingType: service.billing_type,

            // Map Snapshots to Overrides (so they appear as the current values being edited)
            kmPriceOverride: service.km_price_snapshot,
            hourPriceOverride: service.hour_price_snapshot,
            driverKmPriceOverride: service.driver_km_price_snapshot,
            driverHourPriceOverride: service.driver_hour_price_snapshot,

            discountPercentage: service.discount_percentage,

            clientIds: service.clients ? service.clients.map((c: any) => c.id) : [],
            driverIds: service.drivers ? service.drivers.map((d: any) => d.id) : [],
            vehicleIds: service.vehicles ? service.vehicles.map((v: any) => v.id) : [],
            expenses: service.expenses || []
        };
        this.serviceDialog = true;
    }

    hideDialog() {
        this.serviceDialog = false;
        this.submitted = false;
    }

    async saveService() {
        this.submitted = true;

        if (this.service.origin) { // Basic validation
            try {
                // Ensure proper formatting for dates and numbers if needed
                if (this.service.id) {
                    await this.serviceService.updateService(this.service.id, this.service);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Servicio actualizado', life: 3000 });
                } else {
                    await this.serviceService.createService(this.service);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Servicio creado', life: 3000 });
                }
                this.serviceDialog = false;
                this.loadAllData(); // Reload to get fresh data with relations
            } catch (error) {
                console.error(error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el servicio' });
            }
        }
    }

    deleteService(service: any) {
         if (!service.id) return;
         if (confirm('¿Eliminar servicio?')) {
             this.serviceService.deleteService(service.id).then(() => {
                 this.messageService.add({severity: 'success', summary: 'Eliminado', detail: 'Servicio eliminado'});
                 this.loadAllData();
             });
         }
    }

    addExpense() {
        if (!this.service.expenses) this.service.expenses = [];
        this.service.expenses.push({ type: 'OTHER', amount: 0, description: '' });
    }

    removeExpense(index: number) {
        this.service.expenses.splice(index, 1);
    }

    getSeverity(status: string): any {
        switch (status) {
            case 'CREATED': return 'secondary';
            case 'PENDING': return 'warn';
            case 'DETAILS_SENT': return 'info';
            case 'VERIFIED': return 'success';
            case 'INVOICED': return 'warning';
            case 'INVOICE_SENT': return 'primary';
            case 'PAID': return 'success';
            case 'CANCELLED': return 'danger';
            default: return 'contrast';
        }
    }

    getMmStatusLabel(status: string) {
        const found = this.statuses.find(s => s.value === status);
        return found ? found.label : status;
    }

    getServiceTypeLabel(type: string) {
        const found = this.serviceTypes.find(t => t.value === type);
        return found ? found.label : type;
    }

    get calculateClientTotal(): number {
        const km = this.service.kmTraveled || 0;
        const hours = this.service.waitingHours || 0;
        const kmPrice = this.service.kmPriceOverride || 0;
        const hourPrice = this.service.hourPriceOverride || 0;

        const subtotal = (km * kmPrice) + (hours * hourPrice);

        let discount = 0;
        if (this.service.discountPercentage) {
            discount = subtotal * (this.service.discountPercentage / 100);
        }

        return subtotal - discount;
    }

    get calculateDriverTotal(): number {
        const km = this.service.kmTraveled || 0;
        const hours = this.service.waitingHours || 0;
        const kmPrice = this.service.driverKmPriceOverride || 0;
        const hourPrice = this.service.driverHourPriceOverride || 0;

        return (km * kmPrice) + (hours * hourPrice);
    }

    // Summary View State
    selectedServices: Service[] = [];
    summaryDialog: boolean = false;
    summaryConfig: any = { addVat: false, subtotal: 0, tax: 0, total: 0 };

    openSummary() {
        if (!this.selectedServices.length) return;
        this.summaryConfig.addVat = false;
        this.calculateSummaryTotal();
        this.summaryDialog = true;
    }

    calculateSummaryTotal() {
        // Handle snake_case vs camelCase if necessary (matching what we did before)
        this.summaryConfig.subtotal = this.selectedServices.reduce((sum, s: any) => sum + Number(s.total_amount || s.totalAmount || 0), 0);
        this.summaryConfig.tax = this.summaryConfig.addVat ? this.summaryConfig.subtotal * 0.21 : 0;
        this.summaryConfig.total = this.summaryConfig.subtotal + this.summaryConfig.tax;
    }

    getDiscountValue(service: any): number {
        if (!service.discountPercentage) return 0;
        const total = Number(service.total_amount || service.totalAmount || 0);
        // Original Price = Total / (1 - pct/100)
        // Discount = Original - Total
        // Math: D = T / (1 - rate) - T
        const rate = service.discountPercentage / 100;
        const originalPrice = total / (1 - rate);
        return originalPrice - total;
    }
}

import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../service/invoice.service';
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
import { PrimeNG } from 'primeng/config';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-service-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="font-semibold text-xl mb-4">Servicios (Viajes)</div>

            <!-- Acciones Masivas -->
            <!-- Acciones Masivas -->
            @if (activeStatusFilter === 'PENDING_DETAILS' || activeStatusFilter === 'PENDING_INVOICE') {
                <div class="flex gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 items-center animate-fadein">
                    @if (selectedServices.length > 0) {
                        <span class="font-bold text-blue-700 dark:text-blue-300">{{selectedServices.length}} seleccionados</span>
                        <p-divider layout="vertical"></p-divider>
                    }

                    <!-- PENDING_DETAILS: Summary Only -->
                    @if (activeStatusFilter === 'PENDING_DETAILS' && selectedServices.length > 0) {
                        <p-button label="Ver Resumen" icon="pi pi-receipt" severity="success" [text]="true" (click)="openSummary()"></p-button>
                    }

                     <!-- PENDING_INVOICE: Billing (Always visible) -->
                    @if (activeStatusFilter === 'PENDING_INVOICE') {
                         <p-button label="Facturar" icon="pi pi-dollar" severity="help" [text]="true" (click)="openBilling()"></p-button>
                    }
                </div>
            }

            <p-table #dt1 [value]="services" [(selection)]="selectedServices" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true"
                [globalFilterFields]="['route', 'status', 'clientNames']" styleClass="p-datatable-sm" responsiveLayout="stack" breakpoint="960px">
                <ng-template pTemplate="caption">
                    <div class="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                        <div class="flex items-center gap-2">
                            <span class="text-xl font-bold">{{ getHeaderTitle() }}</span>
                            <p-button label="Limpiar Filtros" icon="pi pi-filter-slash" [outlined]="true" severity="secondary" size="small" (click)="clear(dt1)" />
                        </div>
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
                    <tr class="text-sm">
                        <th style="width: 3rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
                        <th pSortableColumn="startDate" style="min-width: 10rem">
                            <div class="flex items-center gap-2">
                                Inicio <p-sortIcon field="startDate" />
                                <p-columnFilter type="date" field="startDate" display="menu" [showAddButton]="false"></p-columnFilter>
                            </div>
                        </th>
                        <th pSortableColumn="serviceType" style="min-width: 8rem">Tipo <p-sortIcon field="serviceType" /></th>
                        <th pSortableColumn="route" style="min-width: 15rem">
                             <div class="flex items-center gap-2">
                                Trayecto <p-sortIcon field="route" />
                                <p-columnFilter type="text" field="route" display="menu" [showAddButton]="false"></p-columnFilter>
                            </div>
                        </th>
                        <th style="min-width: 10rem">Detalles</th>
                        <th pSortableColumn="clientNames" style="min-width: 10rem">
                             <div class="flex items-center gap-2">
                                Clientes <p-sortIcon field="clientNames" />
                                <p-columnFilter field="clientNames" matchMode="in" display="menu" [showMatchModes]="false" [showOperator]="false" [showAddButton]="false">
                                    <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                                        <p-multiSelect [ngModel]="value" [options]="clientFilterOptions" placeholder="Tipos" (onChange)="filter($event.value)" optionLabel="name" optionValue="value" appendTo="body" display="chip">
                                             <ng-template let-option pTemplate="item">
                                                <div class="inline-block vertical-align-middle">
                                                    <span>{{option.name}}</span>
                                                </div>
                                            </ng-template>
                                        </p-multiSelect>
                                    </ng-template>
                                </p-columnFilter>
                            </div>
                        </th>
                        <th pSortableColumn="driverNames" style="min-width: 10rem">
                            <div class="flex items-center gap-2">
                                Choferes <p-sortIcon field="driverNames" />
                                 <p-columnFilter field="driverNames" matchMode="in" display="menu" [showMatchModes]="false" [showOperator]="false" [showAddButton]="false">
                                    <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                                        <p-multiSelect [ngModel]="value" [options]="driverFilterOptions" placeholder="Tipos" (onChange)="filter($event.value)" optionLabel="name" optionValue="value" appendTo="body" display="chip">
                                             <ng-template let-option pTemplate="item">
                                                <div class="inline-block vertical-align-middle">
                                                    <span>{{option.name}}</span>
                                                </div>
                                            </ng-template>
                                        </p-multiSelect>
                                    </ng-template>
                                </p-columnFilter>
                            </div>
                        </th>
                        <th style="min-width: 10rem">
                            <div class="flex items-center gap-2">
                                Estado
                                <p-columnFilter field="status" matchMode="in" display="menu" [showMatchModes]="false" [showOperator]="false" [showAddButton]="false">
                                    <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                                        <p-multiSelect [ngModel]="value" [options]="statuses" placeholder="Todos" (onChange)="filter($event.value)" optionLabel="label" optionValue="value" appendTo="body">
                                            <ng-template let-option pTemplate="item">
                                                <div class="inline-block vertical-align-middle">
                                                    <p-tag [value]="option.label" [severity]="getSeverity(option.value)"></p-tag>
                                                </div>
                                            </ng-template>
                                        </p-multiSelect>
                                    </ng-template>
                                </p-columnFilter>
                            </div>
                        </th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-service>
                    <tr>
                        <td><p-tableCheckbox [value]="service"></p-tableCheckbox></td>
                        <td>{{ service.startDate | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td><p-tag [value]="getServiceTypeLabel(service.serviceType)" severity="info"></p-tag></td>
                        <td>{{ service.route }}</td>
                        <td>{{ service.details }}</td>
                        <td>
                            {{ service.clientNames }}
                        </td>
                        <td>
                            {{ service.driverNames }}
                        </td>
                        <td><p-tag [value]="getMmStatusLabel(service.status)" [severity]="getSeverity(service.status)" /></td>
                        <td>
                            <!-- View Report -->
                            <p-button *ngIf="service.serviceGroup"
                                      icon="pi pi-file-pdf"
                                      [rounded]="true"
                                      [text]="true"
                                      severity="info"
                                      (click)="openReport(service)"
                                      pTooltip="Ver Reporte Generado"
                                      tooltipPosition="left">
                            </p-button>

                            <p-button *ngIf="getNextStatus(service)"
                                      icon="pi pi-arrow-right"
                                      [rounded]="true"
                                      [text]="true"
                                      severity="success"
                                      (click)="advanceStatus(service)"
                                      [pTooltip]="'Avanzar a ' + getMmStatusLabel(getNextStatus(service) || '')"
                                      tooltipPosition="left">
                            </p-button>
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
                                            <p-datepicker [(ngModel)]="service.startDate" [showTime]="true" dateFormat="dd/mm/yy" appendTo="body" styleClass="w-full" [style]="{'width':'100%'}" inputStyleClass="w-full"></p-datepicker>
                                        </div>
                                        <div class="flex flex-col gap-2 flex-1">
                                            <label for="endDate">Fecha Fin</label>
                                            <p-datepicker [(ngModel)]="service.endDate" [showTime]="true" dateFormat="dd/mm/yy" appendTo="body" styleClass="w-full" [style]="{'width':'100%'}" inputStyleClass="w-full"></p-datepicker>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label for="serviceType">Tipo de Servicio</label>
                                        <p-select [options]="serviceTypes" [(ngModel)]="service.serviceType" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full"></p-select>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label for="status">Estado</label>
                                        <p-select [options]="statuses" [(ngModel)]="service.status" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" [disabled]="true"></p-select>
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
                                <!-- Card Cliente -->
                                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm flex flex-col items-center justify-center">
                                    <span class="text-blue-600 dark:text-blue-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Cliente</span>

                                    <div class="flex flex-col items-center">
                                        <!-- Net -->
                                        <span class="text-sm text-gray-600 dark:text-gray-300">Neto: {{ calculateClientNet | currency:'USD' }}</span>

                                        <!-- Tax -->
                                        <span *ngIf="calculateClientTax > 0" class="text-xs text-blue-600 font-bold">+ IVA (21%): {{ calculateClientTax | currency:'USD' }}</span>

                                        <!-- Total -->
                                        <span class="text-2xl font-bold text-gray-800 dark:text-white mt-1">{{ calculateClientTotal | currency:'USD' }}</span>
                                    </div>

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
                    <div class="flex flex-col gap-2 w-full">
                        <!-- Return Trip Switch (Only for new services) -->
                        <div *ngIf="!service.id" class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                             <div class="flex items-center gap-2">
                                <p-checkbox [(ngModel)]="createReturnTrip" [binary]="true" inputId="returnTrip"></p-checkbox>
                                <label for="returnTrip" class="cursor-pointer font-medium select-none text-gray-700 dark:text-gray-200" pTooltip="Se creará autom&aacute;ticamente un servicio de vuelta con origen y destino invertidos (sin gastos extra)." tooltipPosition="top">
                                    Crear Vuelta <i class="pi pi-info-circle text-xs text-blue-500 ml-1"></i>
                                </label>
                             </div>

                             <div *ngIf="createReturnTrip" class="flex flex-wrap gap-2 items-center ml-auto animate-fadein">
                                <p-datepicker [(ngModel)]="returnStartDate" [showTime]="true" hourFormat="24" placeholder="Inicio" appendTo="body" styleClass="w-32" [style]="{'width':'100%'}" inputStyleClass="w-full" [showIcon]="false"></p-datepicker>
                                <span class="text-gray-400">-</span>
                                <p-datepicker [(ngModel)]="returnEndDate" [showTime]="true" hourFormat="24" placeholder="Fin" appendTo="body" styleClass="w-32" [style]="{'width':'100%'}" inputStyleClass="w-full" [showIcon]="false"></p-datepicker>
                             </div>
                        </div>

                        <div class="flex justify-end gap-2 mt-2">
                             <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                             <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveService()" />
                        </div>
                    </div>
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
                                             @if ((s.discountPercentage || 0) > 0) {
                                                 <div class="flex flex-col items-end">
                                                      <!-- Original Price -->
                                                      <span class="text-xs text-gray-400 line-through">{{ (getServiceNet(s) + getDiscountValue(s)) | currency:'USD' }}</span>

                                                      <!-- Discount Row -->
                                                      <span class="text-xs text-green-600 font-semibold mb-1">
                                                          Descuento {{s.discountPercentage}}%: -{{ getDiscountValue(s) | currency:'USD' }}
                                                      </span>

                                                      <!-- Net Price -->
                                                      <span class="font-bold text-gray-800 dark:text-white">{{ getServiceNet(s) | currency:'USD' }}</span>
                                                 </div>
                                             } @else {
                                                 <span class="font-bold text-gray-800 dark:text-white">{{ getServiceNet(s) | currency:'USD' }}</span>
                                             }
                                        </div>
                                    </div>
                                    <span *ngIf="s.details" class="text-xs text-gray-500 italic px-2 border-l-2 border-gray-300">{{ s.details }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Auto-calculated VAT based on service Billing Type -->
                        <div class="text-xs text-gray-500 mb-2">
                             * El IVA se calcula automáticamente según el tipo de facturación de cada servicio.
                        </div>

                        <p-divider></p-divider>

                        <div class="flex flex-col gap-2">
                             <div class="flex justify-between">
                                 <span>Subtotal:</span>
                                 <span>{{ summaryConfig.subtotal | currency:'USD' }}</span>
                             </div>
                              <div class="flex justify-between text-blue-600" *ngIf="summaryConfig.tax > 0">
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
                    <div class="flex gap-2">
                        <p-button label="Generar Reporte" icon="pi pi-file-pdf" severity="warn" (click)="generateReport()" [loading]="loading" />
                        <p-button label="Cerrar" icon="pi pi-times" [text]="true" (click)="summaryDialog = false" />
                    </div>
                </ng-template>
            </p-dialog>

            <!-- Dialogo de Facturacion -->
            <p-dialog [(visible)]="billingDialogVisible" header="Facturar Servicios" [modal]="true" [style]="{width: '800px'}" [maximizable]="true">
                <div class="flex flex-col gap-4">
                     <div class="flex flex-col gap-2">
                         <label class="font-bold">Cliente a Facturar</label>
                         <p-select [options]="clientsList" [(ngModel)]="billingClient" optionLabel="name" (onChange)="onBillingClientChange()" placeholder="Seleccione Cliente" appendTo="body" styleClass="w-full" [filter]="true" filterBy="name"></p-select>
                     </div>

                     <div *ngIf="billingClient" class="animate-fadein">
                         <h3 class="font-bold text-lg mb-2">Grupos Pendientes de Facturación</h3>
                         <p-table [value]="billingGroups" [(selection)]="selectedBillingGroups" dataKey="id" [scrollable]="true" scrollHeight="300px">
                            <ng-template pTemplate="header">
                               <tr>
                                   <th style="width: 3rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
                                   <th>Código Reporte</th>
                                   <th>Cant. Viajes</th>
                                   <th>Total Estimado</th>
                               </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-group>
                               <tr>
                                   <td><p-tableCheckbox [value]="group"></p-tableCheckbox></td>
                                   <td>{{group.code}}</td>
                                   <td>{{group.serviceCount}}</td>
                                   <td>{{group.totalAmount | currency}}</td>
                               </tr>
                            </ng-template>
                             <ng-template pTemplate="emptymessage">
                                <tr><td colspan="4" class="text-center p-4">No hay reportes ni grupos pendientes para este cliente.</td></tr>
                            </ng-template>
                         </p-table>
                     </div>
                </div>
                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="billingDialogVisible = false"></p-button>
                    <p-button label="Confirmar Factura" icon="pi pi-check" severity="success" (click)="confirmBilling()" [disabled]="!billingClient || selectedBillingGroups.length === 0"></p-button>
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, DialogModule, FormsModule, SelectModule, MultiSelectModule, InputNumberModule, TextareaModule, DatePickerModule, ToastModule, PanelModule, DividerModule, CheckboxModule, TooltipModule],

    providers: [MessageService, ServiceService, ClientService, DriverService, VehicleService, ConfigurationService]
})
export class ServiceList implements OnInit {
    services: Service[] = [];
    service: any = this.getEmptyService();

    // Lists for dropdowns
    clientsList: Client[] = [];
    driversList: Driver[] = [];
    vehiclesList: Vehicle[] = [];

    clientFilterOptions: any[] = [];
    driverFilterOptions: any[] = [];

    loading: boolean = true;
    serviceDialog: boolean = false;

    // Return Trip Features
    createReturnTrip: boolean = false;
    returnStartDate: Date | null = null;
    returnEndDate: Date | null = null;
    configDialog: boolean = false;
    config: SystemConfiguration = { id: 0, kmPrice: 0, hourPrice: 0, driverKmPrice: 0, driverHourPrice: 0 };
    submitted: boolean = false;
    activeStatusFilter: string | undefined = undefined;

    statuses = [
        { label: 'Creado', value: 'CREATED' },
        { label: 'Pendiente', value: 'PENDING' },
        { label: 'Pendiente Detalles', value: 'PENDING_DETAILS' },
        { label: 'A Facturar', value: 'PENDING_INVOICE' },
        { label: 'Pendiente Pago', value: 'PAYMENT_PENDING' },
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
        private route: ActivatedRoute,
        private invoiceService: InvoiceService, // Injected
        private primeng: PrimeNG
    ) {}



    // Summary Actions
    async generateInvoice() {
        if (!this.selectedServices.length) return;

        // Validate same client (Invoice usually per client)
        // Validate same client (Invoice usually per client)
        const firstService = this.selectedServices[0];
        const firstClientId = (firstService.clientIds && firstService.clientIds.length > 0) ? firstService.clientIds[0] : null;

        if (!firstClientId) {
             // Fallback: Check if client object exists in service
             const clientObj = (firstService as any).clients && (firstService as any).clients.length > 0 ? (firstService as any).clients[0] : null;
             if (!clientObj) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Los servicios deben tener cliente asignado' });
                return;
             }
        }

        // Check mix
        const currentClientId = firstClientId || (firstService as any).clients[0].id;
        const mixed = this.selectedServices.some(s => {
             const cId = (s.clientIds && s.clientIds.length > 0) ? s.clientIds[0] : ((s as any).clients?.[0]?.id);
             return cId !== currentClientId;
        });
        if (mixed) {
             this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Se generará factura para el cliente del primer servicio seleccionado. Asegúrese de seleccionar servicios del mismo cliente.' });
             // proceed? or block? Let's proceed with firstClientId.
        }

        try {
            this.loading = true;
            await this.invoiceService.createInvoice(
                this.selectedServices.map(s => s.id as number),
                currentClientId as number
            );
            this.messageService.add({ severity: 'success', summary: 'Factura Generada', detail: 'La factura ha sido creada correctamente.' });
            this.summaryDialog = false;
            this.selectedServices = [];
            this.loadAllData();
        } catch (error: any) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message || 'Error generando factura' });
        } finally {
            this.loading = false;
        }
    }


    ngOnInit() {
        // Spanish Localization for PrimeNG
        this.primeng.setTranslation({
            startsWith: 'Comienza con',
            contains: 'Contiene',
            notContains: 'No contiene',
            endsWith: 'Termina con',
            equals: 'Igual a',
            notEquals: 'No igual a',
            noFilter: 'Sin filtro',
            lt: 'Menor que',
            lte: 'Menor o igual a',
            gt: 'Mayor que',
            gte: 'Mayor o igual a',
            is: 'Es',
            isNot: 'No es',
            before: 'Antes',
            after: 'Después',
            dateIs: 'Fecha es',
            dateIsNot: 'Fecha no es',
            dateBefore: 'Fecha antes',
            dateAfter: 'Fecha después',
            clear: 'Limpiar',
            apply: 'Aplicar',
            matchAll: 'Coincidir todo',
            matchAny: 'Coincidir cualquiera',
            addRule: 'Agregar regla',
            removeRule: 'Eliminar regla',
            accept: 'Aceptar',
            reject: 'Cancelar',
            choose: 'Elegir',
            upload: 'Subir',
            cancel: 'Cancelar',
            dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
            dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
            dayNamesMin: ["Do","Lu","Ma","Mi","Ju","Vi","Sa"],
            monthNames: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
            monthNamesShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
            dateFormat: 'dd/mm/yy',
            today: 'Hoy',
            weekHeader: 'Sem'
        });

        this.route.paramMap.subscribe(params => {
            const statusParam = params.get('status');
            this.handleStatusChange(statusParam);
        });

        // Deep Link Handling
        this.route.queryParams.subscribe(params => {
            if (params['id']) {
                const id = Number(params['id']);
                // Wait for data load if needed, but since we call loadAllData() anyway:
                // We'll check if services are loaded.
                if (this.services.length > 0) {
                     this.findAndOpenService(id);
                } else {
                     // If data not loaded yet, we can rely on loadAllData calling a hook or just
                     // re-checking after load.
                     // Simple approach: After loadAllData finishes, checking for pending deep link.
                }
            }
        });
    }

    // In handleStatusChange
    handleStatusChange(status: string | null) {
        const statusMap: any = {
            'created': 'CREATED',
            'pending': 'PENDING',
            'pending_details': 'PENDING_DETAILS',
            'pending_invoice': 'PENDING_INVOICE',
            'payment_pending': 'PAYMENT_PENDING',
            'paid': 'PAID',
            'cancelled': 'CANCELLED',
            'all': undefined
        };
        this.activeStatusFilter = statusMap[status || 'all'];
        this.selectedServices = []; // Clear selection
        this.loadAllData();
    }

    getHeaderTitle() {
        const titles: any = {
            'CREATED': 'Servicios Creados',
            'PENDING': 'Recién Creados / Pendientes',
            'PENDING_DETAILS': 'Pendiente de Envio de Detalles',
            'PENDING_INVOICE': 'Pendiente de Facturar',
            'PAYMENT_PENDING': 'Pendiente de Pago',
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

            this.services = services.map((s: any) => ({
                ...s,
                discountPercentage: s.discount_percentage,
                kmTraveled: s.km_traveled,
                waitingHours: s.waiting_hours,
                billingType: s.billing_type,
                startDate: new Date(s.startDate),
                endDate: s.endDate ? new Date(s.endDate) : null,
                clientNames: s.clients ? s.clients.map((c: any) => c.name).join(', ') : '',
                driverNames: s.drivers ? s.drivers.map((d: any) => d.name).join(', ') : '',
                route: `${s.origin} -> ${s.destination}`
            }));

            // Deduplicate lists by ID
            this.clientsList = [...new Map(clients.map((item: any) => [item.id, item])).values()];
            this.driversList = [...new Map(drivers.map((item: any) => [item.id, item])).values()];
            this.vehiclesList = [...new Map(vehicles.map((item: any) => [item.id, item])).values()];

            // Deduplicate for Filters (by Name)
            const uniqueClientNames = [...new Set(clients.map(c => c.name))].sort();
            this.clientFilterOptions = uniqueClientNames.map(name => ({ name: name, value: name }));

            const uniqueDriverNames = [...new Set(drivers.map(d => d.name))].sort();
            this.driverFilterOptions = uniqueDriverNames.map(name => ({ name: name, value: name }));

        } catch (error) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error cargando datos iniciales' });
        } finally {
            this.loading = false;

             // Check for deep link
             const id = this.route.snapshot.queryParamMap.get('id');
             if (id) {
                 this.findAndOpenService(Number(id));
             }
        }
    }

    findAndOpenService(id: number) {
        const found = this.services.find(s => s.id === id);
        if (found) {
            this.editService(found);
        }
    }

    clear(table: any) {
        table.clear();
        this.selectedServices = [];
    }

    openNew() {
        this.service = this.getEmptyService();
        this.submitted = false;

        // Reset Return Trip
        this.createReturnTrip = false;
        this.returnStartDate = null;
        this.returnEndDate = null;

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
        this.service = {
            ...service,
            startDate: new Date(service.startDate),
            endDate: service.endDate ? new Date(service.endDate) : null,
            serviceType: service.serviceType || 'SERVICE',
            kmTraveled: service.km_traveled,
            waitingHours: service.waiting_hours,
            billingType: service.billing_type,

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

    isValidForCreation(service: any): boolean {
        // Minimum requirements to exist (Status: CREATED)
        return !!(service.clientIds && service.clientIds.length > 0 &&
                  service.startDate &&
                  service.endDate &&
                  service.origin &&
                  service.destination);
    }

    isDataComplete(service: any): boolean {
        // Requirements for PENDING (Ready for execution)

        // 1. Check Clients (Form or Row)
        const hasClient = (service.clientIds && service.clientIds.length > 0) || (service.clients && service.clients.length > 0);

        // 2. Check Dates & Locations
        const hasBasic = service.startDate && service.endDate && service.origin && service.destination;

        if (!hasClient || !hasBasic) return false;

        // 3. Check KM
        const hasKm = service.kmTraveled !== undefined && service.kmTraveled !== null && Number(service.kmTraveled) > 0;

        // 4. Check Driver & Vehicle (Form uses Ids, Row uses relations)
        const hasDriver = (service.driverIds && service.driverIds.length > 0) || (service.drivers && service.drivers.length > 0);
        const hasVehicle = (service.vehicleIds && service.vehicleIds.length > 0) || (service.vehicles && service.vehicles.length > 0);

        // 5. Check Total
        let total = 0;
        if (service === this.service) {
            // Form Context
            total = this.calculateClientTotal;
        } else {
            // Row Context
            total = Number(service.total_amount || 0);
        }

        return hasKm && hasDriver && hasVehicle && total > 0;
    }

    async saveService() {
        this.submitted = true;

        // 0. Strict Validation for Non-New/Non-Created Statuses
        // User Requirement: "En los demas casos cliente, chofer, autos, fechas y total tienen que estar si o si"
        if (this.service.id && this.service.status !== 'CREATED') {
            const hasClient = this.service.clientIds && this.service.clientIds.length > 0;
            const hasDriver = this.service.driverIds && this.service.driverIds.length > 0;
            const hasVehicle = this.service.vehicleIds && this.service.vehicleIds.length > 0;
            const hasDates = this.service.startDate && this.service.endDate;
            const hasTotal = this.calculateClientTotal > 0;

            if (!hasClient || !hasDriver || !hasVehicle || !hasDates || !hasTotal) {
                 this.messageService.add({
                    severity: 'error',
                    summary: 'Datos Incompletos',
                    detail: 'Para guardar un servicio en curso/finalizado, debe tener Cliente, Chofer, Vehículo, Fechas y Total validos.'
                 });
                 return;
            }
        }

        // 1. Validate Minimum Requirements (Creation)
        if (!this.isValidForCreation(this.service)) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Faltan datos obligatorios para crear el servicio (Cliente, Fechas, Origen, Destino)' });
            return;
        }

        try {
            // 2. Determine Status (Auto-promote to PENDING if complete)
            // Logic: If New OR currently CREATED, we try to promote.
            if (!this.service.id || this.service.status === 'CREATED') {
                if (this.isDataComplete(this.service)) {
                     this.service.status = 'PENDING';
                } else {
                     this.service.status = 'CREATED';
                }
            }

            if (this.service.id) {
                await this.serviceService.updateService(this.service.id, this.service);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Servicio actualizado', life: 3000 });
            } else {
                await this.serviceService.createService(this.service);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Servicio creado', life: 3000 });
            }
            this.serviceDialog = false;
            this.selectedServices = []; // Clear selection
            this.loadAllData();
        } catch (error) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el servicio' });
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
            case 'PENDING_DETAILS': return 'info';
            case 'PENDING_INVOICE': return 'help';
            case 'PAYMENT_PENDING': return 'primary';
            case 'PAID': return 'success';
            case 'CANCELLED': return 'danger';
            default: return 'contrast';
        }
    }

    getNextStatus(service: any): string | null { return this.refinedNextStatus(service); }
    _legacyNextStatus(service: any): string | null {
        if (service.status === 'PAID' || service.status === 'CANCELLED') return null;

        const current = service.status;
        const client = service.clients && service.clients.length > 0 ? service.clients[0] : {};
        const sendDetails = client.send_details !== false;
        const sendInvoices = client.send_invoices !== false;

        // Flow: PENDING -> [PENDING_DETAILS] -> [INVOICED] -> PAYMENT_PENDING -> PAID

        if (current === 'PENDING') {
            if (sendDetails) return 'PENDING_DETAILS';
            if (sendInvoices) return 'INVOICED';
            return 'PAYMENT_PENDING';
        }

        if (current === 'PENDING_DETAILS') {
            if (sendInvoices) return 'INVOICED';
            return 'PAYMENT_PENDING';
        }

        if (current === 'INVOICED') {
            return 'PAYMENT_PENDING';
        }

        if (current === 'PAYMENT_PENDING') {
            return 'PAID';
        }

        return null;
    }

    async advanceStatus(service: any) {
        const next = this.getNextStatus(service);
        if (!next) return;

        // Prevent moving from CREATED to PENDING if data incomplete
        if (service.status === 'CREATED' && next === 'PENDING') {
            if (!this.isDataComplete(service)) {
                this.messageService.add({ severity: 'warn', summary: 'Incompleto', detail: 'Faltan datos (Chofer, Vehículo, Total > 0) para pasar a Pendiente.' });
                return;
            }
        }

        // Optimistic UI update or simple reload
        // Let's call update
        try {
            await this.serviceService.updateService(service.id, { status: next });
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `Estado cambiado a ${this.getMmStatusLabel(next)}` });
            this.loadAllData();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' });
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

    get calculateClientNet(): number {
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

    get calculateClientTax(): number {
        const net = this.calculateClientNet;
        const bType = this.service.billingType;
        if (bType === 'OFFICIAL_A' || bType === 'MONOTRIBUTO') {
            return net * 0.21;
        }
        return 0;
    }

    get calculateClientTotal(): number {
        return this.calculateClientNet + this.calculateClientTax;
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
    summaryConfig: any = { subtotal: 0, tax: 0, total: 0 };

    openSummary() {
        if (!this.selectedServices.length) return;
        this.calculateSummaryTotal();
        this.summaryDialog = true;
    }

    calculateSummaryTotal() {
        let subtotal = 0;
        let tax = 0;

        this.selectedServices.forEach((s: any) => {
            // Logic to calculate Net and Tax for each service
            // Note: If using Row Data, s.total_amount might handle it?
            // BUT backend update logic puts Total = Net + Tax.
            // So s.total_amount IS the final.
            // We need to derive Net and Tax if they are not stored separately or if we want to recalc.
            // If we migrated and populated, `net_amount` and `tax_amount` are in DB.
            // BUT `loadAllData` currently fetches existing struct.
            // I should use `net_amount` and `tax_amount` properties IF they exist.
            // If not, calculate.

            let sNet = 0;
            let sTax = 0;

            // Prefer DB props if available
            if (s.net_amount !== undefined) {
                 sNet = Number(s.net_amount);
                 sTax = Number(s.tax_amount || 0);
            } else {
                 // Fallback (e.g. optimistic UI before reload or old data)
                 // Start with s.total_amount (which was previously net)
                 // This is tricky during migration transition.
                 // let's assume total_amount is Net unless we know otherwise.
                 // But wait, users said logic changed -> total includes tax.
                 // If data is old, total = net, tax = 0.
                 // If data is new, net + tax = total.
                 // Safest: Recalculate based on values
                 const km = Number(s.km_traveled || s.kmTraveled || 0);
                 // Need prices snapshot... usually in row.
                 // This is becoming complex to do client side accurately for summary without trusting DB.
                 // Let's trust `total_amount` is the FINAL price.
                 // If s.tax_amount exists, we use it.

                 const total = Number(s.total_amount || 0);
                 if (s.tax_amount && Number(s.tax_amount) > 0) {
                     sTax = Number(s.tax_amount);
                     sNet = total - sTax;
                 } else {
                     // Maybe it should have tax but doesn't?
                     const bType = s.billing_type || s.billingType;
                     if (bType === 'OFFICIAL_A' || bType === 'MONOTRIBUTO') {
                         // Should have tax. Implies total includes it?
                         // Or we should add it?
                         // Prior to migration, total didn't have tax.
                         // So if I add tax here, I might be double counting if backend already did.
                         // Given I just added backend logic, only newly saved services have tax.
                         // Old services have 0 tax.
                         // I will display what exists.
                         sNet = total;
                         sTax = 0;
                     } else {
                         sNet = total;
                         sTax = 0;
                     }
                 }
            }
            subtotal += sNet;
            tax += sTax;
        });

        this.summaryConfig.subtotal = subtotal;
        this.summaryConfig.tax = tax;
        this.summaryConfig.total = subtotal + tax;
    }

    getDiscountValue(service: any): number {
        if (!service.discountPercentage) return 0;
        // If total_amount includes tax, discount was applied to NET.
        // Discount Value = Net * (pct/100).
        // If we have net_amount, easy.

        let net = 0;
        if ((service as any).net_amount) {
            net = Number((service as any).net_amount);
            // Actually net_amount in DB is AFTER discount.
            // So Original Net = Net / (1 - rate).
            // Discount = Original Net - Net.
             const total = Number(service.total_amount || 0);
             // Let's use total for simplicity in UI list if exact math is hard.
             // Or better:
             const rate = service.discountPercentage / 100;
             const finalNet = Number((service as any).net_amount || service.total_amount);
             // Logic: net_amount is post-discount.
             const originalNet = finalNet / (1 - rate);
             return originalNet - finalNet;
        }

        // Fallback for old data
        const total = Number(service.total_amount || service.totalAmount || 0);
        const rate = service.discountPercentage / 100;
        const originalPrice = total / (1 - rate);
        return originalPrice - total;
    }

    getServiceNet(service: any): number {
        if (service.net_amount && Number(service.net_amount) > 0) {
            return Number(service.net_amount);
        }
        if (service.tax_amount && Number(service.tax_amount) > 0) {
             return Number(service.total_amount || 0) - Number(service.tax_amount);
        }
        return Number(service.total_amount || service.totalAmount || 0);
    }

    refinedNextStatus(service: any): string | null {
        if (service.status === 'PAID' || service.status === 'CANCELLED') return null;

        const current = service.status;
        const client = (service.clients && service.clients.length > 0) ? service.clients[0] : {};
        const sendDetails = client.send_details !== false;
        const sendInvoices = client.send_invoices !== false;

        // Flow: CREATED -> PENDING -> [PENDING_DETAILS] -> [PENDING_INVOICE] -> [INVOICED] -> PAYMENT_PENDING -> PAID

        if (current === 'CREATED') return 'PENDING';

        if (current === 'PENDING') {
            if (sendDetails) return 'PENDING_DETAILS';
            if (sendInvoices) return 'PENDING_INVOICE';
            return 'PAYMENT_PENDING';
        }

        // Disable arrow for manual/batch flows
        if (current === 'PENDING_DETAILS') {
            return null;
        }

        if (current === 'PENDING_INVOICE') {
            return null;
        }

        if (current === 'INVOICED') {
            return 'PAYMENT_PENDING';
        }

        if (current === 'PAYMENT_PENDING') {
            return 'PAID';
        }

        return null;
    }

    // --- Service Grouping & Reporting ---

    async generateReport() {
        if (!this.selectedServices || this.selectedServices.length === 0) return;

        // 1. Validate Same Client
        const firstService = this.selectedServices[0];
        const firstClientId = (firstService.clientIds && firstService.clientIds.length > 0) ? firstService.clientIds[0] : null;

        // Fallback to clients array check
        let currentClientId = firstClientId;
        if (!currentClientId) {
             const clientObj = (firstService as any).clients && (firstService as any).clients.length > 0 ? (firstService as any).clients[0] : null;
             if (!clientObj) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Los servicios deben tener cliente asignado' });
                return;
             }
             currentClientId = clientObj.id;
        }

        const mixed = this.selectedServices.some(s => {
             const cId = (s.clientIds && s.clientIds.length > 0) ? s.clientIds[0] : ((s as any).clients?.[0]?.id);
             return cId !== currentClientId;
        });

        if (mixed) {
             this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Todos los servicios seleccionados deben pertenecer al mismo cliente principal.' });
             return;
        }

        try {
            this.loading = true;
            await this.serviceService.createGroup(this.selectedServices.map(s => s.id!), currentClientId as number);

            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado y servicios agrupados.' });
            this.summaryDialog = false;
            this.selectedServices = [];
            this.loadAllData(); // Refresh to move them to next status
        } catch (error) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Falló la generación del reporte.' });
        } finally {
            this.loading = false;
        }
    }

    // --- Billing Dialog ---
    billingDialogVisible: boolean = false;
    billingClient: any = null;
    billingGroups: any[] = [];
    selectedBillingGroups: any[] = [];

    openBilling() {
        this.billingDialogVisible = true;
        this.billingClient = null;
        this.billingGroups = [];
        this.selectedBillingGroups = [];

        // Pre-select if single client
        if (this.selectedServices.length > 0) {
            const firstId = this.selectedServices[0].clientIds[0];
            const allSame = this.selectedServices.every(s => s.clientIds.length > 0 && s.clientIds[0] === firstId);
            if (allSame) {
                this.billingClient = this.clientsList.find(c => c.id === firstId);
                if (this.billingClient) {
                    this.onBillingClientChange();
                }
            }
        }
    }

    async onBillingClientChange() {
        if (!this.billingClient) return;

        this.loading = true;
        try {
            // Fetch Groups for this client (Status GENERATED = ready to invoice)
            const groups = await this.serviceService.getGroups({ clientId: this.billingClient.id, status: 'GENERATED' });

            // Transform/enrich if needed
            this.billingGroups = groups.map(g => ({
                ...g,
                // Count services or sum amounts if not in group object
                totalAmount: g.services ? g.services.reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0) : 0,
                serviceCount: g.services ? g.services.length : 0
            }));

        } catch (error) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error cargando grupos.' });
        } finally {
            this.loading = false;
        }
    }

    async confirmBilling() {
        if (!this.billingClient) return;
        if (this.selectedBillingGroups.length === 0) {
             this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione al menos un grupo para facturar.' });
             return;
        }

        try {
            this.loading = true;

            // Gather all Service IDs from selected groups
            const allServiceIds: number[] = [];
            this.selectedBillingGroups.forEach(g => {
                if (g.services) {
                    g.services.forEach((s: any) => allServiceIds.push(s.id));
                }
            });

            // Create Invoice
            await this.invoiceService.createInvoice(allServiceIds, this.billingClient.id);

            this.billingDialogVisible = false;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Factura creada correctamente.' });
            this.loadAllData(); // Refresh list
        } catch (error) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la factura.' });
        } finally {
            this.loading = false;
        }
    }



    openReport(service: any) {
        const group = service.serviceGroup;

        if (!group || !group.pdfUrl || group.pdfUrl === 'TODO') {
             this.messageService.add({severity: 'info', summary: 'Reporte', detail: 'El reporte está siendo generado o es un placeholder.'});
             return;
        }

        let url = group.pdfUrl;

        // In Production, we MUST use the Nginx Proxy to inject the API Key.
        // This means fetching the report from the Frontend domain (Relative Path), not the Backend directly.
        if (environment.production) {
            // regex to strip protocol and domain: https://anything.com/path -> /path
            url = url.replace(/^https?:\/\/[^\/]+/, '');

            // Ensure it starts with / (if specific case where it wasn't there)
            if (!url.startsWith('/')) {
                url = '/' + url;
            }
        }

        window.open(url, '_blank');
    }
}

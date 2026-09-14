import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { Vehicle, VehicleOwnership, VehicleService } from '../../service/vehicle.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../service/auth.service';

@Component({
    selector: 'app-vehicle-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="font-semibold text-xl mb-4">Autos</div>
            <p-table #dt1 [value]="vehicles" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true" [globalFilterFields]="['plate', 'model']">
                <ng-template pTemplate="caption">
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold">Listado de Autos</span>
                        <div class="flex gap-2">
                            <p-button label="Nuevo" icon="pi pi-plus" (click)="openNew()" />
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="dt1.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." />
                            </p-iconfield>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="header">
                    <tr>
                        <th pSortableColumn="plate">Patente <p-sortIcon field="plate" /></th>
                        <th pSortableColumn="model">Modelo <p-sortIcon field="model" /></th>
                        <th>Propiedad</th>
                        <th>Vencimientos</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-vehicle>
                    <tr>
                        <td>{{ vehicle.plate }}</td>
                        <td>{{ vehicle.model }}</td>
                        <td>{{ getOwnershipLabel(vehicle.ownership) }}</td>
                        <td>
                            <p-tag *ngIf="vencimientoStatus(vehicle) as st" [value]="st.label" [severity]="st.severity"></p-tag>
                        </td>
                        <td>
                            <p-button *ngIf="canViewStats" icon="pi pi-chart-bar" [rounded]="true" [text]="true" severity="info" pTooltip="Ver rentabilidad" (click)="viewStats(vehicle)" />
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="editVehicle(vehicle)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteVehicle(vehicle)" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="vehicleDialog" [style]="{ width: '560px' }" header="Detalles del Auto" [modal]="true" styleClass="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="plate">Patente</label>
                                <input type="text" pInputText id="plate" [(ngModel)]="vehicle.plate" required autofocus />
                                <small class="p-error" *ngIf="submitted && !vehicle.plate">La patente es obligatoria.</small>
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="model">Modelo</label>
                                <input type="text" pInputText id="model" [(ngModel)]="vehicle.model" required />
                                 <small class="p-error" *ngIf="submitted && !vehicle.model">El modelo es obligatorio.</small>
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="ownership">Propiedad</label>
                            <p-select [(ngModel)]="vehicle.ownership" inputId="ownership" [options]="ownershipOptions" placeholder="Seleccionar" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full"></p-select>
                        </div>

                        <div class="pt-2 mt-2 border-t border-surface-200 dark:border-surface-700">
                            <div class="text-sm font-semibold text-muted-color mb-1">Compra</div>
                            <div class="text-xs text-muted-color mb-3">Opcional. Si lo cargás, el sistema puede calcular el retorno de inversión de este auto.</div>
                            <div class="grid grid-cols-12 gap-x-4 gap-y-4">
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label for="purchasePrice">Precio de compra</label>
                                    <p-inputnumber inputId="purchasePrice" [(ngModel)]="vehicle.purchase_price" mode="currency" currency="USD" locale="en-US" [min]="0" styleClass="w-full"></p-inputnumber>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label for="purchaseDate">Fecha de compra</label>
                                    <p-datepicker inputId="purchaseDate" [(ngModel)]="vehicle.purchase_date" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" appendTo="body" styleClass="w-full"></p-datepicker>
                                </div>
                            </div>
                        </div>

                        <div class="pt-2 mt-2 border-t border-surface-200 dark:border-surface-700">
                            <div class="text-sm font-semibold text-muted-color mb-3">Vencimientos</div>
                            <div class="grid grid-cols-12 gap-x-4 gap-y-4">
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label for="seguro">Seguro</label>
                                    <p-datepicker inputId="seguro" [(ngModel)]="vehicle.seguroVencimiento" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" appendTo="body" styleClass="w-full"></p-datepicker>
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label for="vtv">VTV</label>
                                    <p-datepicker inputId="vtv" [(ngModel)]="vehicle.vtvVencimiento" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" appendTo="body" styleClass="w-full"></p-datepicker>
                                </div>
                                <div class="col-span-12 flex flex-col gap-2">
                                    <label for="ruta">Ruta / Habilitación</label>
                                    <p-datepicker inputId="ruta" [(ngModel)]="vehicle.rutaVencimiento" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" appendTo="body" styleClass="w-full"></p-datepicker>
                                </div>
                            </div>
                        </div>
                    </div>
                </ng-template>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveVehicle()" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, FormsModule, SelectModule, DatePickerModule, TagModule, ToastModule, InputNumberModule, TooltipModule],
    providers: [MessageService]
})
export class VehicleList implements OnInit {
    vehicles: Vehicle[] = [];
    vehicle: Vehicle = { plate: '', model: '', ownership: VehicleOwnership.THIRD_PARTY };
    loading: boolean = true;
    vehicleDialog: boolean = false;
    submitted: boolean = false;

    ownershipOptions = [
        { label: 'Propio', value: VehicleOwnership.OWN },
        { label: 'Tercero', value: VehicleOwnership.THIRD_PARTY }
    ];

    canViewStats = false;

    constructor(private vehicleService: VehicleService, private messageService: MessageService, private route: ActivatedRoute, private router: Router, private authService: AuthService) {
        this.canViewStats = this.authService.hasPermission('viewStatistics');
    }

    viewStats(vehicle: Vehicle) {
        this.router.navigate(['/app/vehicles', vehicle.id, 'stats']);
    }

    async ngOnInit() {
        await this.loadVehicles();
        this.route.queryParams.subscribe(params => {
            if (params['action'] === 'edit' && params['id']) {
                const id = Number(params['id']);
                const vehicle = this.vehicles.find(v => v.id === id);
                if (vehicle) {
                    this.editVehicle(vehicle);
                }
            }
        });
    }

    async loadVehicles() {
        this.loading = true;
        try {
            this.vehicles = await this.vehicleService.getVehicles();
        } catch (error) {
             console.error(error);
             this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los autos' });
        } finally {
            this.loading = false;
        }
    }

    openNew() {
        this.vehicle = { plate: '', model: '', ownership: VehicleOwnership.THIRD_PARTY };
        this.submitted = false;
        this.vehicleDialog = true;
    }

    editVehicle(vehicle: Vehicle) {
        this.vehicle = {
            ...vehicle,
            seguroVencimiento: vehicle.seguroVencimiento ? new Date(vehicle.seguroVencimiento) : null,
            vtvVencimiento: vehicle.vtvVencimiento ? new Date(vehicle.vtvVencimiento) : null,
            rutaVencimiento: vehicle.rutaVencimiento ? new Date(vehicle.rutaVencimiento) : null
        };
        this.vehicleDialog = true;
    }

    async deleteVehicle(vehicle: Vehicle) {
        if (!vehicle.id) return;
        if (confirm('¿Está seguro de que desea eliminar este auto?')) {
            try {
                await this.vehicleService.deleteVehicle(vehicle.id);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Auto eliminado', life: 3000 });
                this.loadVehicles();
            } catch (error) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el auto' });
            }
        }
    }

    hideDialog() {
        this.vehicleDialog = false;
        this.submitted = false;
    }

    async saveVehicle() {
        this.submitted = true;

        if (this.vehicle.plate?.trim() && this.vehicle.model?.trim()) {
            try {
                if (this.vehicle.id) {
                    await this.vehicleService.updateVehicle(this.vehicle.id, this.vehicle);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Auto actualizado', life: 3000 });
                } else {
                    await this.vehicleService.createVehicle(this.vehicle);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Auto creado', life: 3000 });
                }
                this.vehicleDialog = false;
                this.vehicle = { plate: '', model: '', ownership: VehicleOwnership.THIRD_PARTY };
                this.loadVehicles();
            } catch (error) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el auto' });
            }
        }
    }

    vencimientoStatus(vehicle: Vehicle): { label: string; severity: 'success' | 'warn' | 'danger' } | null {
        const dates = [vehicle.seguroVencimiento, vehicle.vtvVencimiento, vehicle.rutaVencimiento]
            .filter((d): d is string | Date => !!d)
            .map((d) => new Date(d));
        if (dates.length === 0) return null;

        const now = Date.now();
        const daysLeftList = dates.map((d) => Math.ceil((d.getTime() - now) / 86_400_000));
        const minDays = Math.min(...daysLeftList);

        if (minDays < 0) return { label: `Vencido hace ${Math.abs(minDays)}d`, severity: 'danger' };
        if (minDays <= 30) return { label: `Vence en ${minDays}d`, severity: 'warn' };
        return { label: 'Al día', severity: 'success' };
    }

    getOwnershipLabel(value: string) {
        const option = this.ownershipOptions.find(o => o.value === value);
        return option ? option.label : value;
    }
}

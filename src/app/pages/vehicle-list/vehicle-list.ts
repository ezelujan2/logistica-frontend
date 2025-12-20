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
import { Vehicle, VehicleOwnership, VehicleService } from '../../service/vehicle.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-vehicle>
                    <tr>
                        <td>{{ vehicle.plate }}</td>
                        <td>{{ vehicle.model }}</td>
                        <td>{{ getOwnershipLabel(vehicle.ownership) }}</td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="editVehicle(vehicle)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteVehicle(vehicle)" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="vehicleDialog" [style]="{ width: '450px' }" header="Detalles del Auto" [modal]="true" styleClass="p-fluid">
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
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, FormsModule, SelectModule, ToastModule],
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

    constructor(private vehicleService: VehicleService, private messageService: MessageService) {}

    ngOnInit() {
        this.loadVehicles();
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
        this.vehicle = { ...vehicle };
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

    getOwnershipLabel(value: string) {
        const option = this.ownershipOptions.find(o => o.value === value);
        return option ? option.label : value;
    }
}

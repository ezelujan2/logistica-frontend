import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Driver, DriverService } from '../../service/driver.service';

@Component({
    selector: 'app-driver-list',
    standalone: true,
    imports: [TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, FormsModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="font-semibold text-xl mb-4">Choferes</div>

            <p-table #dt1 [value]="drivers" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]"
                [loading]="loading" [paginator]="true" [globalFilterFields]="['name', 'phone', 'email', 'license_number']">
                <ng-template pTemplate="caption">
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold">Listado de Choferes</span>
                        <div class="flex gap-2">
                            <p-button label="Nuevo" icon="pi pi-plus" (click)="openNew()" />
                            <p-iconfield>
                                <p-inputicon class="pi pi-search" />
                                <input pInputText type="text" (input)="dt1.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." />
                            </p-iconfield>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="header">
                    <tr>
                        <th pSortableColumn="name">Nombre <p-sortIcon field="name" /></th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Licencia</th>
                        <th>CUIT</th>
                        <th style="width:8rem">Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-driver>
                    <tr>
                        <td>{{ driver.name }}</td>
                        <td>{{ driver.phone || '—' }}</td>
                        <td>{{ driver.email || '—' }}</td>
                        <td>{{ driver.license_number || '—' }}</td>
                        <td>{{ driver.cuit || '—' }}</td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="editDriver(driver)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteDriver(driver)" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr><td colspan="6" class="text-center p-6 text-color-secondary">No hay choferes registrados</td></tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="driverDialog" [style]="{ width: '450px' }" header="Detalles del Chofer" [modal]="true" class="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="dname">Nombre *</label>
                            <input type="text" pInputText id="dname" [(ngModel)]="driver.name" required autofocus />
                            @if (submitted && !driver.name) { <small class="p-error">El nombre es obligatorio.</small> }
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="dphone">Teléfono</label>
                                <input type="text" pInputText id="dphone" [(ngModel)]="driver.phone" />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="demail">Email</label>
                                <input type="text" pInputText id="demail" [(ngModel)]="driver.email" />
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="dlicense">N° de Licencia</label>
                                <input type="text" pInputText id="dlicense" [(ngModel)]="driver.license_number" />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="dcuit">CUIT</label>
                                <input type="text" pInputText id="dcuit" [(ngModel)]="driver.cuit" />
                            </div>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveDriver()" />
                </ng-template>
            </p-dialog>
        </div>
    `
})
export class DriverList implements OnInit {
    drivers: Driver[] = [];
    driver: Driver = { name: '' };
    loading = true;
    driverDialog = false;
    submitted = false;

    constructor(private driverService: DriverService, private messageService: MessageService) {}

    ngOnInit() { this.loadDrivers(); }

    async loadDrivers() {
        this.loading = true;
        try {
            this.drivers = await this.driverService.getDrivers();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los choferes' });
        } finally {
            this.loading = false;
        }
    }

    openNew() {
        this.driver = { name: '' };
        this.submitted = false;
        this.driverDialog = true;
    }

    editDriver(driver: Driver) {
        this.driver = { ...driver };
        this.submitted = false;
        this.driverDialog = true;
    }

    async deleteDriver(driver: Driver) {
        if (!driver.id) return;
        if (confirm('¿Está seguro de eliminar este chofer?')) {
            try {
                await this.driverService.deleteDriver(driver.id);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Chofer eliminado', life: 3000 });
                this.loadDrivers();
            } catch {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el chofer' });
            }
        }
    }

    hideDialog() {
        this.driverDialog = false;
        this.submitted = false;
    }

    async saveDriver() {
        this.submitted = true;
        if (!this.driver.name?.trim()) return;
        try {
            if (this.driver.id) {
                await this.driverService.updateDriver(this.driver.id, this.driver);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Chofer actualizado', life: 3000 });
            } else {
                await this.driverService.createDriver(this.driver);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Chofer creado', life: 3000 });
            }
            this.driverDialog = false;
            this.driver = { name: '' };
            this.loadDrivers();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el chofer' });
        }
    }
}

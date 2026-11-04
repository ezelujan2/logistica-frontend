import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Driver, DriverService } from '../../service/driver.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DriverForm } from './driver-form';

@Component({
    selector: 'app-driver-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="font-semibold text-xl mb-4">Choferes</div>
            <p-table #dt1 [value]="drivers" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true" [globalFilterFields]="['name', 'phone', 'email']" styleClass="mobile-cards">
                <ng-template pTemplate="caption">
                    <div class="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                        <span class="hidden sm:inline text-xl font-bold">Listado de Choferes</span>
                        <div class="flex gap-2">
                            <p-button label="Nuevo" icon="pi pi-plus" (click)="openNew()" />
                            <p-iconfield class="flex-1 sm:flex-none">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="dt1.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." class="w-full" />
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
                        <th>Carnet</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-driver>
                    <tr class="m-card">
                        <td class="m-title"><a class="font-medium text-primary cursor-pointer hover:underline" [routerLink]="['/app/drivers', driver.id]">{{ driver.name }}</a></td>
                        <td>{{ driver.phone }}</td>
                        <td class="break-all">{{ driver.email }}</td>
                        <td [attr.data-label]="driver.license_number ? 'Licencia' : null">{{ driver.license_number }}</td>
                        <td class="m-end">
                            <p-tag *ngIf="vencimientoStatus(driver) as st" [value]="st.label" [severity]="st.severity"></p-tag>
                        </td>
                        <td class="m-actions whitespace-nowrap">
                            <p-button icon="pi pi-id-card" [rounded]="true" [text]="true" pTooltip="Abrir la ficha" [routerLink]="['/app/drivers', driver.id]" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Eliminar" (click)="deleteDriver(driver)" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="driverDialog" [style]="{ width: '760px' }" [breakpoints]="{ '800px': '95vw' }" header="Nuevo chofer" [modal]="true" [draggable]="false">
                <ng-template pTemplate="content">
                    <app-driver-form [driver]="driver" [submitted]="submitted" />
                </ng-template>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" [text]="true" severity="secondary" (click)="hideDialog()" />
                    <p-button label="Crear chofer" icon="pi pi-check" [loading]="saving" (click)="saveDriver()" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, TagModule, ToastModule, TooltipModule, DriverForm],
    providers: [MessageService]
})
export class DriverList implements OnInit {
    drivers: Driver[] = [];
    driver: Driver = { name: '' };
    loading: boolean = true;
    driverDialog: boolean = false;
    submitted: boolean = false;
    saving = false;

    constructor(private driverService: DriverService, private messageService: MessageService, private route: ActivatedRoute, private router: Router) {}

    async ngOnInit() {
        // Links viejos (?action=edit&id=…) van a la ficha.
        const params = this.route.snapshot.queryParams;
        if (params['action'] === 'edit' && params['id']) {
            this.router.navigate(['/app/drivers', Number(params['id'])], { queryParams: { tab: 'datos' }, replaceUrl: true });
            return;
        }
        await this.loadDrivers();
    }

    async loadDrivers() {
        this.loading = true;
        try {
            this.drivers = await this.driverService.getDrivers();
        } catch (error) {
            console.error(error);
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

    async deleteDriver(driver: Driver) {
        if (!driver.id) return;
        if (confirm('¿Está seguro de que desea eliminar este chofer?')) {
            try {
                await this.driverService.deleteDriver(driver.id);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Chofer eliminado', life: 3000 });
                this.loadDrivers();
            } catch (error) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el chofer' });
            }
        }
    }

    vencimientoStatus(driver: Driver): { label: string; severity: 'success' | 'warn' | 'danger' } | null {
        if (!driver.carnetVencimiento) return null;
        const days = Math.ceil((new Date(driver.carnetVencimiento).getTime() - Date.now()) / 86_400_000);
        if (days < 0) return { label: `Vencido hace ${Math.abs(days)}d`, severity: 'danger' };
        if (days <= 30) return { label: `Vence en ${days}d`, severity: 'warn' };
        return { label: 'Al día', severity: 'success' };
    }

    hideDialog() {
        this.driverDialog = false;
        this.submitted = false;
    }

    /** Crea el chofer y abre su ficha. */
    async saveDriver() {
        this.submitted = true;
        if (!this.driver.name?.trim()) return;
        this.saving = true;
        try {
            const created = await this.driverService.createDriver(this.driver);
            this.driverDialog = false;
            this.router.navigate(['/app/drivers', created.id]);
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el chofer' });
        } finally {
            this.saving = false;
        }
    }
}

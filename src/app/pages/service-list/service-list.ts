import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Service, ServiceService } from '../../service/service.service';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-service-list',
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">Lista de Servicios</div>
            <p-table #dt1 [value]="services" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true" [globalFilterFields]="['name', 'description', 'status']">
                <ng-template pTemplate="caption">
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold">Servicios</span>
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
                        <th pSortableColumn="name" style="min-width:12rem">
                            <div class="flex items-center">Nombre <p-sortIcon field="name" /></div>
                        </th>
                        <th style="min-width:12rem">
                            <div class="flex items-center">Descripción</div>
                        </th>
                        <th pSortableColumn="price" style="min-width:10rem">
                            <div class="flex items-center">Precio <p-sortIcon field="price" /></div>
                        </th>
                        <th style="min-width:10rem">
                            <div class="flex items-center">Estado</div>
                        </th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-service>
                    <tr>
                        <td>
                            {{ service.name }}
                        </td>
                        <td>
                            {{ service.description }}
                        </td>
                        <td>
                            {{ service.price | currency : 'USD' }}
                        </td>
                        <td>
                            <p-tag [value]="service.status" [severity]="getSeverity(service.status)" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="4">No se encontraron servicios.</td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="serviceDialog" [style]="{ width: '450px' }" header="Detalles del Servicio" [modal]="true" styleClass="p-fluid">
                <ng-template pTemplate="content">
                    <div class="field">
                        <label for="name">Nombre</label>
                        <input type="text" pInputText id="name" [(ngModel)]="service.name" required autofocus />
                        <small class="p-error" *ngIf="submitted && !service.name">El nombre es obligatorio.</small>
                    </div>
                    <div class="field">
                        <label for="description">Descripción</label>
                        <textarea id="description" pTextarea [(ngModel)]="service.description" required rows="3" cols="20"></textarea>
                    </div>

                    <div class="field">
                        <label for="status">Estado</label>
                        <p-select [(ngModel)]="service.status" inputId="status" [options]="statuses" placeholder="Seleccionar" optionLabel="label" optionValue="value" appendTo="body">
                            <ng-template pTemplate="selectedItem" let-selectedOption>
                                <div class="flex align-items-center gap-2" *ngIf="service.status">
                                    <p-tag [value]="service.status.toUpperCase()" [severity]="getSeverity(service.status.toUpperCase())"/>
                                </div>
                            </ng-template>
                            <ng-template let-option pTemplate="item">
                                <p-tag [value]="option.label" [severity]="getSeverity(option.label)" />
                            </ng-template>
                        </p-select>
                    </div>

                    <div class="field">
                        <label for="price">Precio</label>
                        <p-inputNumber id="price" [(ngModel)]="service.price" mode="currency" currency="USD" locale="en-US" />
                    </div>
                </ng-template>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveService()" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, DialogModule, FormsModule, SelectModule, InputNumberModule, TextareaModule],
    providers: [ServiceService]
})
export class ServiceList implements OnInit {
    services: Service[] = [];
    service: Service = { name: '', description: '', price: 0, status: 'Active' };
    loading: boolean = true;
    serviceDialog: boolean = false;
    submitted: boolean = false;

    statuses: any[] = [
        { label: 'Activo', value: 'Active' },
        { label: 'Inactivo', value: 'Inactive' },
        { label: 'Mantenimiento', value: 'Maintenance' }
    ];

    constructor(private serviceService: ServiceService) {}

    ngOnInit() {
        this.loadServices();
    }

    loadServices() {
        this.loading = true;
        this.serviceService.getServices().subscribe({
            next: (data) => {
                this.services = data;
                this.loading = false;
            },
            error: (e) => {
                console.error(e);
                this.loading = false;
                // Fallback or error handling if backend is down
            }
        });
    }

    openNew() {
        this.service = { name: '', description: '', price: 0, status: 'Active' };
        this.submitted = false;
        this.serviceDialog = true;
    }

    hideDialog() {
        this.serviceDialog = false;
        this.submitted = false;
    }

    saveService() {
        this.submitted = true;

        if (this.service.name?.trim()) {
            if (this.service.id) {
                // Update logic if we add edit feature later
            } else {
                this.serviceService.createService(this.service).subscribe(() => {
                    this.serviceDialog = false;
                    this.service = { name: '', description: '', price: 0, status: 'Active' };
                    this.loadServices();
                });
            }
        }
    }

    getSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        switch (status) {
            case 'Inactive':
            case 'INACTIVE':
                return 'danger';
            case 'Active':
            case 'ACTIVE':
                return 'success';
            case 'Maintenance':
            case 'MAINTENANCE':
                return 'warn';
            default:
                return undefined;
        }
    }
}

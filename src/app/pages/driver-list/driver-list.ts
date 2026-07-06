import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { Driver, DriverService } from '../../service/driver.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HelpButtonComponent } from '../../shared/help-button.component';
import { DocumentService, DocumentRecord } from '../../service/document.service';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';

@Component({
    selector: 'app-driver-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="flex items-center gap-2 font-semibold text-xl mb-4">Choferes <app-help-button pageKey="drivers" /></div>
            <p-table #dt1 [value]="drivers" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true" [globalFilterFields]="['name', 'phone', 'email']">
                <ng-template pTemplate="caption">
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold">Listado de Choferes</span>
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
                        <th pSortableColumn="name">Nombre <p-sortIcon field="name" /></th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Licencia</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-driver>
                    <tr>
                        <td>{{ driver.name }}</td>
                        <td>{{ driver.phone }}</td>
                        <td>{{ driver.email }}</td>
                        <td>{{ driver.license_number }}</td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="editDriver(driver)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteDriver(driver)" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="driverDialog" [style]="{ width: '450px' }" header="Detalles del Chofer" [modal]="true" styleClass="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="name">Nombre</label>
                            <input type="text" pInputText id="name" [(ngModel)]="driver.name" required autofocus />
                            <small class="p-error" *ngIf="submitted && !driver.name">El nombre es obligatorio.</small>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="phone">Teléfono</label>
                                <input type="text" pInputText id="phone" [(ngModel)]="driver.phone" />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="email">Email</label>
                                <input type="text" pInputText id="email" [(ngModel)]="driver.email" />
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="license">Número de Licencia</label>
                                <input type="text" pInputText id="license" [(ngModel)]="driver.license_number" />
                            </div>
                             <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="cuit">CUIT</label>
                                <input type="text" pInputText id="cuit" [(ngModel)]="driver.cuit" />
                            </div>
                        </div>
                    </div>

                    <!-- Documents Section (only when editing) -->
                    <div *ngIf="driver.id" class="mt-4">
                        <p-divider />
                        <div class="flex items-center justify-between mb-3">
                            <span class="font-semibold text-lg">Documentos</span>
                            <p-button label="Agregar" icon="pi pi-plus" [text]="true" size="small" (click)="openDocDialog()" />
                        </div>
                        <div *ngIf="driverDocuments.length === 0" class="text-gray-500 text-sm text-center py-4">
                            No hay documentos cargados.
                        </div>
                        <div *ngFor="let doc of driverDocuments" class="flex items-center justify-between p-3 mb-2 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                                <span class="font-medium">{{ getDocTypeLabel(doc.type) }}</span>
                                <span *ngIf="doc.description" class="text-gray-500 text-sm ml-2">— {{ doc.description }}</span>
                                <div class="text-sm mt-1">
                                    Vence: {{ formatDate(doc.expiryDate) }}
                                    <p-tag *ngIf="isExpired(doc)" value="Vencido" severity="danger" [style]="{'font-size':'11px','margin-left':'8px'}" />
                                    <p-tag *ngIf="!isExpired(doc) && getDaysUntil(doc) <= 30" [value]="getDaysUntil(doc) + ' días'" severity="warn" [style]="{'font-size':'11px','margin-left':'8px'}" />
                                </div>
                            </div>
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteDoc(doc)" />
                        </div>
                    </div>
                </ng-template>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveDriver()" />
                </ng-template>
            </p-dialog>

            <!-- Add Document Dialog -->
            <p-dialog [(visible)]="docDialog" [style]="{ width: '400px' }" header="Nuevo Documento" [modal]="true" styleClass="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <label>Tipo</label>
                            <p-select [options]="docTypes" [(ngModel)]="newDoc.type" optionLabel="label" optionValue="value" placeholder="Seleccionar tipo" appendTo="body" styleClass="w-full" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>Descripción</label>
                            <input type="text" pInputText [(ngModel)]="newDoc.description" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>Fecha de Vencimiento</label>
                            <p-datepicker [(ngModel)]="newDoc.expiryDate" dateFormat="dd/mm/yy" appendTo="body" styleClass="w-full" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label>Notas</label>
                            <input type="text" pInputText [(ngModel)]="newDoc.notes" />
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="docDialog = false" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveDoc()" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, FormsModule, ToastModule, HelpButtonComponent, TagModule, SelectModule, DatePickerModule, DividerModule],
    providers: [MessageService]
})
export class DriverList implements OnInit {
    drivers: Driver[] = [];
    driver: Driver = { name: '' };
    loading: boolean = true;
    driverDialog: boolean = false;
    submitted: boolean = false;

    // Documents
    driverDocuments: DocumentRecord[] = [];
    docDialog: boolean = false;
    newDoc: any = { type: '', description: '', expiryDate: null, notes: '' };
    docTypes = [
        { label: 'Licencia de Conducir', value: 'DRIVER_LICENSE' },
        { label: 'Certificado Médico', value: 'DRIVER_MEDICAL' },
        { label: 'Habilitación de Transporte', value: 'TRANSPORT_PERMIT' },
        { label: 'Otro', value: 'OTHER' }
    ];

    constructor(private driverService: DriverService, private messageService: MessageService, private documentService: DocumentService) {}

    ngOnInit() {
        this.loadDrivers();
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
        this.driverDocuments = [];
        this.driverDialog = true;
    }

    editDriver(driver: Driver) {
        this.driver = { ...driver };
        this.driverDialog = true;
        if (driver.id) this.loadDriverDocuments(driver.id);
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

    hideDialog() {
        this.driverDialog = false;
        this.submitted = false;
    }

    async saveDriver() {
        this.submitted = true;

        if (this.driver.name?.trim()) {
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
            } catch (error) {
                 this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el chofer' });
            }
        }
    }

    // Document methods
    async loadDriverDocuments(driverId: number) {
        try {
            this.driverDocuments = await this.documentService.getDriverDocuments(driverId);
        } catch {
            this.driverDocuments = [];
        }
    }

    openDocDialog() {
        this.newDoc = { type: '', description: '', expiryDate: null, notes: '' };
        this.docDialog = true;
    }

    async saveDoc() {
        if (!this.newDoc.type || !this.newDoc.expiryDate || !this.driver.id) return;
        try {
            await this.documentService.createDriverDocument(this.driver.id, this.newDoc);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Documento agregado', life: 3000 });
            this.docDialog = false;
            this.loadDriverDocuments(this.driver.id);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el documento' });
        }
    }

    async deleteDoc(doc: DocumentRecord) {
        if (!doc.id) return;
        if (confirm('¿Eliminar este documento?')) {
            try {
                await this.documentService.deleteDocument(doc.id, 'driver');
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Documento eliminado', life: 3000 });
                if (this.driver.id) this.loadDriverDocuments(this.driver.id);
            } catch {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
            }
        }
    }

    getDocTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            DRIVER_LICENSE: 'Licencia de Conducir',
            DRIVER_MEDICAL: 'Certificado Médico',
            TRANSPORT_PERMIT: 'Habilitación de Transporte',
            OTHER: 'Otro'
        };
        return labels[type] || type;
    }

    formatDate(date: any): string {
        return new Date(date).toLocaleDateString('es-AR');
    }

    isExpired(doc: DocumentRecord): boolean {
        return new Date(doc.expiryDate) < new Date();
    }

    getDaysUntil(doc: DocumentRecord): number {
        return Math.ceil((new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    }
}

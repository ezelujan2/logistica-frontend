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
import { HelpButtonComponent } from '../../shared/help-button.component';
import { DocumentService, DocumentRecord } from '../../service/document.service';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';

@Component({
    selector: 'app-vehicle-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="flex items-center gap-2 font-semibold text-xl mb-4">Autos <app-help-button pageKey="vehicles" /></div>
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

                    <!-- Documents Section (only when editing) -->
                    <div *ngIf="vehicle.id" class="mt-4">
                        <p-divider />
                        <div class="flex items-center justify-between mb-3">
                            <span class="font-semibold text-lg">Documentos</span>
                            <p-button label="Agregar" icon="pi pi-plus" [text]="true" size="small" (click)="openDocDialog()" />
                        </div>
                        <div *ngIf="vehicleDocuments.length === 0" class="text-gray-500 text-sm text-center py-4">
                            No hay documentos cargados.
                        </div>
                        <div *ngFor="let doc of vehicleDocuments" class="flex items-center justify-between p-3 mb-2 rounded-lg border border-gray-200 dark:border-gray-700">
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
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveVehicle()" />
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
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, FormsModule, SelectModule, ToastModule, HelpButtonComponent, TagModule, DatePickerModule, DividerModule],
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

    // Documents
    vehicleDocuments: DocumentRecord[] = [];
    docDialog: boolean = false;
    newDoc: any = { type: '', description: '', expiryDate: null, notes: '' };
    docTypes = [
        { label: 'Seguro del Vehículo', value: 'VEHICLE_INSURANCE' },
        { label: 'VTV', value: 'VEHICLE_VTV' },
        { label: 'Cédula del Vehículo', value: 'VEHICLE_REGISTRATION' },
        { label: 'Habilitación de Transporte', value: 'TRANSPORT_PERMIT' },
        { label: 'Otro', value: 'OTHER' }
    ];

    constructor(private vehicleService: VehicleService, private messageService: MessageService, private documentService: DocumentService) {}

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
        this.vehicleDocuments = [];
        this.vehicleDialog = true;
    }

    editVehicle(vehicle: Vehicle) {
        this.vehicle = { ...vehicle };
        this.vehicleDialog = true;
        if (vehicle.id) this.loadVehicleDocuments(vehicle.id);
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

    // Document methods
    async loadVehicleDocuments(vehicleId: number) {
        try {
            this.vehicleDocuments = await this.documentService.getVehicleDocuments(vehicleId);
        } catch {
            this.vehicleDocuments = [];
        }
    }

    openDocDialog() {
        this.newDoc = { type: '', description: '', expiryDate: null, notes: '' };
        this.docDialog = true;
    }

    async saveDoc() {
        if (!this.newDoc.type || !this.newDoc.expiryDate || !this.vehicle.id) return;
        try {
            await this.documentService.createVehicleDocument(this.vehicle.id, this.newDoc);
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Documento agregado', life: 3000 });
            this.docDialog = false;
            this.loadVehicleDocuments(this.vehicle.id);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el documento' });
        }
    }

    async deleteDoc(doc: DocumentRecord) {
        if (!doc.id) return;
        if (confirm('¿Eliminar este documento?')) {
            try {
                await this.documentService.deleteDocument(doc.id, 'vehicle');
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Documento eliminado', life: 3000 });
                if (this.vehicle.id) this.loadVehicleDocuments(this.vehicle.id);
            } catch {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
            }
        }
    }

    getDocTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            VEHICLE_INSURANCE: 'Seguro del Vehículo',
            VEHICLE_VTV: 'VTV',
            VEHICLE_REGISTRATION: 'Cédula del Vehículo',
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

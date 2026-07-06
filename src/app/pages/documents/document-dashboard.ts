import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { HelpButtonComponent } from '../../shared/help-button.component';
import { DocumentService, DocumentRecord } from '../../service/document.service';

@Component({
    selector: 'app-document-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        TagModule,
        CardModule,
        DividerModule,
        ToastModule,
        DialogModule,
        FormsModule,
        SelectModule,
        DatePickerModule,
        InputTextModule,
        HelpButtonComponent
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="grid grid-cols-12 gap-6">

            <!-- Title -->
            <div class="col-span-12 flex items-center gap-2">
                <span class="font-semibold text-xl">Vencimientos de Documentos</span>
                <app-help-button pageKey="documents" />
            </div>

            <!-- Summary Cards -->
            <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <div class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">Total Documentos</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalCount }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <i class="pi pi-file text-blue-500 text-xl"></i>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <div class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">Vencidos</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ expiredCount }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full">
                        <i class="pi pi-times-circle text-red-500 text-xl"></i>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <div class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">Proximos 7 dias</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ next7Count }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <i class="pi pi-exclamation-triangle text-orange-500 text-xl"></i>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <div class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">Proximos 30 dias</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ next30Count }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                        <i class="pi pi-clock text-yellow-500 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Documents Table -->
            <div class="col-span-12">
                <div class="card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow rounded-xl">
                    <div class="flex justify-between items-center mb-4 px-4 pt-4">
                        <h5 class="text-lg font-bold m-0">Documentos por Vencer / Vencidos</h5>
                    </div>
                    <p-table
                        [value]="documents"
                        [loading]="loading"
                        [paginator]="true"
                        [rows]="15"
                        [rowsPerPageOptions]="[10, 15, 25, 50]"
                        [rowHover]="true"
                        [sortField]="'expiryDate'"
                        [sortOrder]="1"
                        styleClass="p-datatable-sm"
                        responsiveLayout="scroll"
                    >
                        <ng-template pTemplate="header">
                            <tr>
                                <th pSortableColumn="type">Tipo <p-sortIcon field="type"></p-sortIcon></th>
                                <th pSortableColumn="entityName">Entidad <p-sortIcon field="entityName"></p-sortIcon></th>
                                <th>Descripcion</th>
                                <th pSortableColumn="expiryDate">Vencimiento <p-sortIcon field="expiryDate"></p-sortIcon></th>
                                <th>Estado</th>
                                <th pSortableColumn="daysUntilExpiry">Dias <p-sortIcon field="daysUntilExpiry"></p-sortIcon></th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-doc>
                            <tr>
                                <td class="font-medium">{{ getDocTypeLabel(doc.type) }}</td>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <i [class]="doc.entityType === 'driver' ? 'pi pi-user text-blue-500' : 'pi pi-car text-green-500'"></i>
                                        <span>{{ doc.entityName || '-' }}</span>
                                    </div>
                                </td>
                                <td class="text-sm text-gray-600 dark:text-gray-400">{{ doc.description || '-' }}</td>
                                <td class="whitespace-nowrap">{{ formatDate(doc.expiryDate) }}</td>
                                <td>
                                    <p-tag [value]="getStatusLabel(doc)" [severity]="getStatusSeverity(doc)"></p-tag>
                                </td>
                                <td>
                                    <span
                                        class="font-bold"
                                        [ngClass]="{
                                            'text-red-500': doc.isExpired || doc.daysUntilExpiry < 0,
                                            'text-orange-500': !doc.isExpired && doc.daysUntilExpiry >= 0 && doc.daysUntilExpiry < 7,
                                            'text-gray-600 dark:text-gray-400': !doc.isExpired && doc.daysUntilExpiry >= 7
                                        }"
                                    >
                                        {{ doc.daysUntilExpiry }}
                                    </span>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center p-4 text-gray-500">No hay documentos proximos a vencer.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

        </div>
    `
})
export class DocumentDashboard implements OnInit {
    documents: DocumentRecord[] = [];
    loading: boolean = true;

    get totalCount(): number {
        return this.documents.length;
    }

    get expiredCount(): number {
        return this.documents.filter(d => d.isExpired).length;
    }

    get next7Count(): number {
        return this.documents.filter(d => !d.isExpired && d.daysUntilExpiry !== undefined && d.daysUntilExpiry >= 0 && d.daysUntilExpiry <= 7).length;
    }

    get next30Count(): number {
        return this.documents.filter(d => !d.isExpired && d.daysUntilExpiry !== undefined && d.daysUntilExpiry >= 0 && d.daysUntilExpiry <= 30).length;
    }

    constructor(
        private documentService: DocumentService,
        private messageService: MessageService
    ) {}

    async ngOnInit() {
        await this.loadDocuments();
    }

    async loadDocuments() {
        this.loading = true;
        try {
            this.documents = await this.documentService.getExpiringDocuments(60);
        } catch (error) {
            console.error('Error loading documents', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar los documentos.'
            });
            this.documents = [];
        } finally {
            this.loading = false;
        }
    }

    getDocTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'DRIVER_LICENSE': 'Licencia de Conducir',
            'DRIVER_MEDICAL': 'Certificado Medico',
            'VEHICLE_INSURANCE': 'Seguro del Vehiculo',
            'VEHICLE_VTV': 'VTV',
            'VEHICLE_REGISTRATION': 'Cedula del Vehiculo',
            'TRANSPORT_PERMIT': 'Habilitacion de Transporte',
            'OTHER': 'Otro'
        };
        return labels[type] || type;
    }

    getStatusSeverity(doc: DocumentRecord): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
        if (doc.isExpired) return 'danger';
        if (doc.daysUntilExpiry !== undefined) {
            if (doc.daysUntilExpiry <= 7) return 'warn';
            if (doc.daysUntilExpiry <= 15) return 'warn';
            if (doc.daysUntilExpiry <= 30) return 'info';
        }
        return 'success';
    }

    getStatusLabel(doc: DocumentRecord): string {
        if (doc.isExpired) return 'Vencido';
        if (doc.daysUntilExpiry !== undefined) {
            if (doc.daysUntilExpiry <= 7) return 'Urgente';
            if (doc.daysUntilExpiry <= 15) return 'Proximo';
            if (doc.daysUntilExpiry <= 30) return 'Atencion';
        }
        return 'Vigente';
    }

    formatDate(date: Date | string): string {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('es-AR');
    }
}

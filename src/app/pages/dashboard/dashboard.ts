import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { PanelMenuModule } from 'primeng/panelmenu';
import { Service, ServiceService } from '../../service/service.service';
import { AuditService, AuditLog } from '../../service/audit.service';
import { AuthService } from '../../service/auth.service';
import { StuckServicesService, StuckService } from '../../service/stuck-services.service';
import { StatisticsService } from '../../service/statistics.service';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, StyleClassModule, PanelMenuModule, TagModule, CardModule, DividerModule, SkeletonModule, DialogModule, InputTextModule, SelectModule, FormsModule],
    template: `
        <div class="grid grid-cols-12 gap-6">

            <!-- Quick Stats -->
            <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <div class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">Viajes Hoy</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ todayCount }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <i class="pi pi-car text-blue-500 text-xl"></i>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <div class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">Pendientes Acción</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ pendingActionCount }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <i class="pi pi-exclamation-circle text-orange-500 text-xl"></i>
                    </div>
                </div>
            </div>

             <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <div class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">A Facturar</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ pendingInvoiceCount }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <i class="pi pi-file text-purple-500 text-xl"></i>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-6 lg:col-span-3">
                 <!-- Payment Pending -->
                  <div class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">Falta Pago</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ paymentPendingCount }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full">
                        <i class="pi pi-wallet text-red-500 text-xl"></i>
                    </div>
                </div>
                </div>

            <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <div
                    class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between"
                    [ngClass]="{ 'cursor-pointer hover:border-amber-300 dark:hover:border-amber-700': stuckServices.length > 0 }"
                    (click)="scrollToStuckServices()"
                >
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">Estancados</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stuckServices.length }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <i class="pi pi-clock text-amber-500 text-xl"></i>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-6 lg:col-span-3">
                <div class="bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <span class="block text-gray-500 font-medium mb-1">Por Cobrar Vencido</span>
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ receivables?.overdueCount ?? 0 }}</div>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center bg-rose-100 dark:bg-rose-900/30 rounded-full">
                        <i class="pi pi-exclamation-triangle text-rose-500 text-xl"></i>
                    </div>
                </div>
            </div>

            <!-- Upcoming Services -->
            <div class="col-span-12 xl:col-span-7">
                <div class="card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow rounded-xl h-full">
                    <div class="flex justify-between items-center mb-4 px-4 pt-4">
                        <h5 class="text-lg font-bold m-0">Próximos Servicios (7 días)</h5>
                        <p-button icon="pi pi-arrow-right" [text]="true" label="Ver todos" (click)="goToServices()"></p-button>
                    </div>

                    <div class="h-[35rem] overflow-y-auto">
                        <p-table [value]="upcomingServices" [loading]="loading" [rowHover]="true" styleClass="p-datatable-sm" responsiveLayout="scroll">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Fecha</th>
                                    <th style="min-width: 10rem">Cliente</th>
                                    <th>Trayecto</th>
                                    <th>Detalles</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-service>
                                <tr>
                                    <td class="font-semibold whitespace-nowrap">{{ service.startDate | date:'dd/MM HH:mm' }}</td>
                                    <td class="text-sm">
                                        <span *ngIf="service.clients && service.clients.length > 0">{{ service.clients[0].name }}</span>
                                        <span *ngIf="!service.clients || service.clients.length === 0" class="text-gray-400 italic">--</span>
                                    </td>
                                    <td>
                                        <div class="flex flex-col text-sm">
                                            <span class="font-medium">{{ service.origin }}</span>
                                            <span class="text-xs text-gray-500">{{ service.destination }}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="text-sm text-gray-600 dark:text-gray-400">{{ service.details || '-' }}</span>
                                    </td>
                                    <td><p-tag [value]="getMmStatusLabel(service.status)" [severity]="getSeverity(service.status)" [style]="{'font-size': '12px', 'padding': '2px 8px'}"></p-tag></td>
                                    <td>
                                        <p-button icon="pi pi-search" [rounded]="true" [text]="true" (click)="goToServiceDetail(service)"></p-button>
                                    </td>
                                </tr>
                            </ng-template>
                             <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="5" class="text-center p-4 text-gray-500">No hay servicios programados para los próximos días.</td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>
            </div>

            <!-- Pending Tasks -->
            <div class="col-span-12 xl:col-span-5">
                 <div class="card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow rounded-xl h-full flex flex-col">
                    <div class="flex justify-between items-center mb-4 px-4 pt-4">
                        <h5 class="text-lg font-bold m-0">Tareas Pendientes</h5>
                         <span class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{{ pendingServices.length }} pendientes</span>
                    </div>

                    <div class="flex flex-col gap-3 px-4 pb-4 h-[35rem] overflow-y-auto">
                        <ng-container *ngIf="loading">
                             <p-skeleton height="4rem" styleClass="mb-2"></p-skeleton>
                             <p-skeleton height="4rem" styleClass="mb-2"></p-skeleton>
                             <p-skeleton height="4rem" styleClass="mb-2"></p-skeleton>
                        </ng-container>

                         <div *ngFor="let task of pendingServices" class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" (click)="goToServiceDetail(task)">
                            <div class="flex items-center gap-3">
                                <div class="w-2 h-12 rounded-full" [ngClass]="getStatusColor(task.status)"></div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-sm">{{ getTaskAction(task.status) }}</span>
                                    <span class="text-xs text-gray-500">{{ task.startDate | date:'dd/MM' }} - {{ getClientName(task) }}</span>
                                </div>
                            </div>
                            <i class="pi pi-chevron-right text-gray-400"></i>
                         </div>

                         <div *ngIf="!loading && pendingServices.length === 0" class="text-center py-8 text-gray-500">
                             <i class="pi pi-check-circle text-4xl text-green-500 mb-2"></i>
                             <p>¡Todo al día! No hay tareas pendientes.</p>
                         </div>
                     </div>
                 </div>
            </div>

            <!-- Servicios Estancados -->
            <div class="col-span-12" id="stuck-services-section" *ngIf="stuckServices.length > 0">
                <div class="card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow rounded-xl">
                    <div class="flex justify-between items-center mb-4 px-4 pt-4">
                        <h5 class="text-lg font-bold m-0">Servicios Estancados</h5>
                        <span class="text-xs text-gray-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">{{ stuckServices.length }} fuera de su ciclo normal</span>
                    </div>
                    <p-table [value]="stuckServices" [rows]="10" [paginator]="stuckServices.length > 10" styleClass="p-datatable-sm" responsiveLayout="scroll">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Cliente</th>
                                <th>Trayecto</th>
                                <th>Estado</th>
                                <th>Fase</th>
                                <th class="text-right">Días estancado</th>
                                <th></th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-s>
                            <tr>
                                <td class="text-sm">{{ s.clientName || 'Sin cliente' }}</td>
                                <td class="text-sm">{{ s.origin }} → {{ s.destination }}</td>
                                <td><p-tag [value]="getMmStatusLabel(s.status)" [severity]="getSeverity(s.status)"></p-tag></td>
                                <td class="text-sm">{{ s.phase === 'facturacion' ? 'Sin facturar' : 'Sin cobrar' }}</td>
                                <td class="text-right font-semibold text-amber-600">{{ s.daysStuck }}d <span class="text-xs text-gray-400 font-normal">(normal: {{ s.thresholdDays }}d)</span></td>
                                <td>
                                    <p-button icon="pi pi-search" [rounded]="true" [text]="true" (click)="goToServiceDetail(s)"></p-button>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

            <!-- Audit Logs Table -->
            <div class="col-span-12" *ngIf="authService.hasPermission('viewAudits')">
                <div class="card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow rounded-xl">
                    <div class="flex justify-between items-center mb-4 px-4 pt-4">
                        <h5 class="text-lg font-bold m-0">Registro de Auditoría</h5>
                    </div>
                    <p-table
                        #dtAudits
                        [value]="audits"
                        [loading]="loading"
                        [paginator]="true"
                        [rows]="10"
                        [rowsPerPageOptions]="[10, 25, 50]"
                        [globalFilterFields]="['entity', 'action', 'user.name', 'entityId']"
                        [rowHover]="true"
                        styleClass="p-datatable-sm"
                        responsiveLayout="scroll"
                    >
                        <ng-template pTemplate="caption">
                            <div class="flex justify-end p-2">
                                <span class="p-input-icon-left w-full sm:w-auto">
                                    <i class="pi pi-search"></i>
                                    <input pInputText type="text" (input)="onGlobalFilter(dtAudits, $event)" placeholder="Buscar en auditoría..." class="w-full sm:w-auto" />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th pSortableColumn="createdAt">Fecha <p-sortIcon field="createdAt"></p-sortIcon></th>
                                <th pSortableColumn="user.name">Usuario <p-sortIcon field="user.name"></p-sortIcon>
                                    <p-columnFilter type="text" field="user.name" display="menu"></p-columnFilter>
                                </th>
                                <th pSortableColumn="action">Acción <p-sortIcon field="action"></p-sortIcon>
                                    <p-columnFilter type="text" field="action" display="menu"></p-columnFilter>
                                </th>
                                <th pSortableColumn="entity">Módulo <p-sortIcon field="entity"></p-sortIcon>
                                    <p-columnFilter field="entity" matchMode="equals" display="menu">
                                        <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                                            <p-select [ngModel]="value" [options]="auditModules" (onChange)="filter($event.value)" placeholder="Todos" [showClear]="true">
                                                <ng-template let-option pTemplate="item">
                                                    <span class="ml-2">{{option.label}}</span>
                                                </ng-template>
                                            </p-select>
                                        </ng-template>
                                    </p-columnFilter>
                                </th>
                                <th>Registro ID</th>
                                <th>Qué cambió</th>
                                <th>Detalles</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-audit>
                            <tr>
                                <td>{{ audit.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                                <td>{{ audit.user?.name || 'Sistema' }}</td>
                                <td>
                                    <p-tag [value]="getAuditActionLabel(audit.action)" [severity]="getAuditActionSeverity(audit.action)"></p-tag>
                                </td>
                                <td>{{ getEntityLabel(audit.entity) }}</td>
                                <td>#{{ audit.entityId }}</td>
                                <td>
                                    <!-- Cambio de estado: muestra old → new con badges -->
                                    <ng-container *ngIf="getStatusChange(audit) as sc">
                                        <div class="flex items-center gap-1 flex-wrap">
                                            <p-tag [value]="translateStatus(sc.from)" [severity]="getStatusSeverity(sc.from)" styleClass="text-xs"></p-tag>
                                            <i class="pi pi-arrow-right text-xs text-color-secondary"></i>
                                            <p-tag [value]="translateStatus(sc.to)" [severity]="getStatusSeverity(sc.to)" styleClass="text-xs"></p-tag>
                                        </div>
                                    </ng-container>
                                    <!-- Si no hay cambio de estado, mostrar resumen de otros campos clave -->
                                    <ng-container *ngIf="!getStatusChange(audit)">
                                        <span class="text-xs text-color-secondary">{{ getAuditSummary(audit) }}</span>
                                    </ng-container>
                                </td>
                                <td>
                                    <p-button icon="pi pi-eye" [text]="true" [rounded]="true" (click)="viewAuditDetails(audit)"></p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7" class="text-center p-4">No hay registros de auditoría.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

        </div>

        <p-dialog *ngIf="authService.hasPermission('viewAudits')" [(visible)]="displayAuditDialog" [header]="'Detalles de Auditoría - ' + selectedAudit?.entity + ' #' + selectedAudit?.entityId" [modal]="true" [style]="{width: '50vw'}" [breakpoints]="{'960px': '75vw', '640px': '100vw'}" [draggable]="false" [resizable]="false">
            <div *ngIf="selectedAudit">
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <span class="font-bold text-gray-700 block mb-1">Acción</span>
                        <p-tag [value]="selectedAudit.action" [severity]="getAuditActionSeverity(selectedAudit.action)"></p-tag>
                    </div>
                    <div>
                        <span class="font-bold text-gray-700 block mb-1">Usuario</span>
                        <span>{{ selectedAudit.user?.name || 'Sistema' }} ({{ selectedAudit.user?.email || 'N/A' }})</span>
                    </div>
                    <div>
                        <span class="font-bold text-gray-700 block mb-1">Fecha</span>
                        <span>{{ selectedAudit.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="col-span-1 md:col-span-2" *ngIf="selectedAudit.oldData || selectedAudit.newData">
                        <span class="font-bold text-gray-700 dark:text-gray-300 block mb-2">Campos alterados</span>
                        <div class="bg-surface-100 dark:bg-surface-800 rounded p-3 overflow-x-auto">
                            <table class="w-full text-sm text-left">
                                <thead>
                                    <tr class="border-b border-surface-300 dark:border-surface-600">
                                        <th class="py-2 px-3 font-semibold text-color-secondary">Campo</th>
                                        <th class="py-2 px-3 font-semibold text-color-secondary w-2/5">Antes</th>
                                        <th class="py-2 px-3 font-semibold text-color-secondary w-2/5">Después</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let diff of auditDiffs" class="border-b border-surface-200 dark:border-surface-700">
                                        <td class="py-2 px-3 font-medium text-sm">{{ getFieldLabel(diff.key) }}</td>
                                        <td class="py-2 px-3">
                                            <ng-container *ngIf="isRelationArray(diff.oldValue) || isRelationArray(diff.newValue); else scalarOld">
                                                <div class="flex flex-wrap gap-1">
                                                    <span *ngFor="let item of getRelationDiff(diff.oldValue, diff.newValue).removed"
                                                          class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-xs line-through">{{ item }}</span>
                                                    <span *ngIf="getRelationDiff(diff.oldValue, diff.newValue).removed.length === 0" class="text-color-secondary italic text-xs">—</span>
                                                </div>
                                            </ng-container>
                                            <ng-template #scalarOld>
                                                <ng-container *ngIf="diff.oldValue !== undefined && diff.oldValue !== null; else oldEmpty">
                                                    <p-tag *ngIf="diff.key === 'status'" [value]="translateStatus(diff.oldValue)" [severity]="getStatusSeverity(diff.oldValue)" styleClass="text-xs"></p-tag>
                                                    <span *ngIf="diff.key !== 'status'" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-xs break-all">{{ formatDiffValue(diff.key, diff.oldValue) }}</span>
                                                </ng-container>
                                                <ng-template #oldEmpty><span class="text-color-secondary italic text-xs">—</span></ng-template>
                                            </ng-template>
                                        </td>
                                        <td class="py-2 px-3">
                                            <ng-container *ngIf="isRelationArray(diff.oldValue) || isRelationArray(diff.newValue); else scalarNew">
                                                <div class="flex flex-wrap gap-1">
                                                    <span *ngFor="let item of getRelationDiff(diff.oldValue, diff.newValue).added"
                                                          class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs">{{ item }}</span>
                                                    <span *ngIf="getRelationDiff(diff.oldValue, diff.newValue).added.length === 0" class="text-color-secondary italic text-xs">—</span>
                                                </div>
                                            </ng-container>
                                            <ng-template #scalarNew>
                                                <ng-container *ngIf="diff.newValue !== undefined && diff.newValue !== null; else newEmpty">
                                                    <p-tag *ngIf="diff.key === 'status'" [value]="translateStatus(diff.newValue)" [severity]="getStatusSeverity(diff.newValue)" styleClass="text-xs"></p-tag>
                                                    <span *ngIf="diff.key !== 'status'" class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs break-all">{{ formatDiffValue(diff.key, diff.newValue) }}</span>
                                                </ng-container>
                                                <ng-template #newEmpty><span class="text-color-secondary italic text-xs">—</span></ng-template>
                                            </ng-template>
                                        </td>
                                    </tr>
                                    <tr *ngIf="auditDiffs.length === 0">
                                        <td colspan="3" class="py-4 text-center text-color-secondary italic">Sin cambios detectables.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Toggle to raw JSON -->
                <div class="mt-4" *ngIf="selectedAudit.oldData || selectedAudit.newData">
                    <p-button [text]="true" [rounded]="true" [icon]="showRawJson ? 'pi pi-table' : 'pi pi-code'" (click)="showRawJson = !showRawJson" [label]="showRawJson ? 'Ver Diferencias' : 'Ver JSON Completo'" styleClass="p-button-sm p-button-secondary"></p-button>
                </div>

                <!-- Raw JSON View -->
                <div *ngIf="showRawJson && (selectedAudit.oldData || selectedAudit.newData)" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div *ngIf="selectedAudit.oldData">
                        <span class="font-bold text-red-600 block mb-2"><i class="pi pi-minus-circle mr-1"></i>Datos Anteriores</span>
                        <pre class="bg-red-50 border border-red-200 p-3 rounded text-xs overflow-x-auto max-h-80 overflow-y-auto">{{ selectedAudit.oldData | json }}</pre>
                    </div>
                    <div *ngIf="selectedAudit.newData">
                        <span class="font-bold text-green-600 block mb-2"><i class="pi pi-plus-circle mr-1"></i>Datos Nuevos</span>
                        <pre class="bg-green-50 border border-green-200 p-3 rounded text-xs overflow-x-auto max-h-80 overflow-y-auto">{{ selectedAudit.newData | json }}</pre>
                    </div>
                </div>

            </div>
            <ng-template pTemplate="footer">
                <p-button icon="pi pi-check" (click)="displayAuditDialog=false" label="Cerrar" styleClass="p-button-text"></p-button>
            </ng-template>
        </p-dialog>
    `
})
export class Dashboard implements OnInit {
    upcomingServices: Service[] = [];
    pendingServices: Service[] = [];
    audits: AuditLog[] = [];
    loading: boolean = true;

    todayCount: number = 0;
    pendingActionCount: number = 0;
    pendingInvoiceCount: number = 0;
    paymentPendingCount: number = 0;
    upcomingCount: number = 0;

    stuckServices: StuckService[] = [];
    receivables: { totalPendingAmount: number; pendingCount: number; overdueCount: number } | null = null;

    displayAuditDialog: boolean = false;
    selectedAudit: AuditLog | null = null;
    auditModules: any[] = [];
    auditDiffs: { key: string, oldValue: any, newValue: any }[] = [];
    showRawJson: boolean = false;

    constructor(
        private serviceService: ServiceService,
        private auditService: AuditService,
        private stuckServicesService: StuckServicesService,
        private statisticsService: StatisticsService,
        private router: Router,
        public authService: AuthService
    ) {}

    async ngOnInit() {
        await this.loadDashboardData();
    }

    async loadDashboardData() {
        this.loading = true;
        try {
            const today = new Date();
            const startOfToday = new Date(today.setHours(0,0,0,0)); // midnight today

            const nextWeek = new Date(startOfToday); // clone
            nextWeek.setDate(nextWeek.getDate() + 7);

            // 1. Upcoming Services (Today + 6 days)
            // Use startOfToday to include earlier events today
            const upcomingRaw = await this.serviceService.getServices({
                startDate: startOfToday.toISOString(),
                endDate: nextWeek.toISOString()
            });

            // Filter out Cancelled for UI (user request: "ignore Cancelled")
            this.upcomingServices = upcomingRaw
                .filter(s => s.status !== 'CANCELLED')
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            this.upcomingCount = this.upcomingServices.length;

            // Calculate Today's count (All non-cancelled for Today)
            const endOfToday = new Date(startOfToday);
            endOfToday.setHours(23,59,59,999);

            this.todayCount = this.upcomingServices.filter(s => {
                const d = new Date(s.startDate);
                return d >= startOfToday && d <= endOfToday;
            }).length;


            // 2. Pending Tasks
            // Logic: All services that are NOT 'PAID' and NOT 'CANCELLED'
            const allActive = await this.serviceService.getServices({});

            this.pendingServices = allActive.filter(s => s.status !== 'PAID' && s.status !== 'CANCELLED');

            this.pendingActionCount = this.pendingServices.filter(s => ['PENDING', 'PENDING_DETAILS'].includes(s.status)).length;
            this.pendingInvoiceCount = this.pendingServices.filter(s => s.status === 'PENDING_INVOICE').length;
            this.paymentPendingCount = this.pendingServices.filter(s => s.status === 'PAYMENT_PENDING').length;

             // Sort pending by date asc
            this.pendingServices.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            // 3. Servicios estancados y cuentas por cobrar (solo si tiene permisos operativos)
            if (this.authService.hasPermission('manageOperations')) {
                try {
                    this.stuckServices = await this.stuckServicesService.getStuckServices();
                } catch (stuckError) {
                    console.error("Error loading stuck services", stuckError);
                    this.stuckServices = [];
                }
            }
            if (this.authService.hasPermission('viewStatistics')) {
                try {
                    this.receivables = await this.statisticsService.getReceivablesStats();
                } catch (receivablesError) {
                    console.error("Error loading receivables", receivablesError);
                    this.receivables = null;
                }
            }

            // 4. Audit Logs (solo si el rol tiene permiso de verlas)
            if (this.authService.hasPermission('viewAudits')) {
                try {
                    const fetchedAudits = await this.auditService.getAudits();
                    this.audits = fetchedAudits || [];

                    // Extract unique modules for the dropdown filter
                    const uniqueModules = Array.from(new Set(this.audits.map(a => a.entity)));
                    this.auditModules = uniqueModules.map(m => ({ label: m, value: m }));
                } catch (auditError) {
                    console.error("Error loading audits", auditError);
                    this.audits = [];
                }
            }

        } catch (error) {
            console.error("Error loading dashboard data", error);
        } finally {
            this.loading = false;
        }
    }

    goToServices() {
        this.router.navigate(['/app/services/all']);
    }

    scrollToStuckServices() {
        if (this.stuckServices.length === 0) return;
        document.getElementById('stuck-services-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    goToServiceDetail(service: Service | StuckService) {
        if (!service.id) return;
        this.router.navigate(['/app/services/all'], { queryParams: { id: service.id } });
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

    getMmStatusLabel(status: string) {
        const map: any = {
             'CREATED': 'Creado',
             'PENDING': 'Pendiente',
             'PENDING_DETAILS': 'Faltan Detalles',
             'PENDING_INVOICE': 'Falta Factura',
             'PAYMENT_PENDING': 'Falta Pago',
             'PAID': 'Pagado',
             'CANCELLED': 'Cancelado'
        };
        return map[status] || status;
    }

    getClientName(service: any): string {
        if (service.clients && service.clients.length > 0) return service.clients[0].name;
        return 'Sin Cliente';
    }

    getTaskAction(status: string): string {
        switch(status) {
            case 'PENDING': return 'Aprobar Ejecución';
            case 'PENDING_DETAILS': return 'Cargar Detalles (KM/Rec)';
            case 'PENDING_INVOICE': return 'Generar Factura';
            case 'PAYMENT_PENDING': return 'Registrar Cobro';
            default: return 'Revisar';
        }
    }

    getStatusColor(status: string): string {
         switch(status) {
            case 'PENDING': return 'bg-yellow-500';
            case 'PENDING_DETAILS': return 'bg-blue-500';
            case 'PENDING_INVOICE': return 'bg-purple-500';
            case 'PAYMENT_PENDING': return 'bg-orange-500';
            default: return 'bg-gray-500';
        }
    }

    getAuditActionSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
        const a = action?.toUpperCase();
        if (a === 'CREATE') return 'success';
        if (a === 'UPDATE') return 'info';
        if (a === 'DELETE') return 'danger';
        return 'contrast';
    }

    viewAuditDetails(audit: AuditLog) {
        this.selectedAudit = audit;
        this.showRawJson = false;
        this.auditDiffs = this.computeAuditDiff(audit.oldData, audit.newData, audit.action);
        this.displayAuditDialog = true;
    }

    private readonly STATUS_MAP: Record<string, string> = {
        CREATED: 'Creado', PENDING: 'Pendiente', PENDING_DETAILS: 'Env. Detalles',
        PENDING_INVOICE: 'A Facturar', PAYMENT_PENDING: 'Pend. Pago', PAID: 'Pagado',
        CANCELLED: 'Cancelado', ISSUED: 'Emitida', PROCESSED: 'Procesada',
        DRAFT: 'Borrador', ACTIVE: 'Activo', INACTIVE: 'Inactivo',
    };

    private readonly STATUS_SEVERITY: Record<string, string> = {
        CREATED: 'secondary', PENDING: 'warn', PENDING_DETAILS: 'info',
        PENDING_INVOICE: 'contrast', PAYMENT_PENDING: 'danger', PAID: 'success',
        CANCELLED: 'danger', ISSUED: 'info', PROCESSED: 'info',
        DRAFT: 'secondary', ACTIVE: 'success', INACTIVE: 'secondary',
    };

    private readonly ENTITY_LABELS: Record<string, string> = {
        Service: 'Servicio', Invoice: 'Factura', ServiceGroup: 'Grupo',
        Settlement: 'Liquidación', Driver: 'Chofer', Client: 'Cliente',
        Vehicle: 'Vehículo', Advance: 'Adelanto', Expense: 'Gasto',
        User: 'Usuario', ServiceDetail: 'Detalle',
    };

    private readonly FIELD_LABELS: Record<string, string> = {
        status: 'Estado', invoiceNumber: 'Nro. Factura',
        total_amount: 'Total', net_amount: 'Neto', tax_amount: 'IVA',
        driver_amount: 'Monto Chofer', discount_percentage: 'Descuento %',
        startDate: 'Fecha Inicio', endDate: 'Fecha Fin',
        origin: 'Origen', destination: 'Destino',
        details: 'Detalles', notes: 'Notas',
        serviceType: 'Tipo', billing_type: 'Tipo Facturación',
        km_traveled: 'KM Recorridos', waiting_hours: 'Horas Espera',
        name: 'Nombre', email: 'Email', code: 'Código',
        paymentDate: 'Fecha de Pago',
    };

    private readonly SKIP_FIELDS = new Set([
        'updatedAt', 'createdAt', 'id', 'userId', 'driverId', 'clientId', 'vehicleId',
        'km_price_snapshot', 'hour_price_snapshot', 'extra_km_price_snapshot',
        'driver_km_price_snapshot', 'driver_hour_price_snapshot',
        'waiting_surcharge_amount', 'extra_km_traveled', 'google_event_id',
        'apply_waiting_surcharge', 'is_vat_exempt',
    ]);

    getEntityLabel(entity: string): string {
        return this.ENTITY_LABELS[entity] || entity;
    }

    getAuditActionLabel(action: string): string {
        return { CREATE: 'Alta', UPDATE: 'Modificación', DELETE: 'Eliminación' }[action] || action;
    }

    translateStatus(status: string): string {
        return this.STATUS_MAP[status] || status;
    }

    getStatusSeverity(status: string): any {
        return this.STATUS_SEVERITY[status] || 'secondary';
    }

    getStatusChange(audit: AuditLog): { from: string; to: string } | null {
        if (audit.action !== 'UPDATE' || !audit.oldData || !audit.newData) return null;
        if (audit.oldData.status !== audit.newData.status &&
            audit.oldData.status !== undefined && audit.newData.status !== undefined) {
            return { from: audit.oldData.status, to: audit.newData.status };
        }
        return null;
    }

    getAuditSummary(audit: AuditLog): string {
        if (audit.action === 'CREATE') return `Alta de ${this.getEntityLabel(audit.entity).toLowerCase()}`;
        if (audit.action === 'DELETE') return `Eliminación de ${this.getEntityLabel(audit.entity).toLowerCase()}`;
        if (audit.action === 'UPDATE' && audit.oldData && audit.newData) {
            const changed = Object.keys(audit.newData)
                .filter(k => !this.SKIP_FIELDS.has(k) && JSON.stringify(audit.oldData[k]) !== JSON.stringify(audit.newData[k]))
                .map(k => this.FIELD_LABELS[k] || k);
            return changed.length > 0 ? changed.slice(0, 3).join(', ') : 'Sin cambios visibles';
        }
        return '—';
    }

    getFieldLabel(key: string): string {
        return this.FIELD_LABELS[key] || key;
    }

    shouldShowField(key: string): boolean {
        return !this.SKIP_FIELDS.has(key);
    }

    isRelationArray(value: any): boolean {
        return Array.isArray(value);
    }

    getRelationDiff(oldArr: any[], newArr: any[]): { added: string[]; removed: string[] } {
        const label = (item: any) =>
            item.name ?? item.code ?? item.invoiceNumber ?? item.email ?? `#${item.id}`;
        const oldMap = new Map((oldArr ?? []).map((x: any) => [x.id, label(x)]));
        const newMap = new Map((newArr ?? []).map((x: any) => [x.id, label(x)]));
        const removed = [...oldMap.entries()].filter(([id]) => !newMap.has(id)).map(([, n]) => n);
        const added   = [...newMap.entries()].filter(([id]) => !oldMap.has(id)).map(([, n]) => n);
        return { added, removed };
    }

    formatDiffValue(key: string, value: any): string {
        if (value === null || value === undefined) return '—';
        if (['total_amount','net_amount','tax_amount','driver_amount'].includes(key)) {
            return `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('Date')) {
            try { return new Date(value).toLocaleString('es-AR'); } catch { return String(value); }
        }
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    computeAuditDiff(oldData: any, newData: any, action: string): { key: string, oldValue: any, newValue: any }[] {
        const diffs: { key: string, oldValue: any, newValue: any }[] = [];

        if (action === 'CREATE' && newData) {
            Object.keys(newData).filter(k => this.shouldShowField(k) && newData[k] !== null).forEach(key => {
                diffs.push({ key, oldValue: undefined, newValue: newData[key] });
            });
            return diffs;
        }

        if (action === 'DELETE' && oldData) {
            Object.keys(oldData).filter(k => this.shouldShowField(k) && oldData[k] !== null).forEach(key => {
                diffs.push({ key, oldValue: oldData[key], newValue: undefined });
            });
            return diffs;
        }

        if (action === 'UPDATE' && oldData && newData) {
            const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
            allKeys.filter(k => this.shouldShowField(k)).forEach(key => {
                const oldVal = oldData[key];
                const newVal = newData[key];
                // Ignorar campos relacionales (arrays) — oldData no los trae, newData sí
                if (Array.isArray(oldVal) || Array.isArray(newVal)) {
                    // Comparar relaciones por conjunto de IDs
                    const oldIds = new Set((oldVal ?? []).map((x: any) => x.id));
                    const newIds = new Set((newVal ?? []).map((x: any) => x.id));
                    const changed = oldIds.size !== newIds.size ||
                        [...oldIds].some(id => !newIds.has(id));
                    if (changed) diffs.push({ key, oldValue: oldVal ?? [], newValue: newVal ?? [] });
                    return;
                }
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    if (key === 'status') diffs.unshift({ key, oldValue: oldVal, newValue: newVal });
                    else diffs.push({ key, oldValue: oldVal, newValue: newVal });
                }
            });
            return diffs;
        }

        return diffs;
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}

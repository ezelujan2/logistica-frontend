import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { PanelMenuModule } from 'primeng/panelmenu';
import { Service, ServiceService } from '../../service/service.service';
import { AuditService, AuditLog } from '../../service/audit.service';
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

            <!-- Upcoming Services -->



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

            <!-- Audit Logs Table -->
            <div class="col-span-12">
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
                                <th>Detalles</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-audit>
                            <tr>
                                <td>{{ audit.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                                <td>{{ audit.user?.name || 'Sistema' }}</td>
                                <td>
                                    <p-tag [value]="audit.action" [severity]="getAuditActionSeverity(audit.action)"></p-tag>
                                </td>
                                <td>{{ audit.entity }}</td>
                                <td>#{{ audit.entityId }}</td>
                                <td>
                                    <p-button icon="pi pi-eye" [text]="true" [rounded]="true" (click)="viewAuditDetails(audit)"></p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center p-4">No hay registros de auditoría.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

        </div>

        <p-dialog [(visible)]="displayAuditDialog" [header]="'Detalles de Auditoría - ' + selectedAudit?.entity + ' #' + selectedAudit?.entityId" [modal]="true" [style]="{width: '50vw'}" [breakpoints]="{'960px': '75vw', '640px': '100vw'}" [draggable]="false" [resizable]="false">
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
                        <span class="font-bold text-gray-700 block mb-2">Diferencias (Campos alterados)</span>
                        <div class="bg-gray-100 rounded p-3 overflow-x-auto">
                            <table class="w-full text-sm text-left">
                                <thead>
                                    <tr class="border-b border-gray-300">
                                        <th class="py-2 px-3 font-semibold text-gray-600">Campo</th>
                                        <th class="py-2 px-3 font-semibold text-gray-600 w-2/5">Antes</th>
                                        <th class="py-2 px-3 font-semibold text-gray-600 w-2/5">Después</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let diff of auditDiffs" class="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                                        <td class="py-2 px-3 font-mono text-xs">{{ diff.key }}</td>
                                        <td class="py-2 px-3">
                                            <span *ngIf="diff.oldValue !== undefined" class="bg-red-100 text-red-800 px-1 py-0.5 rounded break-all">{{ diff.oldValue | json }}</span>
                                            <span *ngIf="diff.oldValue === undefined" class="text-gray-400 italic">--</span>
                                        </td>
                                        <td class="py-2 px-3">
                                            <span *ngIf="diff.newValue !== undefined" class="bg-green-100 text-green-800 px-1 py-0.5 rounded break-all">{{ diff.newValue | json }}</span>
                                            <span *ngIf="diff.newValue === undefined" class="text-gray-400 italic">--</span>
                                        </td>
                                    </tr>
                                    <tr *ngIf="auditDiffs.length === 0">
                                        <td colspan="3" class="py-4 text-center text-gray-500 italic">No se detectaron diferencias visibles (o es un registro nuevo/eliminado completo).</td>
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

    displayAuditDialog: boolean = false;
    selectedAudit: AuditLog | null = null;
    auditModules: any[] = [];
    auditDiffs: { key: string, oldValue: any, newValue: any }[] = [];
    showRawJson: boolean = false;

    constructor(private serviceService: ServiceService, private auditService: AuditService, private router: Router) {}

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

            // 3. Audit Logs
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

        } catch (error) {
            console.error("Error loading dashboard data", error);
        } finally {
            this.loading = false;
        }
    }

    goToServices() {
        this.router.navigate(['/services/all']);
    }

    goToServiceDetail(service: Service) {
        if (!service.id) return;
        this.router.navigate(['/services/all'], { queryParams: { id: service.id } });
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

    computeAuditDiff(oldData: any, newData: any, action: string): { key: string, oldValue: any, newValue: any }[] {
        const diffs: { key: string, oldValue: any, newValue: any }[] = [];

        if (action === 'CREATE' && newData) {
            Object.keys(newData).forEach(key => {
                if(key !== 'createdAt' && key !== 'updatedAt' && newData[key] !== null) {
                   diffs.push({ key, oldValue: undefined, newValue: newData[key] });
                }
            });
            return diffs;
        }

        if (action === 'DELETE' && oldData) {
            Object.keys(oldData).forEach(key => {
                if(key !== 'createdAt' && key !== 'updatedAt' && oldData[key] !== null) {
                    diffs.push({ key, oldValue: oldData[key], newValue: undefined });
                }
            });
            return diffs;
        }

        if (action === 'UPDATE' && oldData && newData) {
            const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

            allKeys.forEach(key => {
                if (key === 'updatedAt' || key === 'createdAt') return; // Ignore timestamps usually

                const oldVal = oldData[key];
                const newVal = newData[key];

                // Simple equality check (this might fail for nested objects, but Prisma flat responses usually work fine)
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    diffs.push({
                        key,
                        oldValue: oldVal,
                        newValue: newVal
                    });
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

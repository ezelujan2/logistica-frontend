import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SettlementService } from '../../service/settlement.service';
import { Driver, DriverService } from '../../service/driver.service';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-settlement-list',
    template: `
        <div class="card">
            <p-toast></p-toast>

            <div *ngIf="viewMode === 'LIST'">
                <div class="font-semibold text-xl mb-4">Liquidaciones a Choferes</div>
                <p-table [value]="settlements" [loading]="loading" [paginator]="true" [rows]="10" responsiveLayout="stack">
                    <ng-template pTemplate="caption">
                         <p-button label="Nueva Liquidación" icon="pi pi-plus" (click)="viewMode = 'CREATE'; openCreate()" />
                    </ng-template>
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Código</th>
                            <th>Fecha Liq.</th>
                            <th>Chofer</th>
                            <th>Periodo</th>
                            <th>Total Pagado</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-settlement>
                        <tr>
                            <td>{{ settlement.code }}</td>
                            <td>{{ settlement.createdAt | date:'dd/MM/yyyy' }}</td>
                            <td>{{ settlement.driver?.name }}</td>
                            <td>{{ settlement.startDate | date:'dd/MM' }} - {{ settlement.endDate | date:'dd/MM' }}</td>
                            <td class="font-bold">{{ settlement.totalAmount | currency:'USD' }}</td>
                            <td>
                                <p-tag [value]="settlement.status" severity="success"></p-tag>
                            </td>
                            <td>
                                <p-button icon="pi pi-eye" [text]="true" [rounded]="true" (click)="viewDetails(settlement)"></p-button>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- Create / Details View -->
             <div *ngIf="viewMode === 'CREATE' || viewMode === 'DETAILS'">
                  <div class="flex items-center gap-2 mb-4">
                     <p-button icon="pi pi-arrow-left" [text]="true" (click)="viewMode = 'LIST'"></p-button>
                     <div class="font-semibold text-xl">
                        {{ viewMode === 'CREATE' ? (editingId ? 'Editar Liquidación ' + newSettlement.code : 'Nueva Liquidación') : 'Detalle Liquidación ' + selectedSettlement?.code }}
                     </div>
                  </div>

                 <!-- STEP 1: Select Driver (Only Create) -->
                 <div *ngIf="viewMode === 'CREATE' && !pendingItemsLoaded" class="flex flex-col gap-4 max-w-lg">
                      <div class="flex flex-col gap-2">
                           <label>Seleccionar Chofer</label>
                           <p-select [options]="drivers" [(ngModel)]="newSettlement.driverId" optionLabel="name" optionValue="id" placeholder="Chofer..." appendTo="body" (onChange)="loadPendingItems()"></p-select>
                      </div>
                      <div class="flex flex-col gap-2">
                           <label>Rango de Fechas (Para registro)</label>
                           <div class="flex gap-2">
                                <p-datepicker [(ngModel)]="newSettlement.startDate" placeholder="Inicio"></p-datepicker>
                                <p-datepicker [(ngModel)]="newSettlement.endDate" placeholder="Fin"></p-datepicker>
                           </div>
                      </div>
                 </div>

                 <!-- STEP 2: Review Items (Create & Details) -->
                 <div *ngIf="pendingItemsLoaded || viewMode === 'DETAILS'" class="flex flex-col gap-4">

                      <!-- Services Table -->
                      <p-panel header="Servicios (Viajes)">
                          <p-table [value]="viewMode === 'CREATE' ? pendingServices : selectedSettlement.services" [scrollable]="true" scrollHeight="300px">
                              <ng-template pTemplate="header">
                                  <tr>
                                      <th *ngIf="viewMode === 'CREATE'" style="width: 3rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
                                      <th>Inicio</th>
                                      <th>Tipo</th>
                                      <th>Origen → Destino</th>
                                      <th>Detalles</th>
                                      <th>Monto Chofer</th>
                                  </tr>
                              </ng-template>
                              <ng-template pTemplate="body" let-service>
                                  <tr>
                                      <td *ngIf="viewMode === 'CREATE'">
                                          <p-checkbox [(ngModel)]="service.selected" [binary]="true" (onChange)="calculateTotal()"></p-checkbox>
                                      </td>
                                      <td>{{ service.startDate | date:'dd/MM/yy HH:mm' }}</td>
                                      <td><p-tag [value]="getServiceTypeLabel(service.serviceType)" severity="info"></p-tag></td>
                                      <td>{{ service.origin }} → {{ service.destination }}</td>
                                      <td>{{ service.details }}</td>
                                      <td class="font-bold text-green-600">
                                          <!-- Assuming we saved driver amount in service.driver_amount or calculate it -->
                                          <!-- Backend returns driver_amount field -->
                                          {{ (service.driver_amount || 0) | currency:'USD' }}
                                      </td>
                                  </tr>
                              </ng-template>
                          </p-table>
                      </p-panel>

                      <!-- Advances Table -->
                      <p-panel header="Adelantos a Descontar">
                          <p-table [value]="viewMode === 'CREATE' ? pendingAdvances : selectedSettlement.advances">
                              <ng-template pTemplate="header">
                                  <tr>
                                      <th *ngIf="viewMode === 'CREATE'" style="width: 3rem"></th>
                                      <th>Fecha</th>
                                      <th>Descripción</th>
                                      <th>Monto</th>
                                  </tr>
                              </ng-template>
                              <ng-template pTemplate="body" let-advance>
                                  <tr>
                                      <td *ngIf="viewMode === 'CREATE'">
                                          <p-checkbox [(ngModel)]="advance.selected" [binary]="true" (onChange)="calculateTotal()"></p-checkbox>
                                      </td>
                                      <td>{{ advance.date | date:'dd/MM/yy' }}</td>
                                      <td>{{ advance.description }}</td>
                                      <td class="font-bold text-red-600">- {{ advance.amount | currency:'USD' }}</td>
                                  </tr>
                              </ng-template>
                          </p-table>
                      </p-panel>

                      <!-- Pending Driver Expenses Table (Non-Reimbursable/Chargeable) -->
                      <p-panel header="Gastos a Cargo del Chofer (Pendientes)" *ngIf="showDriverExpensesPanel()">
                           <!-- Filter expenses that are driver expenses -->
                           <p-table [value]="getDriverExpenses()">
                              <ng-template pTemplate="header">
                                  <tr>
                                      <th *ngIf="viewMode === 'CREATE'" style="width: 3rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
                                      <th>Fecha</th>
                                      <th>Tipo</th>
                                      <th>Descripción</th>
                                      <th>Monto</th>
                                  </tr>
                              </ng-template>
                              <ng-template pTemplate="body" let-expense>
                                  <tr>
                                      <td *ngIf="viewMode === 'CREATE'">
                                          <p-checkbox [(ngModel)]="expense.selected" [binary]="true" (onChange)="calculateTotal()"></p-checkbox>
                                      </td>
                                      <td>{{ expense.date | date:'dd/MM/yy' }}</td>
                                      <td><p-tag [value]="expense.type" severity="warn"></p-tag></td>
                                      <td>{{ expense.description }}</td>
                                      <td class="font-bold text-orange-600">{{ expense.amount | currency:'USD' }}</td>
                                  </tr>
                              </ng-template>
                          </p-table>
                      </p-panel>

                      <!-- Ad-Hoc Expenses Section -->
                      <p-panel header="Gastos (A Reembolsar)">

                          <!-- Add Expense Inputs (Only Create) -->
                          <div *ngIf="viewMode === 'CREATE'" class="flex flex-col gap-2 mb-4 p-3 bg-gray-50 dark:bg-surface-800 rounded-lg border border-gray-200 dark:border-gray-700">
                               <div class="grid grid-cols-12 gap-2 items-end">
                                    <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                                        <label>Tipo</label>
                                        <p-select [options]="expenseTypes" [(ngModel)]="newExpense.type" appendTo="body" styleClass="w-full"></p-select>
                                    </div>
                                    <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
                                        <label>Descripción</label>
                                        <input type="text" pInputText [(ngModel)]="newExpense.description" placeholder="Ej: Peaje" class="w-full" />
                                    </div>
                                    <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                                        <label>Monto</label>
                                        <input type="number" pInputText [(ngModel)]="newExpense.amount" placeholder="0.00" class="w-full" />
                                    </div>
                                    <div class="col-span-12 md:col-span-2 flex justify-end pb-1">
                                         <p-button icon="pi pi-plus" label="Agregar" (click)="addExpense()" [disabled]="!newExpense.description || !newExpense.amount" styleClass="w-full"></p-button>
                                    </div>
                               </div>
                               <!-- Toggle for Driver Charge -->
                               <div class="flex items-center gap-2 mt-2">
                                   <p-checkbox [(ngModel)]="newExpense.isDriverExpense" [binary]="true" inputId="isDriverExpense"></p-checkbox>
                                   <label for="isDriverExpense" class="cursor-pointer">A cargo del chofer (Se descontará de la liquidación / No se reembolsa)</label>
                               </div>
                          </div>

                          <p-table [value]="viewMode === 'CREATE' ? addedExpenses : selectedSettlement.expenses">
                              <ng-template pTemplate="header">
                                  <tr>
                                      <th>Tipo</th>
                                      <th>Descripción</th>
                                      <th>Monto</th>
                                      <th>A Cargo de</th>
                                      <th *ngIf="viewMode === 'CREATE'" style="width: 3rem"></th>
                                  </tr>
                              </ng-template>
                              <ng-template pTemplate="body" let-expense>
                                  <tr>
                                      <td><p-tag [value]="expense.type" severity="info"></p-tag></td>
                                      <td>{{ expense.description }}</td>
                                      <td class="font-bold">
                                          <span [class.text-blue-600]="!expense.isDriverExpense" [class.text-gray-600]="expense.isDriverExpense">
                                              {{ expense.amount | currency:'USD' }}
                                          </span>
                                      </td>
                                      <td>
                                          <p-tag *ngIf="expense.isDriverExpense" value="Chofer" severity="warn"></p-tag>
                                          <span *ngIf="!expense.isDriverExpense" class="text-gray-500 text-sm">Empresa (Reembolso)</span>
                                      </td>
                                      <td *ngIf="viewMode === 'CREATE'">
                                           <p-button icon="pi pi-times" [text]="true" severity="danger" (click)="removeExpense(expense)"></p-button>
                                      </td>
                                  </tr>
                              </ng-template>
                              <ng-template pTemplate="emptymessage">
                                   <tr>
                                       <td colspan="5" class="text-center text-gray-400 py-4">No hay gastos ingresados.</td>
                                   </tr>
                              </ng-template>
                          </p-table>
                      </p-panel>

                      <!-- Summary -->
                      <div class="flex justify-end p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                           <div class="text-right">
                                <div class="text-gray-600 dark:text-gray-400">Total Servicios: {{ totalServices | currency:'USD' }}</div>
                                <div class="text-blue-600 dark:text-blue-400">Total Gastos (Reembolso): + {{ totalExpenses | currency:'USD' }}</div>
                                <div class="text-orange-600 dark:text-orange-400">Total Gastos (Chofer): - {{ totalDriverExpenses | currency:'USD' }}</div>
                                <div class="text-red-500 dark:text-red-400">Total Descuentos: - {{ totalAdvances | currency:'USD' }}</div>
                                <div class="text-2xl font-bold mt-2 text-gray-800 dark:text-white">A Pagar: {{ finalTotal | currency:'USD' }}</div>
                           </div>
                      </div>

                       <div *ngIf="viewMode === 'CREATE'" class="flex justify-end gap-2">
                           <p-button label="Cancelar" severity="secondary" (click)="viewMode = 'LIST'"></p-button>
                           <p-button [label]="editingId ? 'Guardar Cambios' : 'Generar Liquidación'" icon="pi pi-check" (click)="saveSettlement()"></p-button>
                       </div>

                       <div *ngIf="viewMode === 'DETAILS'" class="flex justify-end gap-2">
                            <p-button label="Imprimir PDF" icon="pi pi-print" severity="secondary" (click)="generatePdf(selectedSettlement)"></p-button>

                            <p-button *ngIf="selectedSettlement.status !== 'PAID'" label="Editar" icon="pi pi-pencil" severity="info" (click)="editSettlement(selectedSettlement)"></p-button>

                            <p-button *ngIf="selectedSettlement.status !== 'PAID'" label="Registrar Pago" icon="pi pi-dollar" severity="success" (click)="paySettlement(selectedSettlement)"></p-button>
                       </div>
                 </div>
            </div>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, DialogModule, FormsModule, SelectModule, DatePickerModule, ToastModule, TagModule, PanelModule, DividerModule, CheckboxModule, InputTextModule],
    providers: [MessageService, SettlementService, DriverService]
})
export class SettlementList implements OnInit {
    settlements: any[] = [];
    drivers: Driver[] = [];
    viewMode: 'LIST' | 'CREATE' | 'DETAILS' = 'LIST';
    loading: boolean = false;

    // Create State
    newSettlement: any = { startDate: null, endDate: null };
    editingId: number | null = null;
    pendingItemsLoaded: boolean = false;
    pendingServices: any[] = [];
    pendingAdvances: any[] = [];
    pendingExpenses: any[] = [];

    // Ad-Hoc Expenses
    addedExpenses: any[] = [];
    newExpense: any = { description: '', amount: null, type: 'OTHER', isDriverExpense: false };

    expenseTypes = [
        { label: 'Combustible', value: 'FUEL' },
        { label: 'Peaje', value: 'TOLL' },
        { label: 'Lavado', value: 'WASH' },
        { label: 'Viático', value: 'SNACK' },
        { label: 'Taller / Mantenimiento', value: 'MAINTENANCE' },
        { label: 'Otro', value: 'OTHER' }
    ];

    // Calculated Totals
    totalServices: number = 0;
    totalAdvances: number = 0;
    totalExpenses: number = 0;
    totalDriverExpenses: number = 0;
    finalTotal: number = 0;

    // Details State
    selectedSettlement: any = null;

    constructor(
        private settlementService: SettlementService,
        private driverService: DriverService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadSettlements();
        this.driverService.getDrivers().then(d => this.drivers = d);
    }

    loadSettlements() {
        this.loading = true;
        this.settlementService.getSettlements().subscribe(data => {
            this.settlements = data;
            this.loading = false;
        });
    }

    openCreate() {
        this.newSettlement = {
            driverId: null,
            startDate: new Date(new Date().setDate(new Date().getDate() - 7)), // Last week default
            endDate: new Date()
        };
        this.editingId = null;
        this.pendingItemsLoaded = false;
        this.pendingServices = [];
        this.pendingAdvances = [];
        this.pendingExpenses = [];
        this.addedExpenses = [];
        this.newExpense = { description: '', amount: null };
        this.resetTotals();
    }

    editSettlement(settlement: any) {
        this.editingId = settlement.id;
        this.newSettlement = {
            driverId: settlement.driverId,
            startDate: new Date(settlement.startDate),
            endDate: new Date(settlement.endDate),
            code: settlement.code
        };

        // Load pending items for this driver
        this.loading = true;
        this.settlementService.getPendingItems(settlement.driverId).subscribe({
            next: (data) => {
                // Merge Pending with Existing Linked items
                // Services
                this.pendingServices = [
                    ...settlement.services.map((s: any) => ({ ...s, selected: true })), // Existing linked
                    ...data.services.map((s: any) => ({ ...s, selected: false }))       // New pending
                ];

                // Advances
                this.pendingAdvances = [
                    ...settlement.advances.map((a: any) => ({ ...a, selected: true })),
                    ...data.advances.map((a: any) => ({ ...a, selected: false }))
                ];

                // Expenses (Driver)
                // Filter out non-driver expenses from settlement.expenses first
                const existingDriverExpenses = settlement.expenses.filter((e: any) => e.isDriverExpense);
                this.pendingExpenses = [
                     ...existingDriverExpenses.map((e: any) => ({ ...e, selected: true })),
                     ...data.expenses.map((e: any) => ({ ...e, selected: false }))
                ];

                // Ad-hoc Expenses (Reimbursable / Non-Driver)
                this.addedExpenses = settlement.expenses.filter((e: any) => !e.isDriverExpense).map((e: any) => ({ ...e }));

                this.pendingItemsLoaded = true;
                this.viewMode = 'CREATE';
                this.calculateTotal();
                this.loading = false;
            },
            error: () => {
                 this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo cargar datos para edición'});
                 this.loading = false;
            }
        });
    }

    paySettlement(settlement: any) {
        if (!confirm('¿Confirma que desea marcar esta liquidación como PAGADA? Si el saldo es negativo, se generará una deuda.')) return;

        this.loading = true;
        this.settlementService.paySettlement(settlement.id).subscribe({
            next: () => {
                this.messageService.add({severity:'success', summary:'Pago Registrado', detail:'Liquidación actualizada a PAGADO'});
                this.viewMode = 'LIST';
                this.loadSettlements();
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({severity:'error', summary:'Error', detail: err.error?.message || 'Error al registrar pago'});
            }
        });
    }

    generatePdf(settlement: any) {
        if (settlement.pdfUrl) {
            window.open(settlement.pdfUrl, '_blank');
        } else {
            this.messageService.add({severity:'info', summary:'Generando PDF...', detail:'Esta funcionalidad está en desarrollo.'});
            // Call backend generation if needed, or just show message as backend is placeholder
            this.settlementService.generatePdf(settlement.id).subscribe(res => {
                 if (res.url) window.open(res.url, '_blank');
                 else this.messageService.add({severity:'warn', summary:'Info', detail:'PDF no disponible aún'});
            });
        }
    }

    loadPendingItems() {
        if (!this.newSettlement.driverId) return;

        this.loading = true;
        this.settlementService.getPendingItems(this.newSettlement.driverId).subscribe({
            next: (data) => {
                this.pendingServices = data.services.map((s: any) => ({ ...s, selected: true })); // Auto-select all
                this.pendingAdvances = data.advances.map((a: any) => ({ ...a, selected: true }));
                this.pendingExpenses = data.expenses.map((e: any) => ({ ...e, selected: true }));
                this.pendingItemsLoaded = true;
                this.calculateTotal();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo cargar items pendientes'});
                this.loading = false;
            }
        });
    }

    getDriverExpenses() {
        if (this.viewMode === 'CREATE') {
            return this.pendingExpenses.filter(e => e.isDriverExpense);
        }
        return [];
    }

    showDriverExpensesPanel() {
        return this.viewMode === 'CREATE' && this.getDriverExpenses().length > 0;
    }

    calculateTotal() {
        this.totalServices = this.pendingServices
            .filter(s => s.selected)
            .reduce((sum, s) => sum + Number(s.driver_amount || 0), 0);

        this.totalAdvances = this.pendingAdvances
            .filter(a => a.selected)
            .reduce((sum, a) => sum + Number(a.amount || 0), 0);

        this.totalExpenses = this.addedExpenses
            .filter(e => !e.isDriverExpense)
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        this.totalDriverExpenses = this.pendingExpenses
            .filter(e => e.selected && e.isDriverExpense)
            .reduce((sum, e) => sum + Number(e.amount || 0), 0) +
            this.addedExpenses
            .filter(e => e.isDriverExpense)
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        this.finalTotal = this.totalServices + this.totalExpenses - this.totalAdvances - this.totalDriverExpenses;
    }

    resetTotals() {
        this.totalServices = 0;
        this.totalAdvances = 0;
        this.totalExpenses = 0;
        this.totalDriverExpenses = 0;
        this.finalTotal = 0;
    }

    addExpense() {
        if (this.newExpense.description && this.newExpense.amount) {
            this.addedExpenses.push({ ...this.newExpense });
            this.newExpense = { description: '', amount: null, type: 'OTHER', isDriverExpense: false };
            this.calculateTotal();
        }
    }

    removeExpense(expense: any) {
        this.addedExpenses = this.addedExpenses.filter(e => e !== expense);
        this.calculateTotal();
    }

    saveSettlement() {
        const payload = {
            driverId: this.newSettlement.driverId,
            startDate: this.newSettlement.startDate,
            endDate: this.newSettlement.endDate,
            serviceIds: this.pendingServices.filter(s => s.selected).map(s => s.id),
            advanceIds: this.pendingAdvances.filter(a => a.selected).map(a => a.id),
            expenseIds: this.pendingExpenses.filter(e => e.selected).map(e => e.id),
            expenses: this.addedExpenses,
            totalAmount: this.finalTotal
        };

        if (this.editingId) {
             this.settlementService.updateSettlement(this.editingId, payload).subscribe({
                next: () => {
                    this.messageService.add({severity:'success', summary:'Éxito', detail:'Liquidación Actualizada'});
                    this.viewMode = 'LIST';
                    this.loadSettlements();
                },
                error: (err) => this.messageService.add({severity:'error', summary:'Error', detail: err.error?.message || 'Falló la actualización'})
             });
        } else {
            this.settlementService.createSettlement(payload).subscribe({
                next: () => {
                    this.messageService.add({severity:'success', summary:'Éxito', detail:'Liquidación Generada'});
                    this.viewMode = 'LIST';
                    this.loadSettlements();
                },
                error: (err) => this.messageService.add({severity:'error', summary:'Error', detail: err.error?.message || 'Falló la creación'})
            });
        }
    }

    viewDetails(settlement: any) {
        this.selectedSettlement = settlement;
        this.viewMode = 'DETAILS';

        // Calculate totals for display
        this.totalServices = settlement.services.reduce((sum: number, s: any) => sum + Number(s.driver_amount || 0), 0);
        this.totalAdvances = settlement.advances.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);

        const expenses = settlement.expenses || [];
        this.totalExpenses = expenses.filter((e: any) => !e.isDriverExpense).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
        this.totalDriverExpenses = expenses.filter((e: any) => e.isDriverExpense).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

        this.finalTotal = settlement.totalAmount;
    }

    getServiceTypeLabel(type: string) {
        const types = [
            { label: 'Servicio', value: 'SERVICE' },
            { label: 'Mensajeria', value: 'MESSAGING' },
            { label: 'Conducción', value: 'DRIVING' }
        ];
        const found = types.find(t => t.value === type);
        return found ? found.label : type;
    }
}

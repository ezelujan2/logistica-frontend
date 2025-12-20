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
                    <div class="font-semibold text-xl">{{ viewMode === 'CREATE' ? 'Nueva Liquidación' : 'Detalle Liquidación ' + selectedSettlement?.code }}</div>
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

                      <!-- Ad-Hoc Expenses Section -->
                      <p-panel header="Gastos (A Reembolsar)">

                          <!-- Add Expense Inputs (Only Create) -->
                          <div *ngIf="viewMode === 'CREATE'" class="flex gap-2 items-end mb-4">
                               <div class="flex flex-col gap-1 flex-1">
                                    <label>Descripción</label>
                                    <input type="text" pInputText [(ngModel)]="newExpense.description" placeholder="Ej: Peaje" />
                               </div>
                               <div class="flex flex-col gap-1 w-32">
                                    <label>Monto</label>
                                    <input type="number" pInputText [(ngModel)]="newExpense.amount" placeholder="0.00" />
                               </div>
                               <p-button icon="pi pi-plus" (click)="addExpense()" [disabled]="!newExpense.description || !newExpense.amount"></p-button>
                          </div>

                          <p-table [value]="viewMode === 'CREATE' ? addedExpenses : selectedSettlement.expenses">
                              <ng-template pTemplate="header">
                                  <tr>
                                      <th>Descripción</th>
                                      <th>Monto</th>
                                      <th *ngIf="viewMode === 'CREATE'" style="width: 3rem"></th>
                                  </tr>
                              </ng-template>
                              <ng-template pTemplate="body" let-expense>
                                  <tr>
                                      <td>{{ expense.description }}</td>
                                      <td class="font-bold text-blue-600">+ {{ expense.amount | currency:'USD' }}</td>
                                      <td *ngIf="viewMode === 'CREATE'">
                                           <p-button icon="pi pi-times" [text]="true" severity="danger" (click)="removeExpense(expense)"></p-button>
                                      </td>
                                  </tr>
                              </ng-template>
                              <ng-template pTemplate="emptymessage">
                                   <tr>
                                       <td colspan="3" class="text-center text-gray-400 py-4">No hay gastos ingresados.</td>
                                   </tr>
                              </ng-template>
                          </p-table>
                      </p-panel>

                      <!-- Summary -->
                      <div class="flex justify-end p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                           <div class="text-right">
                               <div class="text-gray-600 dark:text-gray-400">Total Servicios: {{ totalServices | currency:'USD' }}</div>
                               <div class="text-blue-600 dark:text-blue-400">Total Gastos: + {{ totalExpenses | currency:'USD' }}</div>
                               <div class="text-red-500 dark:text-red-400">Total Descuentos: - {{ totalAdvances | currency:'USD' }}</div>
                               <div class="text-2xl font-bold mt-2 text-gray-800 dark:text-white">A Pagar: {{ finalTotal | currency:'USD' }}</div>
                           </div>
                      </div>

                      <div *ngIf="viewMode === 'CREATE'" class="flex justify-end gap-2">
                          <p-button label="Cancelar" severity="secondary" (click)="viewMode = 'LIST'"></p-button>
                          <p-button label="Generar Liquidación" icon="pi pi-check" (click)="saveSettlement()" [disabled]="finalTotal <= 0"></p-button>
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
    pendingItemsLoaded: boolean = false;
    pendingServices: any[] = [];
    pendingAdvances: any[] = [];

    // Ad-Hoc Expenses
    addedExpenses: any[] = [];
    newExpense: any = { description: '', amount: null };

    // Calculated Totals
    totalServices: number = 0;
    totalAdvances: number = 0;
    totalExpenses: number = 0;
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
        this.pendingItemsLoaded = false;
        this.pendingServices = [];
        this.pendingAdvances = [];
        this.addedExpenses = [];
        this.newExpense = { description: '', amount: null };
        this.resetTotals();
    }

    loadPendingItems() {
        if (!this.newSettlement.driverId) return;

        this.loading = true;
        this.settlementService.getPendingItems(this.newSettlement.driverId).subscribe({
            next: (data) => {
                this.pendingServices = data.services.map((s: any) => ({ ...s, selected: true })); // Auto-select all
                this.pendingAdvances = data.advances.map((a: any) => ({ ...a, selected: true }));
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

    calculateTotal() {
        this.totalServices = this.pendingServices
            .filter(s => s.selected)
            .reduce((sum, s) => sum + Number(s.driver_amount || 0), 0);

        this.totalAdvances = this.pendingAdvances
            .filter(a => a.selected)
            .reduce((sum, a) => sum + Number(a.amount || 0), 0);

        this.totalExpenses = this.addedExpenses
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        this.finalTotal = this.totalServices + this.totalExpenses - this.totalAdvances;
    }

    resetTotals() {
        this.totalServices = 0;
        this.totalAdvances = 0;
        this.totalExpenses = 0;
        this.finalTotal = 0;
        this.finalTotal = 0;
    }

    addExpense() {
        if (this.newExpense.description && this.newExpense.amount) {
            this.addedExpenses.push({ ...this.newExpense });
            this.newExpense = { description: '', amount: null };
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
            expenses: this.addedExpenses,
            totalAmount: this.finalTotal
        };

        this.settlementService.createSettlement(payload).subscribe({
            next: () => {
                this.messageService.add({severity:'success', summary:'Éxito', detail:'Liquidación Generada'});
                this.viewMode = 'LIST';
                this.loadSettlements();
            },
            error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Falló la creación'})
        });
    }

    viewDetails(settlement: any) {
        this.selectedSettlement = settlement;
        this.viewMode = 'DETAILS';

        // Calculate totals for display
        this.totalServices = settlement.services.reduce((sum: number, s: any) => sum + Number(s.driver_amount || 0), 0);
        this.totalAdvances = settlement.advances.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
        this.totalExpenses = settlement.expenses ? settlement.expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0) : 0;
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

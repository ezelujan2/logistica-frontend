import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { StatisticsService } from '../../service/statistics.service';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule, TableModule, CardModule, DividerModule, SelectButtonModule, SelectModule, MultiSelectModule],
  template: `
    <div class="p-4 flex flex-col gap-6 animate-fadein">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="font-bold text-3xl text-gray-800 dark:text-white">Dashboard & Estadísticas</div>

            <!-- Filters -->
            <div class="flex flex-col sm:flex-row gap-3">
                 <p-selectButton
                    [options]="viewOptions"
                    [(ngModel)]="viewMode"
                    optionLabel="label"
                    optionValue="value"
                    (onChange)="onFilterChange()">
                 </p-selectButton>

                 <p-select
                    [options]="years"
                    [(ngModel)]="selectedYear"
                    (onChange)="onFilterChange()"
                    placeholder="Año"
                    class="w-full sm:w-32">
                 </p-select>

                 <p-select
                    *ngIf="viewMode === 'monthly'"
                    [options]="months"
                    [(ngModel)]="selectedMonth"
                    (onChange)="onFilterChange()"
                    placeholder="Mes"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full sm:w-40 animate-fadein">
                 </p-select>

                 <p-multiSelect
                    [options]="serviceTypeOptions"
                    [(ngModel)]="selectedServiceTypes"
                    (onChange)="onFilterChange()"
                    defaultLabel="Tipos de Servicio"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full sm:w-48">
                 </p-multiSelect>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                <div class="absolute right-0 top-0 p-4 opacity-10">
                    <i class="pi pi-dollar text-6xl text-blue-500"></i>
                </div>
                <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Ganancias</span>
                <span class="text-3xl font-bold text-gray-800 dark:text-white">{{ generalStats?.totalRevenue | currency:'USD' }}</span>
                <span class="text-xs text-green-500 mt-2 font-medium"> <i class="pi pi-arrow-up"></i> Ingresos Brutos</span>
            </div>

            <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                <div class="absolute right-0 top-0 p-4 opacity-10">
                    <i class="pi pi-wallet text-6xl text-red-500"></i>
                </div>
                <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Gastos Totales</span>
                <span class="text-3xl font-bold text-red-600 dark:text-red-400">{{ generalStats?.totalExpenses | currency:'USD' }}</span>
                <span class="text-xs text-gray-500 mt-2">Gastos operativos + Combustible</span>
            </div>

            <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                <div class="absolute right-0 top-0 p-4 opacity-10">
                    <i class="pi pi-briefcase text-6xl text-green-500"></i>
                </div>
                <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Ganancia Neta</span>
                <span class="text-3xl font-bold text-green-600 dark:text-green-400">{{ generalStats?.totalProfit | currency:'USD' }}</span>
                <span class="text-xs text-gray-500 mt-2">Despúes de gastos chofer y servicio</span>
            </div>



            <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                <div class="absolute right-0 top-0 p-4 opacity-10">
                    <i class="pi pi-map-marker text-6xl text-purple-500"></i>
                </div>
                <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Km / Viajes</span>
                 <div class="flex flex-col">
                    <span class="text-3xl font-bold text-gray-800 dark:text-white">{{ generalStats?.totalKm | number:'1.0-0' }} km</span>
                    <span class="text-sm text-gray-500">{{ generalStats?.servicesCount }} Servicios</span>
                </div>
            </div>
        </div>

        <!-- Charts Section + Expenses (New) -->
        <!-- Trying to fit Chart (Left), Expenses (Right) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Monthly Revenue (Bar) -->
            <div class="lg:col-span-2 p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Evolución {{ selectedYear }}</h3>
                <p-chart type="bar" [data]="monthlyData" [options]="barOptions" height="300px"></p-chart>
            </div>

            <!-- Top Clients List (Keep!) -->
             <div class="lg:col-span-1 p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col">
                <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Top Clientes (Revenue)</h3>
                <div class="flex-1 overflow-auto">
                    <div *ngFor="let c of topClients; let i = index" class="flex items-center justify-between p-3 border-b dark:border-surface-700 last:border-0 hover:bg-gray-50 dark:hover:bg-surface-800 rounded transition-colors">
                        <div class="flex items-center gap-3">
                            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{{i+1}}</span>
                            <div class="flex flex-col">
                                <span class="font-semibold text-sm">{{c.name}}</span>
                                <span class="text-xs text-gray-500">{{c.trips}} viajes</span>
                            </div>
                        </div>
                        <span class="font-bold text-sm text-gray-700 dark:text-gray-200">{{c.revenue | currency:'USD':'symbol':'1.0-0'}}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Lower Section: Drivers + Expenses + Vehicles -->
        <!-- Grouping Drivers and Expenses in one row, Vehicles below? Or 3 cols? -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <!-- Drivers Ranking Table -->
             <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Rendimiento de Choferes</h3>
                <p-table [value]="topDrivers" styleClass="p-datatable-sm" [scrollable]="true" scrollHeight="300px">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Chofer</th>
                            <th>Viajes</th>
                            <th class="text-right">Ganancias</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-d>
                        <tr>
                            <td>{{d.name}}</td>
                            <td>{{d.trips}}</td>
                            <td class="text-right font-bold text-green-600">{{d.earnings | currency:'USD'}}</td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="footer">
                        <tr>
                            <td colspan="2" class="text-right font-bold">Total</td>
                            <td class="text-right font-bold text-green-600">{{ generalStats?.totalDriverEarnings | currency:'USD' }}</td>
                        </tr>
                    </ng-template>
                </p-table>
             </div>

             <!-- Expenses Summary (Replaces Client Ranking) -->
             <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col">
                <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Resumen de Gastos</h3>
                <div class="flex-1 overflow-auto">
                    <div *ngIf="expensesStats.length === 0" class="text-gray-500 text-center py-4">Sin gastos registrados</div>
                    <div *ngFor="let e of expensesStats" class="flex items-center justify-between p-3 border-b dark:border-surface-700 last:border-0 hover:bg-gray-50 dark:hover:bg-surface-800 rounded transition-colors">
                        <div class="flex items-center gap-3">
                            <i *ngIf="e.type === 'FUEL'" class="pi pi-bolt text-blue-500"></i>
                            <i *ngIf="e.type === 'TOLL'" class="pi pi-ticket text-orange-500"></i>
                            <i *ngIf="e.type === 'WASH'" class="pi pi-info-circle text-cyan-500"></i>
                            <i *ngIf="e.type === 'SNACK'" class="pi pi-apple text-green-500"></i>
                            <i *ngIf="e.type === 'OTHER'" class="pi pi-exclamation-circle text-gray-500"></i>
                            <i *ngIf="e.type === 'DRIVER_EXPENSES'" class="pi pi-user text-orange-500"></i>
                            <span class="font-semibold text-sm">{{ getExpenseLabel(e.type) }}</span>
                        </div>
                        <span class="font-bold text-sm" [class.text-orange-500]="e.type === 'DRIVER_EXPENSES'" [class.text-red-600]="e.type !== 'DRIVER_EXPENSES'">- {{e.amount | currency:'USD'}}</span>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span class="font-bold text-gray-700 dark:text-gray-200">Total Gastos</span>
                    <span class="font-bold text-red-600 text-lg">{{ generalStats?.totalExpenses | currency:'USD' }}</span>
                </div>
             </div>
        </div>

        <!-- Vehicles Ranking (Full Width) -->
        <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
            <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Ranking Vehículos</h3>
            <p-table [value]="topVehicles" styleClass="p-datatable-sm" [scrollable]="true" scrollHeight="300px">
                 <ng-template pTemplate="header">
                    <tr>
                        <th>Patente</th>
                        <th>Modelo</th>
                        <th class="text-right">KM</th>
                        <th class="text-right">Profit</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-v>
                    <tr>
                        <td class="font-bold">{{v.plate}}</td>
                        <td class="text-sm text-gray-500">{{v.model}}</td>
                        <td class="text-right">{{v.totalKm | number:'1.0-0'}} km</td>
                        <td class="text-right font-bold text-green-600">{{v.profit | currency:'USD'}}</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

    </div>
  `
})
export class StatisticsComponent implements OnInit {
  generalStats: any;
  topDrivers: any[] = [];
  topClients: any[] = [];
  topVehicles: any[] = [];
  expensesStats: any[] = [];

  // Charts
  monthlyData: any;
  barOptions: any;

  // Filters
  viewMode: 'annual' | 'monthly' = 'annual';
  viewOptions = [
      { label: 'Anual', value: 'annual' },
      { label: 'Mensual', value: 'monthly' }
  ];

  selectedYear: number = new Date().getFullYear();
  years: number[] = [];

  selectedMonth: number | undefined;
  months = [
      { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
      { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
      { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
      { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 }
  ];

  selectedServiceTypes: string[] = [];
  serviceTypeOptions = [
      { label: 'Servicio', value: 'SERVICE' },
      { label: 'Mensajeria', value: 'MESSAGING' },
      { label: 'Conducción', value: 'DRIVING' },
      { label: 'Media Vuelta', value: 'HALF_ROUND' },
      { label: 'Otro', value: 'OTHER' }
  ];

  constructor(private statsService: StatisticsService) {
      const currentYear = new Date().getFullYear();
      for(let i = currentYear; i >= 2024; i--) {
          this.years.push(i);
      }
      if (!this.years.includes(currentYear)) this.years.push(currentYear);

      this.selectedMonth = new Date().getMonth() + 1;
  }

  async ngOnInit() {
    this.initChartOptions();
    await this.loadData();
  }

  onFilterChange() {
      this.loadData();
  }

  async loadData() {
    try {
        const year = this.selectedYear;
        const month = this.viewMode === 'monthly' ? this.selectedMonth : undefined;

        const [general, drivers, clients, monthly, vehicles, expenses] = await Promise.all([
            this.statsService.getGeneralStats(year, month, this.selectedServiceTypes),
            this.statsService.getDriverStats(year, month, this.selectedServiceTypes),
            this.statsService.getClientStats(year, month, this.selectedServiceTypes),
            this.statsService.getMonthlyStats(year, this.selectedServiceTypes),
            this.statsService.getVehicleStats(year, month, this.selectedServiceTypes),
            this.statsService.getExpenseStats(year, month, this.selectedServiceTypes)
        ]);

        this.generalStats = general;
        this.topDrivers = drivers;
        this.topClients = clients;
        this.topVehicles = vehicles;
        this.expensesStats = expenses;

        this.setupMonthlyChart(monthly);
    } catch (e) {
        console.error("Error loading stats", e);
    }
  }

  getExpenseLabel(type: string): string {
      const map: any = {
          'FUEL': 'Combustible',
          'TOLL': 'Peajes',
          'WASH': 'Lavadero',
          'SNACK': 'Comida',
          'OTHER': 'Otros',
          'DRIVER_EXPENSES': 'Gastos de Choferes'
      };
      return map[type] || type;
  }

  initChartOptions() {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--text-color');
      const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
      const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

      this.barOptions = {
          maintainAspectRatio: false,
          aspectRatio: 0.8,
          plugins: {
              legend: {
                  labels: {
                      color: textColor
                  }
              }
          },
          scales: {
              x: {
                  ticks: {
                      color: textColorSecondary,
                      font: {
                          weight: 500
                      }
                  },
                  grid: {
                      color: surfaceBorder,
                      drawBorder: false
                  }
              },
              y: {
                  ticks: {
                      color: textColorSecondary
                  },
                  grid: {
                      color: surfaceBorder,
                      drawBorder: false
                  }
              }

          }
      };
  }

  setupMonthlyChart(data: any[]) {
      this.monthlyData = {
          labels: data.map(d => d.month),
          datasets: [
              {
                  label: 'Facturación',
                  backgroundColor: '#3B82F6', // Blue-500
                  borderColor: '#3B82F6',
                  data: data.map(d => d.revenue)
              },
              {
                  label: 'Costo Choferes',
                  backgroundColor: '#10B981', // Green-500
                  borderColor: '#10B981',
                  data: data.map(d => d.cost)
              }
          ]
      };
  }
}


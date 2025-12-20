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

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule, TableModule, CardModule, DividerModule, SelectButtonModule, SelectModule],
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
                    <i class="pi pi-wallet text-6xl text-green-500"></i>
                </div>
                <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Ganancia Neta</span>
                <span class="text-3xl font-bold text-green-600 dark:text-green-400">{{ generalStats?.totalProfit | currency:'USD' }}</span>
                <span class="text-xs text-gray-500 mt-2">Despúes de gastos chofer</span>
            </div>

            <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                <div class="absolute right-0 top-0 p-4 opacity-10">
                    <i class="pi pi-car text-6xl text-orange-500"></i>
                </div>
                <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Viajes</span>
                <span class="text-3xl font-bold text-gray-800 dark:text-white">{{ generalStats?.servicesCount }}</span>
                <span class="text-xs text-orange-500 mt-2 font-medium">Servicios completados</span>
            </div>

            <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                <div class="absolute right-0 top-0 p-4 opacity-10">
                    <i class="pi pi-users text-6xl text-purple-500"></i>
                </div>
                <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Choferes Activos</span>
                <span class="text-3xl font-bold text-gray-800 dark:text-white">{{ generalStats?.driversCount }}</span>
                <span class="text-xs text-purple-500 mt-2 font-medium">Flota registrada</span>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Monthly Revenue (Bar) -->
            <div class="lg:col-span-2 p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Evolución {{ selectedYear }}</h3>
                <p-chart type="bar" [data]="monthlyData" [options]="barOptions" height="300px"></p-chart>
            </div>

            <!-- Client Distribution (Pie - mocked data or derived?) or just Top Drivers Summary -->
             <div class="lg:col-span-1 p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col">
                <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Top Clientes (Revenue)</h3>
                <!-- Simple Table for sidebar list -->
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

        <!-- Detailed Tables -->
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
                </p-table>
             </div>

             <!-- Clients Ranking Table (Full) -->
             <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Ranking Clientes</h3>
                <p-table [value]="topClients" styleClass="p-datatable-sm" [scrollable]="true" scrollHeight="300px">
                     <ng-template pTemplate="header">
                        <tr>
                            <th>Cliente</th>
                            <th>Viajes</th>
                            <th class="text-right">Facturación</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-c>
                        <tr>
                            <td>{{c.name}}</td>
                            <td>{{c.trips}}</td>
                            <td class="text-right font-bold text-blue-600">{{c.revenue | currency:'USD'}}</td>
                        </tr>
                    </ng-template>
                </p-table>
             </div>
        </div>

    </div>
  `
})
export class StatisticsComponent implements OnInit {
  generalStats: any;
  topDrivers: any[] = [];
  topClients: any[] = [];

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

  constructor(private statsService: StatisticsService) {
      // Init Years (Current - 5 to Current)
      const currentYear = new Date().getFullYear();
      for(let i = currentYear; i >= 2024; i--) {
          this.years.push(i);
      }
      // If 2024 is the only one, add current if distinct or ensure we have at least one
      if (!this.years.includes(currentYear)) this.years.push(currentYear);

      // Default Month to current if Monthly? No, user chooses.
      this.selectedMonth = new Date().getMonth() + 1; // Default to current month
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

        const [general, drivers, clients, monthly] = await Promise.all([
            this.statsService.getGeneralStats(year, month),
            this.statsService.getDriverStats(year, month),
            this.statsService.getClientStats(year, month),
            // Monthly Chart always follows the Year Context
            this.statsService.getMonthlyStats(year)
        ]);

        this.generalStats = general;
        this.topDrivers = drivers;
        this.topClients = clients;

        this.setupMonthlyChart(monthly);
    } catch (e) {
        console.error("Error loading stats", e);
    }
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

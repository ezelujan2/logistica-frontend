import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { RatingModule } from 'primeng/rating';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { StatisticsService, ClientDetailStats } from '../../service/statistics.service';

const SERVICE_TYPE_LABELS: Record<string, string> = {
    SERVICE: 'Servicio',
    MESSAGING: 'Mensajería',
    DRIVING: 'Conducción',
    HALF_ROUND: 'Media Vuelta',
    OTHER: 'Otro'
};

@Component({
    selector: 'app-client-stats',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ChartModule, ButtonModule, TagModule, SkeletonModule, RatingModule, SelectButtonModule, SelectModule],
    styles: [`
        ::ng-deep .p-rating-on-icon { color: #C9A84C !important; }
        ::ng-deep .p-rating-off-icon { color: #D8D3C8 !important; }
    `],
    template: `
        <div class="p-4 flex flex-col gap-6 animate-fadein">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" (click)="goBack()"></p-button>
                    <div class="flex flex-col">
                        <div class="font-bold text-3xl text-gray-800 dark:text-white">{{ stats?.client?.name || 'Cliente' }}</div>
                        <span class="text-sm text-gray-500" *ngIf="stats">
                            Cliente desde {{ stats.client.createdAt | date:'MM/yyyy' }}
                            <ng-container *ngIf="stats.firstServiceDate"> · Primer servicio {{ stats.firstServiceDate | date:'dd/MM/yyyy' }}</ng-container>
                        </span>
                    </div>
                </div>

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

            <ng-container *ngIf="loading">
                <p-skeleton height="6rem" styleClass="mb-3"></p-skeleton>
                <p-skeleton height="20rem"></p-skeleton>
            </ng-container>

            <ng-container *ngIf="!loading && notFound">
                <div class="text-center py-16 text-gray-400">Cliente no encontrado.</div>
            </ng-container>

            <ng-container *ngIf="!loading && stats">
                <!-- KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i class="pi pi-briefcase text-6xl text-blue-500"></i></div>
                        <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Servicios</span>
                        <span class="text-3xl font-bold text-gray-800 dark:text-white">{{ stats.totalServices }}</span>
                        <span class="text-xs text-gray-500 mt-2">{{ stats.avgTripsPerMonth | number:'1.1-1' }} viajes / mes en promedio</span>
                    </div>

                    <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i class="pi pi-dollar text-6xl text-green-500"></i></div>
                        <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Facturación Total</span>
                        <span class="text-3xl font-bold text-gray-800 dark:text-white">{{ stats.totalRevenue | currency:'USD' }}</span>
                        <span class="text-xs text-gray-500 mt-2">Ticket promedio {{ stats.avgTicket | currency:'USD' }} · {{ stats.revenueSharePercentage | number:'1.1-1' }}% de la facturación total</span>
                    </div>

                    <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i class="pi pi-wallet text-6xl text-indigo-500"></i></div>
                        <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Ganancia Neta Generada</span>
                        <span class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ stats.totalProfit | currency:'USD' }}</span>
                        <span class="text-xs text-gray-500 mt-2">{{ stats.totalKm | number:'1.0-0' }} km · combustible atribuido {{ stats.totalFuelCost | currency:'USD' }}</span>
                    </div>

                    <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i class="pi pi-clock text-6xl text-orange-500"></i></div>
                        <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Cuentas por Cobrar</span>
                        <span class="text-3xl font-bold" [class.text-orange-600]="stats.pendingAmount > 0" [class.text-gray-400]="stats.pendingAmount === 0">{{ stats.pendingAmount | currency:'USD' }}</span>
                        <span class="text-xs text-gray-500 mt-2">{{ stats.pendingCount }} servicios facturados esperando pago</span>
                        <span *ngIf="stats.administrativePendingCount > 0" class="text-xs mt-2 pt-2 border-t border-surface-200 dark:border-surface-700 text-amber-700 dark:text-amber-500">
                            <i class="pi pi-exclamation-circle"></i>
                            {{ stats.administrativePendingAmount | currency:'USD' }} en {{ stats.administrativePendingCount }} servicios con trámite pendiente (detalles o facturación)
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <!-- Evolución mensual -->
                    <div class="lg:col-span-2 p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                        <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Evolución de Facturación {{ selectedYear }}</h3>
                        <p-chart type="bar" [data]="monthlyChartData" [options]="chartOptions" height="280px" *ngIf="stats.monthlyEvolution.length > 0"></p-chart>
                        <div *ngIf="stats.monthlyEvolution.length === 0" class="text-gray-400 text-center py-12">Sin datos suficientes todavía</div>
                    </div>

                    <!-- Tipos de servicio -->
                    <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col">
                        <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Tipos de Servicio</h3>
                        <div class="flex flex-col gap-3">
                            <div *ngFor="let t of stats.serviceTypeBreakdown">
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="font-medium">{{ serviceTypeLabel(t.type) }}</span>
                                    <span class="text-gray-500">{{ t.count }} ({{ t.percentage }}%)</span>
                                </div>
                                <div class="w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2">
                                    <div class="h-2 rounded-full" style="background:#C9A84C;" [style.width.%]="t.percentage"></div>
                                </div>
                            </div>
                            <div *ngIf="stats.serviceTypeBreakdown.length === 0" class="text-gray-400 text-sm text-center py-4">Sin datos</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <!-- Choferes más usados -->
                    <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                        <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Choferes más utilizados</h3>
                        <div *ngFor="let d of stats.topDrivers" class="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-800 text-sm last:border-0">
                            <span class="font-medium">{{ d.name }}</span>
                            <span class="text-gray-500">{{ d.trips }} viajes</span>
                        </div>
                        <div *ngIf="stats.topDrivers.length === 0" class="text-gray-400 text-sm text-center py-4">Sin datos</div>
                    </div>

                    <!-- Vehículos más usados -->
                    <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                        <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Vehículos más utilizados</h3>
                        <div *ngFor="let v of stats.topVehicles" class="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-800 text-sm last:border-0">
                            <span class="font-medium">{{ v.label }}</span>
                            <span class="text-gray-500">{{ v.trips }} viajes</span>
                        </div>
                        <div *ngIf="stats.topVehicles.length === 0" class="text-gray-400 text-sm text-center py-4">Sin datos</div>
                    </div>

                    <!-- Satisfacción -->
                    <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col">
                        <div class="flex items-center gap-2 mb-4">
                            <h3 class="font-bold text-lg text-gray-700 dark:text-gray-200">Satisfacción</h3>
                            <p-tag *ngIf="stats.satisfaction.responsesCount > 0" severity="info" [value]="stats.satisfaction.responsesCount + ' respuestas'" rounded="true"></p-tag>
                        </div>
                        <ng-container *ngIf="stats.satisfaction.responsesCount > 0; else noSurveys">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm text-gray-500">Promedio general</span>
                                <p-rating [ngModel]="stats.satisfaction.avgOverall" [readonly]="true" [stars]="6"></p-rating>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-500">NPS</span>
                                <span class="font-bold text-lg" [class.text-green-600]="(stats.satisfaction.nps ?? 0) > 0" [class.text-red-500]="(stats.satisfaction.nps ?? 0) < 0">{{ stats.satisfaction.nps }}</span>
                            </div>
                        </ng-container>
                        <ng-template #noSurveys>
                            <div class="text-gray-400 text-sm text-center py-4">Sin encuestas respondidas todavía</div>
                        </ng-template>
                    </div>
                </div>
            </ng-container>
        </div>
    `
})
export class ClientStats implements OnInit {
    stats: ClientDetailStats | null = null;
    loading = true;
    notFound = false;
    monthlyChartData: any;
    chartOptions: any;
    clientId!: number;

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

    constructor(private route: ActivatedRoute, private router: Router, private statsService: StatisticsService) {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= 2024; i--) {
            this.years.push(i);
        }
        if (!this.years.includes(currentYear)) this.years.push(currentYear);
        this.selectedMonth = new Date().getMonth() + 1;
    }

    async ngOnInit() {
        this.initChartOptions();
        this.clientId = Number(this.route.snapshot.paramMap.get('id'));
        await this.loadData();
    }

    onFilterChange() {
        this.loadData();
    }

    async loadData() {
        this.loading = true;
        try {
            const month = this.viewMode === 'monthly' ? this.selectedMonth : undefined;
            this.stats = await this.statsService.getClientDetailStats(this.clientId, this.selectedYear, month);
            this.setupChart();
        } catch (err: any) {
            if (err?.status === 404) this.notFound = true;
        } finally {
            this.loading = false;
        }
    }

    goBack() {
        this.router.navigate(['/app/clients']);
    }

    serviceTypeLabel(type: string): string {
        return SERVICE_TYPE_LABELS[type] || type;
    }

    private initChartOptions() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
        this.chartOptions = {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } },
                y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } }
            }
        };
    }

    private setupChart() {
        if (!this.stats) return;
        this.monthlyChartData = {
            labels: this.stats.monthlyEvolution.map((d) => d.month),
            datasets: [
                {
                    label: 'Facturación',
                    backgroundColor: '#0C2340',
                    borderColor: '#0C2340',
                    data: this.stats.monthlyEvolution.map((d) => d.revenue)
                }
            ]
        };
    }
}

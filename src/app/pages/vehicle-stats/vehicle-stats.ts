import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { StatisticsService, VehicleDetailStats } from '../../service/statistics.service';

const EXPENSE_TYPE_LABELS: Record<string, string> = {
    FUEL: 'Combustible',
    TOLL: 'Peajes',
    WASH: 'Lavadero',
    SNACK: 'Comida',
    MAINTENANCE: 'Mantenimiento',
    INSURANCE: 'Seguro',
    STRIX: 'Strix',
    STARLINK: 'Starlink',
    PATENTS: 'Patente',
    HALF_ROUND: 'Media Vuelta',
    PERSONAL_ACCIDENT_INSURANCE: 'Seguro de accidentes',
    GROSS_INCOME: 'Ingresos Brutos',
    ACCOUNTANTS: 'Contador',
    AUTONOMOUS_REGIME: 'Monotributo',
    PARKING: 'Estacionamiento',
    TRAVEL_MOBILITY: 'Movilidad',
    OTHER: 'Otros'
};

@Component({
    selector: 'app-vehicle-stats',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, SkeletonModule],
    template: `
        <div class="p-4 flex flex-col gap-6 animate-fadein">
            <div class="flex items-center gap-3">
                <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" (click)="goBack()"></p-button>
                <div class="flex flex-col">
                    <div class="font-bold text-3xl text-gray-800 dark:text-white">{{ stats?.vehicle?.plate || 'Auto' }}</div>
                    <span class="text-sm text-gray-500" *ngIf="stats">
                        {{ stats.vehicle.model }}
                        <ng-container *ngIf="stats.vehicle.purchaseDate"> · Comprado {{ stats.vehicle.purchaseDate | date:'MM/yyyy' }}</ng-container>
                        <ng-container *ngIf="stats.monthsActive"> · {{ stats.monthsActive }} meses en actividad</ng-container>
                    </span>
                </div>
            </div>

            <ng-container *ngIf="loading">
                <p-skeleton height="6rem" styleClass="mb-3"></p-skeleton>
                <p-skeleton height="20rem"></p-skeleton>
            </ng-container>

            <ng-container *ngIf="!loading && notFound">
                <div class="text-center py-16 text-gray-400">Auto no encontrado.</div>
            </ng-container>

            <ng-container *ngIf="!loading && stats">
                <!-- Aviso si falta precio de compra -->
                <div *ngIf="stats.vehicle.purchasePrice === null" class="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                    <i class="pi pi-info-circle text-xl text-blue-500"></i>
                    <span class="text-sm text-blue-800 dark:text-blue-300">
                        Este auto no tiene precio de compra cargado, así que no se puede calcular el retorno de inversión.
                        Podés cargarlo editando el auto — abajo igual ves cuánto costó y cuánto generó.
                    </span>
                </div>

                <!-- KPIs principales -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i class="pi pi-dollar text-6xl text-green-500"></i></div>
                        <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Facturación Generada</span>
                        <span class="text-3xl font-bold text-gray-800 dark:text-white">{{ stats.totalRevenue | currency:'USD' }}</span>
                        <span class="text-xs text-gray-500 mt-2">{{ stats.totalServices }} servicios · {{ stats.totalKm | number:'1.0-0' }} km</span>
                    </div>

                    <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i class="pi pi-wallet text-6xl text-red-500"></i></div>
                        <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Costos Totales</span>
                        <span class="text-3xl font-bold text-red-600 dark:text-red-400">{{ stats.totalVehicleExpenses + stats.totalDriverCost | currency:'USD' }}</span>
                        <span class="text-xs text-gray-500 mt-2">Gastos del auto {{ stats.totalVehicleExpenses | currency:'USD' }} + choferes {{ stats.totalDriverCost | currency:'USD' }}</span>
                    </div>

                    <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i class="pi pi-chart-line text-6xl text-indigo-500"></i></div>
                        <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Resultado Neto</span>
                        <span class="text-3xl font-bold" [class.text-indigo-600]="stats.netResult >= 0" [class.text-red-600]="stats.netResult < 0">{{ stats.netResult | currency:'USD' }}</span>
                        <span class="text-xs text-gray-500 mt-2">{{ stats.netResultPerMonth | currency:'USD' }} por mes en promedio</span>
                    </div>

                    <div class="p-4 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i class="pi pi-percentage text-6xl text-amber-500"></i></div>
                        <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Retorno de Inversión</span>
                        <ng-container *ngIf="stats.roiPercentage !== null; else noRoi">
                            <span class="text-3xl font-bold" [class.text-green-600]="stats.roiPercentage! >= 0" [class.text-red-600]="stats.roiPercentage! < 0">{{ stats.roiPercentage | number:'1.0-0' }}%</span>
                            <span class="text-xs text-gray-500 mt-2">
                                <ng-container *ngIf="stats.roiPercentage! >= 0">Ya se pagó solo y generó ese % extra sobre los {{ stats.vehicle.purchasePrice | currency:'USD' }}</ng-container>
                                <ng-container *ngIf="stats.roiPercentage! < 0">Todavía no se pagó solo: costó {{ stats.vehicle.purchasePrice | currency:'USD' }}</ng-container>
                            </span>
                        </ng-container>
                        <ng-template #noRoi>
                            <span class="text-3xl font-bold text-gray-300">—</span>
                            <span class="text-xs text-gray-500 mt-2">Falta cargar el precio de compra</span>
                        </ng-template>
                    </div>
                </div>

                <!-- Recupero de la inversión -->
                <div *ngIf="stats.investmentRecoveredPercentage !== null" class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <h3 class="font-bold text-lg text-gray-700 dark:text-gray-200">Recupero de la inversión</h3>
                        <span class="text-sm font-semibold" [class.text-green-600]="stats.investmentRecoveredPercentage! >= 100" [class.text-gray-600]="stats.investmentRecoveredPercentage! < 100">
                            {{ stats.investmentRecoveredPercentage | number:'1.0-0' }}% de {{ stats.vehicle.purchasePrice | currency:'USD' }}
                        </span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-surface-700 rounded-full h-4 overflow-hidden">
                        <div class="h-4 rounded-full transition-all"
                             [style.width.%]="progressWidth()"
                             [style.background]="stats.investmentRecoveredPercentage! >= 100 ? '#16a34a' : '#C9A84C'"></div>
                    </div>
                    <div class="text-sm text-gray-500 mt-3">
                        <ng-container *ngIf="stats.monthsToBreakEven === 0">
                            Ya se pagó solo. Todo lo que genere de acá en adelante es ganancia sobre la inversión.
                        </ng-container>
                        <ng-container *ngIf="stats.monthsToBreakEven !== null && stats.monthsToBreakEven > 0">
                            Al ritmo actual, le faltan aproximadamente <strong>{{ stats.monthsToBreakEven | number:'1.0-0' }} meses</strong> para recuperar lo que costó.
                        </ng-container>
                        <ng-container *ngIf="stats.monthsToBreakEven === null">
                            No se puede estimar cuándo se recupera: el resultado mensual promedio no es positivo.
                        </ng-container>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <!-- Desglose de gastos -->
                    <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                        <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Gastos del auto por tipo</h3>
                        <div class="flex flex-col gap-3">
                            <div *ngFor="let e of stats.expenseBreakdown">
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="font-medium">{{ expenseLabel(e.type) }}</span>
                                    <span class="text-gray-500">{{ e.amount | currency:'USD' }}</span>
                                </div>
                                <div class="w-full bg-gray-100 dark:bg-surface-700 rounded-full h-2">
                                    <div class="h-2 rounded-full" style="background:#C9A84C;" [style.width.%]="expenseShare(e.amount)"></div>
                                </div>
                            </div>
                            <div *ngIf="stats.expenseBreakdown.length === 0" class="text-gray-400 text-sm text-center py-4">Sin gastos cargados a este auto</div>
                        </div>
                    </div>

                    <!-- Rendimiento por km -->
                    <div class="p-6 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col">
                        <h3 class="font-bold text-lg mb-4 text-gray-700 dark:text-gray-200">Rendimiento por kilómetro</h3>
                        <div class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                            <span class="text-sm text-gray-500">Factura por km</span>
                            <span class="font-bold text-green-600">{{ stats.revenuePerKm | currency:'USD' }}</span>
                        </div>
                        <div class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                            <span class="text-sm text-gray-500">Cuesta por km</span>
                            <span class="font-bold text-red-600">{{ stats.costPerKm | currency:'USD' }}</span>
                        </div>
                        <div class="flex items-center justify-between p-3">
                            <span class="text-sm text-gray-500 font-semibold">Deja por km</span>
                            <span class="font-bold" [class.text-indigo-600]="stats.revenuePerKm - stats.costPerKm >= 0" [class.text-red-600]="stats.revenuePerKm - stats.costPerKm < 0">
                                {{ stats.revenuePerKm - stats.costPerKm | currency:'USD' }}
                            </span>
                        </div>
                        <div class="text-xs text-gray-400 mt-4" *ngIf="stats.firstServiceDate">
                            Primer servicio {{ stats.firstServiceDate | date:'dd/MM/yyyy' }} · Último {{ stats.lastServiceDate | date:'dd/MM/yyyy' }}
                        </div>
                    </div>
                </div>
            </ng-container>
        </div>
    `
})
export class VehicleStats implements OnInit {
    stats: VehicleDetailStats | null = null;
    loading = true;
    notFound = false;

    constructor(private route: ActivatedRoute, private router: Router, private statsService: StatisticsService) {}

    async ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        try {
            this.stats = await this.statsService.getVehicleDetailStats(id);
        } catch (err: any) {
            if (err?.status === 404) this.notFound = true;
        } finally {
            this.loading = false;
        }
    }

    goBack() {
        this.router.navigate(['/app/vehicles']);
    }

    expenseLabel(type: string): string {
        return EXPENSE_TYPE_LABELS[type] || type;
    }

    expenseShare(amount: number): number {
        if (!this.stats || this.stats.totalVehicleExpenses <= 0) return 0;
        return (amount / this.stats.totalVehicleExpenses) * 100;
    }

    progressWidth(): number {
        const pct = this.stats?.investmentRecoveredPercentage ?? 0;
        return Math.max(0, Math.min(100, pct));
    }
}

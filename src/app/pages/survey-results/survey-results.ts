import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { RatingModule } from 'primeng/rating';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SurveyService, SurveyResult } from '../../service/survey.service';
import { ClientService, Client } from '../../service/client.service';
import { AuthService } from '../../service/auth.service';

interface RankRow {
    id: number;
    name: string;
    avg: number;
    count: number;
}

@Component({
    selector: 'app-survey-results',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, SelectModule, RatingModule, SkeletonModule, ButtonModule, ToastModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    styles: [`
        ::ng-deep .p-rating-on-icon { color: #C9A84C !important; }
        ::ng-deep .p-rating-off-icon { color: #D8D3C8 !important; }
        .survey-comment.clamped { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    `],
    template: `
        <div class="card">
            <p-toast></p-toast>
            <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>
            <div class="flex justify-between items-center flex-wrap gap-2 mb-4">
                <div class="font-semibold text-xl">Encuestas de Satisfacción</div>
                <p-select [options]="clients" [(ngModel)]="selectedClientId" optionLabel="name" optionValue="id" placeholder="Todos los clientes" [showClear]="true" (onChange)="load()" styleClass="w-64"></p-select>
            </div>

            <ng-container *ngIf="loading">
                <p-skeleton height="6rem" styleClass="mb-3"></p-skeleton>
                <p-skeleton height="20rem"></p-skeleton>
            </ng-container>

            <ng-container *ngIf="!loading">
                <!-- Resumen -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                        <span class="block text-xs text-gray-500 mb-1">Respuestas</span>
                        <span class="text-2xl font-bold text-gray-800 dark:text-white">{{ surveys.length }}</span>
                    </div>
                    <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                        <span class="block text-xs text-gray-500 mb-1">Promedio general</span>
                        <span class="text-2xl font-bold text-gray-800 dark:text-white">{{ avgOverall !== null ? (avgOverall | number:'1.1-1') + ' / 6' : '-' }}</span>
                        <span class="block text-xs text-gray-400 mt-1">{{ avgOverallCount }} de {{ surveys.length }} respuestas</span>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                        <span class="block text-xs text-gray-500 mb-1">NPS (recomendación)</span>
                        <span class="text-2xl font-bold text-gray-800 dark:text-white">{{ nps !== null ? nps : '-' }}</span>
                        <span class="block text-xs text-gray-400 mt-1">
                            {{ npsCount > 0 ? (promoters + ' promotores · ' + passives + ' neutrales · ' + detractors + ' detractores') : 'Sin datos de recomendación' }}
                        </span>
                    </div>
                    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                        <span class="block text-xs text-gray-500 mb-1">Promedio chofer</span>
                        <span class="text-2xl font-bold text-gray-800 dark:text-white">{{ avgDriver !== null ? (avgDriver | number:'1.1-1') + ' / 6' : '-' }}</span>
                        <span class="block text-xs text-gray-400 mt-1">{{ avgDriverCount }} de {{ surveys.length }} respuestas</span>
                    </div>
                </div>

                <!-- Rankings -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" *ngIf="!selectedClientId">
                    <div>
                        <div class="font-semibold mb-2">Ranking de Clientes</div>
                        <div class="flex flex-col gap-1">
                            <div *ngFor="let r of clientRanking" class="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-800 text-sm">
                                <span>{{ r.name }}</span>
                                <span class="flex items-center gap-2">
                                    <p-rating [ngModel]="r.avg" [readonly]="true" [stars]="6"></p-rating>
                                    <span class="text-gray-400 text-xs">({{ r.count }})</span>
                                </span>
                            </div>
                            <div *ngIf="clientRanking.length === 0" class="text-gray-400 text-sm py-4 text-center">Sin datos todavía</div>
                        </div>
                    </div>
                    <div>
                        <div class="font-semibold mb-2">Ranking de Choferes</div>
                        <div class="flex flex-col gap-1">
                            <div *ngFor="let r of driverRanking" class="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-800 text-sm">
                                <span>{{ r.name }}</span>
                                <span class="flex items-center gap-2">
                                    <p-rating [ngModel]="r.avg" [readonly]="true" [stars]="6"></p-rating>
                                    <span class="text-gray-400 text-xs">({{ r.count }})</span>
                                </span>
                            </div>
                            <div *ngIf="driverRanking.length === 0" class="text-gray-400 text-sm py-4 text-center">Sin datos todavía</div>
                        </div>
                    </div>
                </div>

                <!-- Tabla de respuestas -->
                <p-table [value]="surveys" [rowHover]="true" styleClass="p-datatable-sm" responsiveLayout="scroll" [paginator]="true" [rows]="10">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Trayecto(s)</th>
                            <th>Chofer</th>
                            <th>General</th>
                            <th>Chofer</th>
                            <th>Vehículo</th>
                            <th>Puntual.</th>
                            <th>NPS</th>
                            <th style="min-width: 16rem;">Comentarios</th>
                            <th *ngIf="isAdmin()"></th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-s>
                        <tr>
                            <td class="whitespace-nowrap text-sm">{{ s.respondedAt | date:'dd/MM/yyyy' }}</td>
                            <td class="text-sm">{{ clientName(s) }}</td>
                            <td class="text-sm">
                                <div *ngFor="let sv of s.services">{{ sv.origin }} → {{ sv.destination }}</div>
                            </td>
                            <td class="text-sm">{{ driverName(s) }}</td>
                            <td><p-rating [ngModel]="s.overallRating" [readonly]="true" [stars]="6"></p-rating></td>
                            <td><p-rating [ngModel]="s.driverRating" [readonly]="true" [stars]="6"></p-rating></td>
                            <td><p-rating [ngModel]="s.vehicleRating" [readonly]="true" [stars]="6"></p-rating></td>
                            <td><p-rating [ngModel]="s.punctualityRating" [readonly]="true" [stars]="6"></p-rating></td>
                            <td class="text-sm text-center">{{ s.recommendScore ?? '-' }}</td>
                            <td class="text-sm" style="max-width: 20rem;">
                                <div class="survey-comment" [class.clamped]="!isExpanded(s.id)">
                                    <div *ngIf="s.comments" class="mb-1 whitespace-pre-wrap break-words">{{ s.comments }}</div>
                                    <div *ngIf="s.suggestions" class="text-gray-500 italic whitespace-pre-wrap break-words">Mejora: {{ s.suggestions }}</div>
                                </div>
                                <button
                                    *ngIf="isLong(s)"
                                    type="button"
                                    class="text-xs font-semibold mt-1"
                                    style="color:#C9A84C;"
                                    (click)="toggleExpand(s.id)">
                                    {{ isExpanded(s.id) ? 'Ver menos' : 'Ver más' }}
                                </button>
                            </td>
                            <td *ngIf="isAdmin()">
                                <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (click)="deleteSurvey(s)"></p-button>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr><td [attr.colspan]="isAdmin() ? 11 : 10" class="text-center p-4 text-gray-500">Todavía no hay encuestas respondidas.</td></tr>
                    </ng-template>
                </p-table>
            </ng-container>
        </div>
    `
})
export class SurveyResults implements OnInit {
    surveys: SurveyResult[] = [];
    clients: Client[] = [];
    selectedClientId: number | null = null;
    loading = true;

    avgOverall: number | null = null;
    avgOverallCount = 0;
    avgDriver: number | null = null;
    avgDriverCount = 0;
    nps: number | null = null;
    npsCount = 0;
    promoters = 0;
    passives = 0;
    detractors = 0;
    clientRanking: RankRow[] = [];
    driverRanking: RankRow[] = [];
    expandedIds = new Set<number>();
    private static readonly LONG_TEXT_THRESHOLD = 160;

    constructor(
        private surveyService: SurveyService,
        private clientService: ClientService,
        private authService: AuthService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}

    isAdmin(): boolean {
        return this.authService.hasPermission('manageSurveys');
    }

    async ngOnInit() {
        this.clients = await this.clientService.getClients();
        await this.load();
    }

    async load() {
        this.loading = true;
        try {
            this.surveys = await this.surveyService.listSurveys(this.selectedClientId ?? undefined);
            this.computeSummary();
        } finally {
            this.loading = false;
        }
    }

    clientName(s: SurveyResult): string {
        return s.services[0]?.clients?.[0]?.name || 'Sin cliente';
    }

    driverName(s: SurveyResult): string {
        const names = new Set(s.services.flatMap(sv => sv.drivers.map(d => d.name)));
        return names.size ? Array.from(names).join(', ') : 'Sin chofer';
    }

    isLong(s: SurveyResult): boolean {
        const len = (s.comments?.length ?? 0) + (s.suggestions?.length ?? 0);
        return len > SurveyResults.LONG_TEXT_THRESHOLD;
    }

    isExpanded(id: number): boolean {
        return this.expandedIds.has(id);
    }

    toggleExpand(id: number) {
        if (this.expandedIds.has(id)) {
            this.expandedIds.delete(id);
        } else {
            this.expandedIds.add(id);
        }
    }

    deleteSurvey(s: SurveyResult) {
        this.confirmationService.confirm({
            message: '¿Eliminar esta respuesta de encuesta? Esta acción no se puede deshacer.',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await this.surveyService.deleteSurvey(s.id);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Respuesta eliminada' });
                    await this.load();
                } catch {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la respuesta' });
                }
            }
        });
    }

    private avg(nums: number[]): number | null {
        if (!nums.length) return null;
        return nums.reduce((a, b) => a + b, 0) / nums.length;
    }

    /** Falls back to the average of the sub-ratings for responses recorded before the overall rating existed. */
    private overallOrFallback(s: SurveyResult): number | null {
        return s.overallRating ?? this.avg([s.driverRating, s.vehicleRating, s.punctualityRating].filter((v): v is number => v !== null));
    }

    private computeSummary() {
        const overallVals = this.surveys.map(s => this.overallOrFallback(s)).filter((v): v is number => v !== null);
        const driverVals = this.surveys.map(s => s.driverRating).filter((v): v is number => v !== null);
        this.avgOverall = this.avg(overallVals);
        this.avgOverallCount = overallVals.length;
        this.avgDriver = this.avg(driverVals);
        this.avgDriverCount = driverVals.length;

        const npsVals = this.surveys.map(s => s.recommendScore).filter((v): v is number => v !== null);
        this.npsCount = npsVals.length;
        if (npsVals.length) {
            this.promoters = npsVals.filter(v => v >= 9).length;
            this.detractors = npsVals.filter(v => v <= 6).length;
            this.passives = npsVals.length - this.promoters - this.detractors;
            this.nps = Math.round(((this.promoters - this.detractors) / npsVals.length) * 100);
        } else {
            this.promoters = this.passives = this.detractors = 0;
            this.nps = null;
        }

        // Ranking de clientes (por overallRating, o promedio de las 3 categorías si falta)
        const byClient = new Map<number, { name: string; vals: number[] }>();
        const byDriver = new Map<number, { name: string; vals: number[] }>();

        for (const s of this.surveys) {
            const rating = this.overallOrFallback(s);
            if (rating === null) continue;

            for (const sv of s.services) {
                for (const c of sv.clients) {
                    const entry = byClient.get(c.id) || { name: c.name, vals: [] };
                    entry.vals.push(rating);
                    byClient.set(c.id, entry);
                }
                if (s.driverRating !== null) {
                    for (const d of sv.drivers) {
                        const entry = byDriver.get(d.id) || { name: d.name, vals: [] };
                        entry.vals.push(s.driverRating);
                        byDriver.set(d.id, entry);
                    }
                }
            }
        }

        this.clientRanking = Array.from(byClient.entries())
            .map(([id, v]) => ({ id, name: v.name, avg: this.avg(v.vals)!, count: v.vals.length }))
            .sort((a, b) => b.avg - a.avg);

        this.driverRanking = Array.from(byDriver.entries())
            .map(([id, v]) => ({ id, name: v.name, avg: this.avg(v.vals)!, count: v.vals.length }))
            .sort((a, b) => b.avg - a.avg);
    }
}

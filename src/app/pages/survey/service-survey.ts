import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { SurveyService, SurveyContext } from '../../service/survey.service';

@Component({
    selector: 'app-service-survey',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, RatingModule, TextareaModule],
    styles: [`
        ::ng-deep .p-rating-on-icon { color: #C9A84C !important; }
        ::ng-deep .p-rating-off-icon { color: #D8D3C8 !important; }
    `],
    template: `
        <div class="min-h-screen flex items-center justify-center p-4" style="background:#F7F5F2;">
            <div class="w-full max-w-xl py-10">
                <div class="text-center mb-8">
                    <div class="text-3xl font-black tracking-tight" style="color:#0C2340;">LECMA</div>
                    <div class="text-xs font-semibold tracking-[0.2em] uppercase mt-1" style="color:#C9A84C;">Movilidad Corporativa</div>
                </div>

                <div class="bg-white rounded-3xl shadow-lg overflow-hidden" style="border-top:5px solid #C9A84C;">
                    <div class="p-8 sm:p-10">
                        <ng-container *ngIf="loading">
                            <div class="text-center py-10">
                                <i class="pi pi-spin pi-spinner text-3xl" style="color:#C9A84C;"></i>
                            </div>
                        </ng-container>

                        <ng-container *ngIf="!loading && notFound">
                            <div class="text-center py-6">
                                <i class="pi pi-times-circle text-5xl mb-4 text-gray-300"></i>
                                <h2 class="text-xl font-bold mb-2" style="color:#0C2340;">Encuesta no encontrada</h2>
                                <p class="text-gray-500">Este link no es válido o expiró. Si creés que es un error, contactanos.</p>
                            </div>
                        </ng-container>

                        <ng-container *ngIf="!loading && !notFound && context">
                            <ng-container *ngIf="submitted || context.alreadyResponded; else formTpl">
                                <div class="text-center py-10">
                                    <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style="background:rgba(201,168,76,0.12);">
                                        <i class="pi pi-check text-3xl" style="color:#C9A84C;"></i>
                                    </div>
                                    <h2 class="text-2xl font-bold mb-2" style="color:#0C2340;">¡Gracias por tu respuesta!</h2>
                                    <p class="text-gray-500">Tu opinión nos ayuda a mejorar cada viaje.</p>
                                </div>
                            </ng-container>

                            <ng-template #formTpl>
                                <h2 class="text-2xl font-bold mb-1" style="color:#0C2340;">¿Cómo estuvo tu viaje?</h2>
                                <p class="text-sm text-gray-500 mb-1">Tu opinión nos ayuda a mejorar el servicio.</p>

                                <div class="flex flex-col gap-1 mt-4 mb-5 rounded-xl p-4" style="background:#F7F5F2;">
                                    <div *ngFor="let s of context.services" class="flex items-center justify-between text-sm">
                                        <span class="font-semibold" style="color:#0C2340;">{{ s.origin }} → {{ s.destination }}</span>
                                        <span class="text-gray-400">{{ s.startDate | date:'dd/MM/yyyy' }}</span>
                                    </div>
                                </div>

                                <div class="flex flex-col gap-7">
                                    <div class="flex items-center justify-between gap-4">
                                        <label class="flex items-center gap-2 text-sm font-semibold" style="color:#0C2340;"><i class="pi pi-star" style="color:#C9A84C;"></i> Experiencia general</label>
                                        <div class="flex flex-col items-end gap-1">
                                            <p-rating [(ngModel)]="overallRating" [stars]="6"></p-rating>
                                            <span class="text-xs" style="color:#C9A84C;">{{ ratingLabel(overallRating) }}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <label class="flex items-center gap-2 text-sm font-semibold" style="color:#0C2340;"><i class="pi pi-user" style="color:#C9A84C;"></i> Chofer</label>
                                        <div class="flex flex-col items-end gap-1">
                                            <p-rating [(ngModel)]="driverRating" [stars]="6"></p-rating>
                                            <span class="text-xs" style="color:#C9A84C;">{{ ratingLabel(driverRating) }}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <label class="flex items-center gap-2 text-sm font-semibold" style="color:#0C2340;"><i class="pi pi-car" style="color:#C9A84C;"></i> Vehículo</label>
                                        <div class="flex flex-col items-end gap-1">
                                            <p-rating [(ngModel)]="vehicleRating" [stars]="6"></p-rating>
                                            <span class="text-xs" style="color:#C9A84C;">{{ ratingLabel(vehicleRating) }}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <label class="flex items-center gap-2 text-sm font-semibold" style="color:#0C2340;"><i class="pi pi-clock" style="color:#C9A84C;"></i> Puntualidad</label>
                                        <div class="flex flex-col items-end gap-1">
                                            <p-rating [(ngModel)]="punctualityRating" [stars]="6"></p-rating>
                                            <span class="text-xs" style="color:#C9A84C;">{{ ratingLabel(punctualityRating) }}</span>
                                        </div>
                                    </div>

                                    <div class="border-t pt-6 flex flex-col gap-3" style="border-color:#eee;">
                                        <label class="text-sm font-semibold" style="color:#0C2340;">¿Qué tan probable es que recomiendes LECMA?</label>
                                        <div class="flex items-center gap-1 flex-wrap">
                                            <button
                                                type="button"
                                                *ngFor="let n of npsScale"
                                                (click)="recommendScore = n"
                                                class="w-9 h-9 rounded-lg text-sm font-semibold border transition-colors"
                                                [ngClass]="recommendScore === n
                                                    ? 'text-white'
                                                    : 'bg-transparent border-gray-200 text-gray-500 hover:border-gray-400'"
                                                [ngStyle]="recommendScore === n ? {'background':'#0C2340','border-color':'#0C2340'} : {}">
                                                {{ n }}
                                            </button>
                                        </div>
                                        <div class="flex justify-between text-xs text-gray-400">
                                            <span>Nada probable</span>
                                            <span>Muy probable</span>
                                        </div>
                                    </div>

                                    <div class="flex flex-col gap-2">
                                        <label class="text-sm font-semibold" style="color:#0C2340;">Comentarios</label>
                                        <textarea pTextarea [(ngModel)]="comments" rows="3" class="w-full" placeholder="Contanos cómo fue tu experiencia..."></textarea>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        <label class="text-sm font-semibold" style="color:#0C2340;">¿Algo que podamos mejorar?</label>
                                        <textarea pTextarea [(ngModel)]="suggestions" rows="3" class="w-full" placeholder="Sugerencias, opcional..."></textarea>
                                        <span class="text-xs text-gray-400">Contanos al menos un comentario o una sugerencia para poder enviar.</span>
                                    </div>

                                    <p-button label="Enviar respuesta" styleClass="w-full" [loading]="sending" [disabled]="!canSubmit()" (click)="submit()"></p-button>
                                    <p *ngIf="errorMessage" class="text-sm text-red-500 text-center">{{ errorMessage }}</p>
                                </div>
                            </ng-template>
                        </ng-container>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ServiceSurvey implements OnInit {
    token: string = '';
    context: SurveyContext | null = null;
    loading = true;
    notFound = false;
    sending = false;
    submitted = false;
    errorMessage = '';

    npsScale = Array.from({ length: 11 }, (_, i) => i); // 0-10

    ratingScale = [
        { value: 1, label: 'Muy malo' },
        { value: 2, label: 'Malo' },
        { value: 3, label: 'Regular / por debajo de lo esperado' },
        { value: 4, label: 'Bueno / aceptable' },
        { value: 5, label: 'Muy bueno' },
        { value: 6, label: 'Excelente' }
    ];

    driverRating: number | null = null;
    vehicleRating: number | null = null;
    punctualityRating: number | null = null;
    overallRating: number | null = null;
    recommendScore: number | null = null;
    comments = '';
    suggestions = '';

    constructor(private route: ActivatedRoute, private surveyService: SurveyService) {}

    async ngOnInit() {
        this.token = this.route.snapshot.paramMap.get('token') || '';
        if (!this.token) {
            this.notFound = true;
            this.loading = false;
            return;
        }
        try {
            this.context = await this.surveyService.getSurveyContext(this.token);
        } catch {
            this.notFound = true;
        } finally {
            this.loading = false;
        }
    }

    ratingLabel(value: number | null): string {
        return this.ratingScale.find((r) => r.value === value)?.label ?? '';
    }

    hasFeedback(): boolean {
        return !!this.comments.trim() || !!this.suggestions.trim();
    }

    allRatingsSelected(): boolean {
        return [this.overallRating, this.driverRating, this.vehicleRating, this.punctualityRating].every((v) => v !== null);
    }

    canSubmit(): boolean {
        return this.allRatingsSelected() && this.hasFeedback();
    }

    async submit() {
        this.errorMessage = '';
        if (!this.allRatingsSelected()) {
            this.errorMessage = 'Por favor calificá las 4 categorías con estrellas antes de enviar.';
            return;
        }
        if (!this.hasFeedback()) {
            this.errorMessage = 'Dejanos al menos un comentario o una sugerencia antes de enviar.';
            return;
        }
        this.sending = true;
        try {
            await this.surveyService.submitSurvey(this.token, {
                driverRating: this.driverRating,
                vehicleRating: this.vehicleRating,
                punctualityRating: this.punctualityRating,
                overallRating: this.overallRating,
                recommendScore: this.recommendScore,
                comments: this.comments,
                suggestions: this.suggestions
            });
            this.submitted = true;
        } catch (err: any) {
            this.errorMessage = err?.error?.error || 'Ocurrió un error al enviar tu respuesta. Probá de nuevo.';
        } finally {
            this.sending = false;
        }
    }
}

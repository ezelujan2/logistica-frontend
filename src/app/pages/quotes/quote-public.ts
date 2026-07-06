import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { HelpButtonComponent } from '../../shared/help-button.component';
import { environment } from '../../../environments/environment';

interface PublicQuoteItem {
    serviceType: string;
    origin?: string;
    destination?: string;
    estimatedKm: number;
    estimatedHours: number;
    kmPrice: number;
    subtotal?: number;
}

interface PublicQuote {
    id?: number;
    code?: string;
    contactName: string;
    contactPhone?: string;
    contactEmail?: string;
    status?: string;
    validUntil?: string;
    discount?: number;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    notes?: string;
    acceptedAt?: string;
    rejectedAt?: string;
    acceptedByName?: string;
    rejectionReason?: string;
    items?: PublicQuoteItem[];
    createdAt?: string;
}

@Component({
    selector: 'app-quote-public',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, FormsModule, InputTextModule, DividerModule, TagModule, HelpButtonComponent],
    template: `
        <div class="public-page">
            <!-- Loading -->
            @if (loading) {
                <div class="public-card">
                    <div class="text-center py-8">
                        <i class="pi pi-spin pi-spinner text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500 text-lg">Cargando cotización...</p>
                    </div>
                </div>
            }

            <!-- Error -->
            @if (!loading && error) {
                <div class="public-card">
                    <div class="text-center py-8">
                        <i class="pi pi-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                        <p class="text-red-600 text-lg font-semibold">{{ error }}</p>
                    </div>
                </div>
            }

            <!-- Quote Content -->
            @if (!loading && !error && quote) {
                <div class="public-card">
                    <!-- Header -->
                    <div class="brand-header">
                        <div class="flex justify-between items-center flex-wrap gap-2">
                            <div>
                                <h1 class="brand-title">LECMA</h1>
                                <p class="brand-subtitle">Movilidad Corporativa</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <app-help-button pageKey="quote-public" />
                                <span class="quote-code">{{ quote.code }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Details -->
                    <div class="p-5">
                        <div class="flex justify-between flex-wrap gap-4 mb-5">
                            <div>
                                <p class="text-sm text-gray-500">Fecha</p>
                                <p class="font-semibold">{{ formatDate(quote.createdAt) }}</p>
                            </div>
                            @if (quote.validUntil) {
                                <div>
                                    <p class="text-sm text-gray-500">Válida hasta</p>
                                    <p class="font-semibold">{{ formatDate(quote.validUntil) }}</p>
                                </div>
                            }
                            <div>
                                <p class="text-sm text-gray-500">Estado</p>
                                <p-tag [value]="getStatusLabel(quote.status)" [severity]="getStatusSeverity(quote.status)" />
                            </div>
                        </div>

                        <p-divider />

                        <!-- Items Table -->
                        <div class="overflow-x-auto mb-4">
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Ruta</th>
                                        <th class="text-right">KM Est.</th>
                                        <th class="text-right">Hs Est.</th>
                                        <th class="text-right">Precio/KM</th>
                                        <th class="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (item of quote.items; track $index) {
                                        <tr>
                                            <td>
                                                @if (item.origin || item.destination) {
                                                    {{ item.origin || '-' }} -> {{ item.destination || '-' }}
                                                } @else {
                                                    -
                                                }
                                            </td>
                                            <td class="text-right">{{ item.estimatedKm }}</td>
                                            <td class="text-right">{{ item.estimatedHours }}</td>
                                            <td class="text-right">{{ formatCurrency(item.kmPrice) }}</td>
                                            <td class="text-right font-semibold">{{ formatCurrency(item.subtotal || 0) }}</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>

                        <p-divider />

                        <!-- Totals -->
                        <div class="flex justify-end">
                            <div class="totals-section">
                                <div class="totals-row">
                                    <span class="text-gray-600">Subtotal Items</span>
                                    <span class="font-semibold">{{ formatCurrency(getItemsSubtotal()) }}</span>
                                </div>
                                @if ((quote.discount || 0) > 0) {
                                    <div class="totals-row text-green-600">
                                        <span>Descuento ({{ quote.discount }}%)</span>
                                        <span class="font-semibold">- {{ formatCurrency(getDiscountAmount()) }}</span>
                                    </div>
                                    <div class="totals-row">
                                        <span class="text-gray-600">Subtotal</span>
                                        <span class="font-semibold">{{ formatCurrency(quote.subtotal || 0) }}</span>
                                    </div>
                                }
                                @if ((quote.taxAmount || 0) > 0) {
                                    <div class="totals-row">
                                        <span class="text-gray-600">IVA (21%)</span>
                                        <span class="font-semibold">{{ formatCurrency(quote.taxAmount || 0) }}</span>
                                    </div>
                                }
                                <p-divider />
                                <div class="totals-row text-lg">
                                    <span class="font-bold">Total</span>
                                    <span class="font-bold">{{ formatCurrency(quote.totalAmount || 0) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Notes -->
                        @if (quote.notes) {
                            <p-divider />
                            <div class="mt-4">
                                <p class="text-sm text-gray-500 mb-1">Notas</p>
                                <p class="text-gray-700 whitespace-pre-line">{{ quote.notes }}</p>
                            </div>
                        }

                        <p-divider />

                        <!-- Status Actions -->
                        <div class="mt-5">
                            @if (quote.status === 'SENT') {
                                <div class="flex justify-center gap-3">
                                    <p-button label="Aceptar" icon="pi pi-check" severity="success" (click)="showAcceptDialog = true" />
                                    <p-button label="Rechazar" icon="pi pi-times" severity="danger" [outlined]="true" (click)="showRejectDialog = true" />
                                </div>
                            }
                            @if (quote.status === 'ACCEPTED') {
                                <div class="text-center">
                                    <div class="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg px-5 py-3">
                                        <i class="pi pi-check-circle text-xl"></i>
                                        <div>
                                            <p class="font-semibold">Cotización aceptada</p>
                                            <p class="text-sm">por {{ quote.acceptedByName }} el {{ formatDate(quote.acceptedAt) }}</p>
                                        </div>
                                    </div>
                                </div>
                            }
                            @if (quote.status === 'REJECTED') {
                                <div class="text-center">
                                    <div class="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-5 py-3">
                                        <i class="pi pi-times-circle text-xl"></i>
                                        <p class="font-semibold">Cotización rechazada</p>
                                    </div>
                                </div>
                            }
                            @if (quote.status === 'EXPIRED') {
                                <div class="text-center">
                                    <div class="inline-flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg px-5 py-3">
                                        <i class="pi pi-clock text-xl"></i>
                                        <p class="font-semibold">Cotización vencida</p>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }

            <!-- Accept Dialog -->
            <p-dialog header="Aceptar Cotización" [(visible)]="showAcceptDialog" [modal]="true" [style]="{ width: '420px' }" [draggable]="false" [resizable]="false">
                <div class="mb-4">
                    <p class="text-gray-600 mb-4">Ingrese su nombre completo como firma digital para aceptar esta cotización.</p>
                    <label class="block text-sm font-semibold mb-1">Nombre completo *</label>
                    <input pInputText type="text" [(ngModel)]="acceptName" class="w-full" placeholder="Nombre y apellido" />
                </div>
                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" [text]="true" severity="secondary" (click)="showAcceptDialog = false" />
                    <p-button label="Confirmar" icon="pi pi-check" severity="success" (click)="acceptQuote()" [disabled]="!acceptName.trim() || submitting" [loading]="submitting" />
                </ng-template>
            </p-dialog>

            <!-- Reject Dialog -->
            <p-dialog header="Rechazar Cotización" [(visible)]="showRejectDialog" [modal]="true" [style]="{ width: '420px' }" [draggable]="false" [resizable]="false">
                <div class="mb-4">
                    <p class="text-gray-600 mb-4">Puede indicar un motivo para rechazar la cotización (opcional).</p>
                    <label class="block text-sm font-semibold mb-1">Motivo (opcional)</label>
                    <textarea pInputText [(ngModel)]="rejectReason" rows="3" class="w-full" placeholder="Motivo del rechazo..."></textarea>
                </div>
                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" [text]="true" severity="secondary" (click)="showRejectDialog = false" />
                    <p-button label="Rechazar" icon="pi pi-times" severity="danger" (click)="rejectQuote()" [disabled]="submitting" [loading]="submitting" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    styles: [`
        .public-page {
            min-height: 100vh;
            background-color: #F7F5F2;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 2rem 1rem;
        }
        .public-card {
            width: 100%;
            max-width: 700px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }
        .brand-header {
            background-color: #0C2340;
            padding: 1.25rem 1.5rem;
        }
        .brand-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: white;
            margin: 0;
            letter-spacing: 2px;
        }
        .brand-subtitle {
            font-size: 0.85rem;
            color: #C9A84C;
            margin: 0;
        }
        .quote-code {
            font-family: monospace;
            font-size: 1rem;
            font-weight: 700;
            color: #C9A84C;
            background: rgba(201, 168, 76, 0.15);
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }
        .items-table th {
            background: #f8f9fa;
            padding: 0.6rem 0.75rem;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
        }
        .items-table td {
            padding: 0.6rem 0.75rem;
            border-bottom: 1px solid #f0f0f0;
            color: #333;
        }
        .totals-section {
            min-width: 260px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 0.35rem 0;
        }
    `]
})
export class QuotePublicComponent implements OnInit {
    token = '';
    quote: PublicQuote | null = null;
    loading = true;
    error = '';

    showAcceptDialog = false;
    showRejectDialog = false;
    acceptName = '';
    rejectReason = '';
    submitting = false;

    private currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    private serviceTypeLabels: Record<string, string> = {
        SERVICE: 'Servicio',
        MESSAGING: 'Mensajería',
        DRIVING: 'Conducción',
        HALF_ROUND: 'Media Rueda',
        OTHER: 'Otro'
    };

    constructor(private route: ActivatedRoute, private http: HttpClient) {}

    ngOnInit() {
        this.token = this.route.snapshot.paramMap.get('token') || '';
        this.loadQuote();
    }

    loadQuote() {
        this.loading = true;
        this.error = '';
        this.http.get<PublicQuote>(`${environment.apiUrl}quotes/public/${this.token}`).subscribe({
            next: (data) => {
                this.quote = data;
                this.loading = false;
            },
            error: () => {
                this.error = 'No se pudo encontrar la cotización solicitada.';
                this.loading = false;
            }
        });
    }

    formatCurrency(value: number): string {
        return this.currencyFormatter.format(value);
    }

    formatDate(value: string | undefined): string {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('es-AR');
    }

    getServiceTypeLabel(type: string): string {
        return this.serviceTypeLabels[type] || type;
    }

    getItemsSubtotal(): number {
        if (!this.quote?.items) return 0;
        return this.quote.items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    }

    getDiscountAmount(): number {
        const itemsTotal = this.getItemsSubtotal();
        return itemsTotal * (Number(this.quote?.discount || 0) / 100);
    }

    getStatusLabel(status: string | undefined): string {
        const labels: Record<string, string> = {
            DRAFT: 'Borrador',
            SENT: 'Enviada',
            ACCEPTED: 'Aceptada',
            REJECTED: 'Rechazada',
            EXPIRED: 'Vencida'
        };
        return labels[status || ''] || status || '';
    }

    getStatusSeverity(status: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            DRAFT: 'secondary',
            SENT: 'info',
            ACCEPTED: 'success',
            REJECTED: 'danger',
            EXPIRED: 'warn'
        };
        return severities[status || ''] || 'secondary';
    }

    acceptQuote() {
        if (!this.acceptName.trim()) return;
        this.submitting = true;
        this.http.post(`${environment.apiUrl}quotes/public/${this.token}/accept`, { name: this.acceptName.trim() }).subscribe({
            next: () => {
                this.showAcceptDialog = false;
                this.acceptName = '';
                this.submitting = false;
                this.loadQuote();
            },
            error: () => {
                this.submitting = false;
            }
        });
    }

    rejectQuote() {
        this.submitting = true;
        this.http.post(`${environment.apiUrl}quotes/public/${this.token}/reject`, { reason: this.rejectReason.trim() }).subscribe({
            next: () => {
                this.showRejectDialog = false;
                this.rejectReason = '';
                this.submitting = false;
                this.loadQuote();
            },
            error: () => {
                this.submitting = false;
            }
        });
    }
}

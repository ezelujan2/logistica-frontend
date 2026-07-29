import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService, ServiceRequestModel } from '../../../service/service-request.service';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-admin-requests',
    standalone: true,
    imports: [FormsModule, TagModule, ButtonModule, DialogModule, SelectModule, InputNumberModule, TextareaModule, ToastModule],
    providers: [MessageService],
    template: `
    <div class="card">
        <p-toast></p-toast>

        <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
            <span class="text-xl font-bold">Solicitudes de servicio</span>
            <p-select appendTo="body" [options]="statusOptions" [(ngModel)]="filterStatus" optionLabel="label" optionValue="value"
                placeholder="Todos los estados" [showClear]="true" [style]="{'min-width':'180px'}" (onChange)="load()" />
        </div>

        @if (loading) {
            <div class="flex justify-center p-6 text-color-secondary">
                <i class="pi pi-spin pi-spinner text-4xl"></i>
            </div>
        } @else if (requests.length === 0) {
            <div class="text-center p-6 text-color-secondary">No hay solicitudes</div>
        } @else {
            @for (r of requests; track r.id) {
                <div class="mb-3 border-round border-1 surface-border p-4"
                    [style]="(r.isLate || r.type === 'ON_DEMAND') ? 'border-left: 4px solid var(--red-500)' : ''">

                    <div class="flex justify-between items-start mb-3 gap-3">
                        <div>
                            <div class="font-bold text-lg">{{ r.client?.name }}</div>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-color-secondary text-sm">
                                    {{ r.type === 'WEEKLY_BATCH' ? 'Lote semanal' : 'Solicitud puntual' }}
                                </span>
                                @if (r.isLate) {
                                    <p-tag value="FUERA DE PLAZO" severity="danger" />
                                }
                                @if (r.type === 'ON_DEMAND') {
                                    <p-tag value="PUNTUAL" severity="warn" />
                                }
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <p-tag [value]="statusLabel(r.status)" [severity]="statusSeverity(r.status)" />
                            <span class="text-color-secondary text-xs">{{ formatDate(r.createdAt) }}</span>
                        </div>
                    </div>

                    <div class="surface-50 border-round p-3 mb-3">
                        @for (item of r.items.slice(0, 3); track item.id) {
                            <div class="flex gap-3 py-1 text-sm border-bottom-1 surface-border">
                                <span class="text-color-secondary w-4rem shrink-0">{{ formatShortDate(item.date) }}</span>
                                <span class="font-semibold flex-1">{{ item.origin }} → {{ item.destination }}</span>
                                <span class="text-color-secondary">{{ item.passenger?.name || '—' }}</span>
                            </div>
                        }
                        @if (r.items.length > 3) {
                            <div class="text-color-secondary text-xs pt-2 font-italic">+ {{ r.items.length - 3 }} ítems más</div>
                        }
                    </div>

                    @if (r.template?.configuration) {
                        <div class="text-sm text-color-secondary mb-1">Tarifario: <strong>{{ r.template!.configuration!.name }}</strong></div>
                    }
                    @if (!r.template?.configuration || r.isLate || r.type === 'ON_DEMAND') {
                        <div class="text-sm text-orange-500 font-semibold mb-2">⚠ Requiere precio manual</div>
                    }

                    @if (r.status === 'PENDING_REVIEW') {
                        <div class="flex gap-2 mt-3">
                            <p-button label="Confirmar" icon="pi pi-check" (click)="openConfirm(r)" />
                            <p-button label="Rechazar" icon="pi pi-times" severity="danger" [outlined]="true" (click)="openReject(r)" />
                        </div>
                    }
                </div>
            }
        }

        <!-- Confirm dialog -->
        <p-dialog [(visible)]="confirmVisible" [style]="{ width: '480px' }" header="Confirmar solicitud" [modal]="true" class="p-fluid">
            <ng-template pTemplate="content">
                @if (actionRequest) {
                    <div class="flex flex-col gap-4 pt-2">
                        <p class="m-0">
                            Cliente: <strong>{{ actionRequest.client?.name }}</strong> ·
                            {{ actionRequest.items.length }} servicio{{ actionRequest.items.length !== 1 ? 's' : '' }}
                        </p>
                        <div class="flex flex-col gap-2">
                            <label for="cprice">Precio por servicio</label>
                            <p-inputNumber inputId="cprice" [(ngModel)]="confirmPrice" mode="currency" currency="ARS" locale="es-AR" />
                            @if (actionRequest.template?.configuration) {
                                <small class="text-color-secondary">Tarifario: {{ actionRequest.template!.configuration!.name }}</small>
                            }
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="cnotes">Nota interna (opcional)</label>
                            <textarea pTextarea inputId="cnotes" [(ngModel)]="confirmNotes" rows="2" style="width:100%"></textarea>
                        </div>
                    </div>
                }
            </ng-template>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="confirmVisible = false" />
                <p-button label="Confirmar y crear servicios" icon="pi pi-check" [text]="true" (click)="doConfirm()" [loading]="submitting" />
            </ng-template>
        </p-dialog>

        <!-- Reject dialog -->
        <p-dialog [(visible)]="rejectVisible" [style]="{ width: '420px' }" header="Rechazar solicitud" [modal]="true" class="p-fluid">
            <ng-template pTemplate="content">
                @if (actionRequest) {
                    <div class="flex flex-col gap-4 pt-2">
                        <div class="flex flex-col gap-2">
                            <label for="rnotes">Motivo del rechazo</label>
                            <textarea pTextarea inputId="rnotes" [(ngModel)]="rejectNotes" rows="3" style="width:100%" placeholder="Indicá el motivo al cliente..."></textarea>
                        </div>
                    </div>
                }
            </ng-template>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="rejectVisible = false" />
                <p-button label="Rechazar" icon="pi pi-times" [text]="true" severity="danger" (click)="doReject()" [loading]="submitting" />
            </ng-template>
        </p-dialog>
    </div>
    `
})
export class AdminRequests implements OnInit {
    loading = false;
    submitting = false;
    requests: ServiceRequestModel[] = [];
    filterStatus: string | null = null;
    confirmVisible = false;
    rejectVisible = false;
    actionRequest: ServiceRequestModel | null = null;
    confirmPrice: number | null = null;
    confirmNotes = '';
    rejectNotes = '';

    statusOptions = [
        { label: 'Pendiente revisión', value: 'PENDING_REVIEW' },
        { label: 'Confirmado', value: 'CONFIRMED' },
        { label: 'Rechazado', value: 'REJECTED' },
    ];

    constructor(private srs: ServiceRequestService, private toast: MessageService) {}

    ngOnInit() { this.load(); }

    load() {
        this.loading = true;
        this.srs.getRequests(this.filterStatus ? { status: this.filterStatus } : undefined).subscribe({
            next: v => { this.requests = v; this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    openConfirm(r: ServiceRequestModel) {
        this.actionRequest = r;
        this.confirmPrice = null;
        this.confirmNotes = '';
        this.confirmVisible = true;
    }

    openReject(r: ServiceRequestModel) {
        this.actionRequest = r;
        this.rejectNotes = '';
        this.rejectVisible = true;
    }

    doConfirm() {
        if (!this.actionRequest) return;
        this.submitting = true;
        this.srs.confirmRequest(this.actionRequest.id, this.confirmPrice ?? undefined, this.confirmNotes || undefined).subscribe({
            next: () => {
                this.submitting = false;
                this.confirmVisible = false;
                this.toast.add({ severity: 'success', summary: 'Confirmado', detail: 'Solicitud confirmada y servicios creados.', life: 3000 });
                this.load();
            },
            error: () => { this.submitting = false; this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar.' }); },
        });
    }

    doReject() {
        if (!this.actionRequest) return;
        this.submitting = true;
        this.srs.rejectRequest(this.actionRequest.id, this.rejectNotes || undefined).subscribe({
            next: () => {
                this.submitting = false;
                this.rejectVisible = false;
                this.toast.add({ severity: 'success', summary: 'Rechazado', detail: 'Solicitud rechazada.', life: 3000 });
                this.load();
            },
            error: () => { this.submitting = false; this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar.' }); },
        });
    }

    formatDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    formatShortDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }); }
    formatMoney(n: number) { return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 }); }

    statusLabel(s: string): string { return ({ PENDING_REVIEW: 'Pend. revisión', CONFIRMED: 'Confirmado', REJECTED: 'Rechazado' } as any)[s] || s; }
    statusSeverity(s: string): any { return ({ PENDING_REVIEW: 'warn', CONFIRMED: 'success', REJECTED: 'danger' } as any)[s] || 'info'; }
}

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { ServiceRequestService, ServiceRequestModel, ServiceTemplateModel, PassengerModel, ServiceRequestItemModel } from '../../service/service-request.service';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';

interface RequestItem {
    date: Date | null;
    origin: string;
    destination: string;
    passengerId: number | null;
    notes: string;
    _swapped: boolean;
}

@Component({
    selector: 'app-client-portal',
    standalone: true,
    imports: [FormsModule, ButtonModule, SelectModule, DatePickerModule, TextareaModule, DialogModule, TabsModule, ToastModule, InputTextModule, BadgeModule],
    providers: [MessageService],
    styles: [`
        :host { display: block; min-height: 100vh; background: var(--surface-ground); }
        .portal-header {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            padding: 0 1.5rem;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky; top: 0; z-index: 100;
            box-shadow: 0 2px 12px rgba(0,0,0,.4);
        }
        .brand { font-size: 1.2rem; font-weight: 900; color: #fff; letter-spacing: .08em; }
        .brand em { color: #facc15; font-style: normal; }
        .request-card {
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            background: var(--surface-card);
            padding: 1.25rem;
            cursor: pointer;
            transition: border-color .15s, box-shadow .15s;
        }
        .request-card:hover { border-color: var(--primary-color); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        .route-pill {
            background: var(--surface-section);
            border-radius: 999px;
            padding: .25rem .75rem;
            font-size: .78rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: .4rem;
        }
        .stat-card {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            padding: 1.25rem;
            flex: 1;
        }
        .batch-item-card {
            background: var(--surface-section);
            border-radius: 10px;
            padding: 1rem;
            border: 1px solid var(--surface-border);
        }
    `],
    template: `
    <p-toast />

    <!-- Header -->
    <div class="portal-header">
        <div class="flex items-center gap-3">
            <span class="brand">LEC<em>MA</em></span>
            <span style="color:rgba(255,255,255,.4);font-size:.75rem;font-weight:600;letter-spacing:.1em">PORTAL CLIENTE</span>
        </div>
        <div class="flex items-center gap-2">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-color);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:.85rem">
                {{ initials }}
            </div>
            <span style="color:rgba(255,255,255,.8);font-size:.85rem">{{ userName }}</span>
            <p-button icon="pi pi-sign-out" [text]="true" [rounded]="true" severity="secondary" (click)="logout()" pTooltip="Cerrar sesión" tooltipPosition="left" />
        </div>
    </div>

    <div style="max-width:860px;margin:0 auto;padding:1.5rem">

        <!-- Stats row -->
        @if (!loadingRequests) {
            <div class="flex gap-3 mb-4 flex-wrap">
                <div class="stat-card">
                    <div class="text-color-secondary text-xs font-semibold uppercase mb-1" style="letter-spacing:.06em">Total solicitudes</div>
                    <div class="text-3xl font-bold">{{ requests.length }}</div>
                </div>
                <div class="stat-card">
                    <div class="text-color-secondary text-xs font-semibold uppercase mb-1" style="letter-spacing:.06em">Pendientes</div>
                    <div class="text-3xl font-bold" style="color:var(--yellow-500)">{{ countByStatus('PENDING_REVIEW') }}</div>
                </div>
                <div class="stat-card">
                    <div class="text-color-secondary text-xs font-semibold uppercase mb-1" style="letter-spacing:.06em">Confirmadas</div>
                    <div class="text-3xl font-bold" style="color:var(--green-500)">{{ countByStatus('CONFIRMED') }}</div>
                </div>
            </div>
        }

        <!-- Tabs -->
        <p-tabs [value]="activeTab" (valueChange)="setTab($event)">
            <p-tablist>
                <p-tab value="requests">
                    <i class="pi pi-list mr-2"></i>Mis solicitudes
                </p-tab>
                <p-tab value="new-batch">
                    <i class="pi pi-calendar-plus mr-2"></i>Lote semanal
                </p-tab>
                <p-tab value="new-single">
                    <i class="pi pi-send mr-2"></i>Solicitud puntual
                </p-tab>
            </p-tablist>
        </p-tabs>

        <div style="margin-top:1.25rem">

        <!-- MIS SOLICITUDES -->
        @if (activeTab === 'requests') {
            @if (loadingRequests) {
                <div class="flex justify-center p-8">
                    <i class="pi pi-spin pi-spinner text-4xl text-color-secondary"></i>
                </div>
            } @else if (requests.length === 0) {
                <div style="text-align:center;padding:4rem 2rem;background:var(--surface-card);border-radius:16px;border:1px dashed var(--surface-border)">
                    <i class="pi pi-inbox" style="font-size:3rem;color:var(--surface-400)"></i>
                    <div class="font-semibold text-xl mt-4 mb-2">Sin solicitudes aún</div>
                    <div class="text-color-secondary mb-4">Usá las pestañas para crear tu primera solicitud.</div>
                    <p-button label="Nueva solicitud puntual" icon="pi pi-plus" [outlined]="true" (click)="setTab('new-single')" />
                </div>
            } @else {
                <div class="flex flex-col gap-3">
                    @for (r of requests; track r.id) {
                        <div class="request-card" (click)="openDetail(r)">
                            <div class="flex justify-between items-start gap-3">
                                <div class="flex flex-col gap-2 flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <i class="pi" [class.pi-calendar-clock]="r.type === 'WEEKLY_BATCH'" [class.pi-send]="r.type === 'ON_DEMAND'"
                                            style="color:var(--primary-color)"></i>
                                        <span class="font-bold">{{ r.type === 'WEEKLY_BATCH' ? 'Lote semanal' : 'Solicitud puntual' }}</span>
                                        @if (r.isLate) {
                                            <span style="background:var(--red-100);color:var(--red-700);font-size:.72rem;font-weight:700;padding:.15rem .55rem;border-radius:999px">
                                                FUERA DE PLAZO
                                            </span>
                                        }
                                    </div>
                                    <div class="flex items-center gap-2 flex-wrap">
                                        @if (r.template) {
                                            <span class="route-pill"><i class="pi pi-file-edit" style="color:var(--primary-color)"></i>{{ r.template.name }}</span>
                                        }
                                        @if (r.items[0]) {
                                            <span class="route-pill">
                                                <i class="pi pi-map-marker"></i>
                                                {{ r.items[0].origin }} <i class="pi pi-arrow-right" style="font-size:.6rem"></i> {{ r.items[0].destination }}
                                            </span>
                                        }
                                    </div>
                                    <div class="text-color-secondary text-sm">
                                        {{ r.items.length }} servicio{{ r.items.length !== 1 ? 's' : '' }} · {{ formatDate(r.createdAt) }}
                                    </div>
                                </div>
                                <div class="flex flex-col items-end gap-2 shrink-0">
                                    <span [style]="statusStyle(r.status)" style="font-size:.75rem;font-weight:700;padding:.25rem .7rem;border-radius:999px;white-space:nowrap">
                                        {{ statusLabel(r.status) }}
                                    </span>
                                    <i class="pi pi-chevron-right text-color-secondary text-sm"></i>
                                </div>
                            </div>
                            @if (r.adminNotes && r.status === 'REJECTED') {
                                <div class="mt-3 p-3 border-round text-sm flex gap-2" style="background:var(--red-50,#fef2f2);color:var(--red-700)">
                                    <i class="pi pi-info-circle mt-0.5 shrink-0"></i>
                                    {{ r.adminNotes }}
                                </div>
                            }
                        </div>
                    }
                </div>
            }
        }

        <!-- LOTE SEMANAL -->
        @if (activeTab === 'new-batch') {
            <div style="background:var(--surface-card);border-radius:16px;border:1px solid var(--surface-border);padding:1.5rem">
                <div class="font-bold text-xl mb-4">Nuevo lote semanal</div>

                <!-- Template selector -->
                <div class="flex flex-col gap-2 mb-4">
                    <label class="font-semibold text-sm">Plantilla de servicio *</label>
                    @if (templates.length === 0) {
                        <div class="text-color-secondary text-sm p-3 border-round" style="background:var(--surface-section)">No tenés plantillas asignadas.</div>
                    } @else {
                        <p-select [filter]="true" appendTo="body" [options]="templates" [(ngModel)]="selectedTemplate"
                            optionLabel="name" placeholder="Seleccioná una plantilla"
                            [style]="{'width':'100%'}" (onChange)="onTemplateChange()" />
                    }
                </div>

                @if (selectedTemplate) {
                    <!-- Deadline banner -->
                    @if (selectedTemplate.deadlineType !== 'NONE') {
                        <div class="flex gap-2 items-center p-3 border-round border-1 mb-4 text-sm"
                            [style]="isBatchLate()
                                ? 'background:var(--red-50,#fef2f2);border-color:var(--red-300);color:var(--red-700)'
                                : 'background:var(--green-50,#f0fdf4);border-color:var(--green-300);color:var(--green-700)'">
                            <i class="pi shrink-0" [class.pi-exclamation-triangle]="isBatchLate()" [class.pi-check-circle]="!isBatchLate()"></i>
                            @if (isBatchLate()) {
                                Solicitud <strong class="ml-1">fuera de plazo</strong> — el precio puede diferir.
                            } @else {
                                Dentro de plazo · Límite: <strong class="ml-1">{{ deadlineLabel(selectedTemplate) }}</strong>
                            }
                        </div>
                    }

                    <!-- Items -->
                    <div class="flex justify-between items-center mb-3">
                        <span class="font-semibold">Servicios <span style="color:var(--primary-color)">({{ batchItems.length }})</span></span>
                        <p-button label="Agregar" icon="pi pi-plus" size="small" [outlined]="true" (click)="addBatchItem()" />
                    </div>

                    @for (item of batchItems; track $index; let i = $index) {
                        <div class="batch-item-card mb-3">
                            <div class="flex justify-between items-center mb-3">
                                <span class="text-xs font-bold text-color-secondary uppercase" style="letter-spacing:.06em">Servicio #{{ i + 1 }}</span>
                                <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" [rounded]="true" (click)="removeBatchItem(i)" />
                            </div>
                            <div class="grid grid-cols-12 gap-3">
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <label class="text-xs font-semibold text-color-secondary">Fecha y hora</label>
                                    <p-datepicker appendTo="body" [(ngModel)]="item.date" dateFormat="dd/mm/yy" [showTime]="true" hourFormat="24" [style]="{'width':'100%'}" />
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <label class="text-xs font-semibold text-color-secondary">Origen → Destino</label>
                                    <div class="flex items-center gap-1">
                                        <span class="text-sm font-semibold flex-1 truncate" style="min-width:0">{{ item.origin }}</span>
                                        <p-button icon="pi pi-arrow-right-arrow-left" [text]="true" [rounded]="true" size="small" (click)="swapItem(item)" pTooltip="Invertir" />
                                        <span class="text-sm font-semibold flex-1 truncate" style="min-width:0">{{ item.destination }}</span>
                                    </div>
                                </div>
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <label class="text-xs font-semibold text-color-secondary">Pasajero</label>
                                    <p-select [filter]="true" appendTo="body" [options]="passengers" [(ngModel)]="item.passengerId"
                                        optionLabel="name" optionValue="id" placeholder="Opcional"
                                        [style]="{'width':'100%'}" [showClear]="true" />
                                </div>
                                <div class="col-span-12 flex flex-col gap-1">
                                    <label class="text-xs font-semibold text-color-secondary">Notas</label>
                                    <input pInputText type="text" [(ngModel)]="item.notes" placeholder="Observaciones (opcional)" />
                                </div>
                            </div>
                        </div>
                    }

                    @if (batchItems.length === 0) {
                        <div class="text-center text-color-secondary p-4 border-1 surface-border border-round border-dashed mb-4 text-sm">
                            <i class="pi pi-calendar-plus block text-2xl mb-2"></i>
                            Agregá al menos un servicio para continuar
                        </div>
                    }

                    <div class="flex justify-end">
                        <p-button label="Enviar lote" icon="pi pi-send" (click)="submitBatch()" [loading]="submitting" [disabled]="!canSubmitBatch()" />
                    </div>
                }
            </div>
        }

        <!-- SOLICITUD PUNTUAL -->
        @if (activeTab === 'new-single') {
            <div style="background:var(--surface-card);border-radius:16px;border:1px solid var(--surface-border);padding:1.5rem">
                <div class="font-bold text-xl mb-1">Nueva solicitud puntual</div>
                <div class="text-color-secondary text-sm mb-4">
                    <i class="pi pi-info-circle mr-1"></i>
                    Las solicitudes puntuales requieren revisión de precio. Te confirmaremos a la brevedad.
                </div>

                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label class="font-semibold text-sm">Fecha y hora *</label>
                        <p-datepicker appendTo="body" [(ngModel)]="single.date" dateFormat="dd/mm/yy" [showTime]="true" hourFormat="24" [style]="{'width':'100%'}" />
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label class="font-semibold text-sm">Origen *</label>
                            <input pInputText type="text" [(ngModel)]="single.origin" placeholder="Dirección de origen" />
                        </div>
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label class="font-semibold text-sm">Destino *</label>
                            <input pInputText type="text" [(ngModel)]="single.destination" placeholder="Dirección de destino" />
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-semibold text-sm">Pasajero</label>
                        <p-select [filter]="true" appendTo="body" [options]="passengers" [(ngModel)]="single.passengerId"
                            optionLabel="name" optionValue="id" [style]="{'width':'100%'}"
                            placeholder="Seleccioná un pasajero (opcional)" [showClear]="true" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="font-semibold text-sm">Notas adicionales</label>
                        <textarea pTextarea [(ngModel)]="single.notes" rows="3" style="width:100%" placeholder="Requerimientos especiales, horario exacto, etc."></textarea>
                    </div>
                    <div class="flex justify-end">
                        <p-button label="Enviar solicitud" icon="pi pi-send" (click)="submitSingle()" [loading]="submitting" [disabled]="!canSubmitSingle()" />
                    </div>
                </div>
            </div>
        }

        </div><!-- /tab content -->
    </div>

    <!-- Detail dialog -->
    <p-dialog [(visible)]="detailVisible" [modal]="true" [style]="{'width':'min(620px,95vw)'}" header="Detalle de solicitud">
        <ng-template pTemplate="content">
            @if (detailRequest) {
                <div class="flex flex-col gap-4 pt-2">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span [style]="statusStyle(detailRequest.status)" style="font-size:.78rem;font-weight:700;padding:.3rem .8rem;border-radius:999px">
                            {{ statusLabel(detailRequest.status) }}
                        </span>
                        @if (detailRequest.isLate) {
                            <span style="background:var(--red-100);color:var(--red-700);font-size:.72rem;font-weight:700;padding:.25rem .7rem;border-radius:999px">FUERA DE PLAZO</span>
                        }
                        <span class="text-sm text-color-secondary">{{ formatDate(detailRequest.createdAt) }}</span>
                    </div>
                    @if (detailRequest.template) {
                        <div class="text-sm text-color-secondary">Plantilla: <strong>{{ detailRequest.template.name }}</strong></div>
                    }
                    @if (detailRequest.adminNotes) {
                        <div class="p-3 border-round border-1 text-sm flex gap-2" style="background:var(--red-50,#fef2f2);border-color:var(--red-200)">
                            <i class="pi pi-info-circle shrink-0 mt-0.5"></i>
                            <span><strong>Nota del equipo:</strong> {{ detailRequest.adminNotes }}</span>
                        </div>
                    }
                    <div class="flex flex-col gap-2">
                        @for (item of detailRequest.items; track item.id) {
                            <div style="background:var(--surface-section);border-radius:10px;padding:.875rem;border:1px solid var(--surface-border)">
                                <div class="flex justify-between items-start gap-2 mb-2">
                                    <div class="text-xs text-color-secondary font-semibold">{{ formatDate(item.date) }}</div>
                                    @if (item.service) {
                                        <span style="font-size:.7rem;font-weight:700;padding:.2rem .5rem;border-radius:999px;background:var(--surface-200)">{{ serviceStatusLabel(item.service.status) }}</span>
                                    }
                                </div>
                                <div class="font-bold text-sm">{{ item.origin }} <i class="pi pi-arrow-right" style="font-size:.65rem"></i> {{ item.destination }}</div>
                                @if (item.passenger) {
                                    <div class="text-sm text-color-secondary mt-1"><i class="pi pi-user mr-1"></i>{{ item.passenger.name }}</div>
                                }
                                @if (item.notes) {
                                    <div class="text-sm text-color-secondary font-italic mt-1">{{ item.notes }}</div>
                                }
                            </div>
                        }
                    </div>
                </div>
            }
        </ng-template>
        <ng-template pTemplate="footer">
            <p-button label="Cerrar" icon="pi pi-times" [text]="true" (click)="detailVisible = false" />
        </ng-template>
    </p-dialog>
    `
})
export class ClientPortal implements OnInit {
    activeTab = 'requests';
    userName = '';
    initials = '';
    loadingRequests = false;
    submitting = false;

    requests: ServiceRequestModel[] = [];
    templates: ServiceTemplateModel[] = [];
    passengers: PassengerModel[] = [];

    selectedTemplate: ServiceTemplateModel | null = null;
    batchItems: RequestItem[] = [];
    single = { date: null as Date | null, origin: '', destination: '', passengerId: null as number | null, notes: '' };

    detailVisible = false;
    detailRequest: ServiceRequestModel | null = null;

    constructor(private auth: AuthService, private srs: ServiceRequestService, private router: Router, private toast: MessageService) {
        const name = this.auth.getUserName() || this.auth.getUserEmail() || '';
        this.userName = name;
        this.initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
    }

    ngOnInit() {
        this.loadRequests();
        this.srs.getTemplates().subscribe({ next: v => { this.templates = v; } });
        this.srs.getPassengers().subscribe({ next: v => { this.passengers = v; } });
    }

    private loadRequests() {
        this.loadingRequests = true;
        this.srs.getRequests().subscribe({
            next: v => { this.requests = v; this.loadingRequests = false; },
            error: () => { this.loadingRequests = false; },
        });
    }

    countByStatus(status: string) { return this.requests.filter(r => r.status === status).length; }

    onTemplateChange() {
        this.batchItems = [];
        if (this.selectedTemplate) this.addBatchItem();
    }

    addBatchItem() {
        if (!this.selectedTemplate) return;
        this.batchItems.push({ date: null, origin: this.selectedTemplate.origin, destination: this.selectedTemplate.destination, passengerId: null, notes: '', _swapped: false });
    }

    removeBatchItem(i: number) { this.batchItems.splice(i, 1); }

    swapItem(item: RequestItem) {
        const tmp = item.origin;
        item.origin = item.destination;
        item.destination = tmp;
        item._swapped = !item._swapped;
    }

    isBatchLate(): boolean {
        if (!this.selectedTemplate || this.selectedTemplate.deadlineType === 'NONE') return false;
        const t = this.selectedTemplate;
        const now = new Date();
        const day = t.deadlineDay ?? 0;
        const h = t.deadlineHour;
        const m = t.deadlineMinute;
        if (t.deadlineType === 'WEEKLY') {
            const cur = now.getDay();
            if (cur > day) return true;
            if (cur === day && (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m))) return true;
        }
        if (t.deadlineType === 'MONTHLY') {
            const cur = now.getDate();
            if (cur > day) return true;
            if (cur === day && (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m))) return true;
        }
        return false;
    }

    deadlineLabel(t: ServiceTemplateModel): string {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const hh = String(t.deadlineHour).padStart(2, '0');
        const mm = String(t.deadlineMinute).padStart(2, '0');
        if (t.deadlineType === 'WEEKLY') return `${days[t.deadlineDay ?? 0]} a las ${hh}:${mm}`;
        if (t.deadlineType === 'MONTHLY') return `Día ${t.deadlineDay} de cada mes a las ${hh}:${mm}`;
        return '';
    }

    canSubmitBatch() { return !!this.selectedTemplate && this.batchItems.length > 0 && this.batchItems.every(i => i.date && i.origin && i.destination); }
    canSubmitSingle() { return !!this.single.date && !!this.single.origin && !!this.single.destination; }

    submitBatch() {
        if (!this.canSubmitBatch()) return;
        this.submitting = true;
        const items: Partial<ServiceRequestItemModel>[] = this.batchItems.map(i => ({
            date: i.date!.toISOString(), origin: i.origin, destination: i.destination,
            ...(i.passengerId ? { passengerId: i.passengerId } : {}),
            ...(i.notes ? { notes: i.notes } : {}),
        }));
        this.srs.createRequest({ type: 'WEEKLY_BATCH', templateId: this.selectedTemplate!.id, items }).subscribe({
            next: () => {
                this.submitting = false;
                this.toast.add({ severity: 'success', summary: 'Lote enviado', detail: 'Tu solicitud fue enviada correctamente.', life: 4000 });
                this.selectedTemplate = null;
                this.batchItems = [];
                this.setTab('requests');
                this.loadRequests();
            },
            error: () => { this.submitting = false; this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el lote.' }); },
        });
    }

    submitSingle() {
        if (!this.canSubmitSingle()) return;
        this.submitting = true;
        const items: Partial<ServiceRequestItemModel>[] = [{
            date: this.single.date!.toISOString(), origin: this.single.origin, destination: this.single.destination,
            ...(this.single.passengerId ? { passengerId: this.single.passengerId } : {}),
            ...(this.single.notes ? { notes: this.single.notes } : {}),
        }];
        this.srs.createRequest({ type: 'ON_DEMAND', items }).subscribe({
            next: () => {
                this.submitting = false;
                this.toast.add({ severity: 'success', summary: 'Solicitud enviada', detail: 'Te confirmaremos a la brevedad.', life: 4000 });
                this.single = { date: null, origin: '', destination: '', passengerId: null, notes: '' };
                this.setTab('requests');
                this.loadRequests();
            },
            error: () => { this.submitting = false; this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar la solicitud.' }); },
        });
    }

    setTab(val: any) { if (val != null) this.activeTab = String(val); }
    openDetail(r: ServiceRequestModel) { this.detailRequest = r; this.detailVisible = true; }
    logout() { this.auth.logout(); }

    statusStyle(s: string): string {
        const map: any = {
            PENDING_REVIEW: 'background:var(--yellow-100,#fef9c3);color:var(--yellow-800,#854d0e)',
            CONFIRMED: 'background:var(--green-100,#dcfce7);color:var(--green-800,#166534)',
            REJECTED: 'background:var(--red-100,#fee2e2);color:var(--red-800,#991b1b)',
        };
        return map[s] || 'background:var(--surface-200);color:var(--text-color)';
    }
    statusLabel(s: string): string {
        return ({ PENDING_REVIEW: 'Pendiente revisión', CONFIRMED: 'Confirmado', REJECTED: 'Rechazado' } as any)[s] || s;
    }
    serviceStatusLabel(s: string): string {
        return ({ CREATED: 'Creado', PENDING: 'Pendiente', PENDING_DETAILS: 'Env. Detalles', PENDING_INVOICE: 'A Facturar', PAYMENT_PENDING: 'Pend. Pago', PAID: 'Pagado', CANCELLED: 'Cancelado' } as any)[s] || s;
    }
    formatDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
}

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { environment } from '../../../environments/environment';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface DriverService {
    id: number;
    startDate: string;
    endDate?: string;
    origin?: string;
    destination?: string;
    details?: string;
    notes?: string;
    status: string;
    clients: { id: number; name: string }[];
}

interface Settlement {
    id: number;
    code: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    status: string;
    services: DriverService[];
    advances: { id: number; date: string; amount: number; description?: string }[];
}

@Component({
    selector: 'app-driver-portal',
    standalone: true,
    imports: [TagModule, ButtonModule, TabsModule, ToastModule],
    providers: [MessageService],
    styles: [`
        :host { display: block; min-height: 100vh; background: var(--surface-ground); }
        .portal-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
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
        .service-card {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            padding: 1.25rem;
            transition: box-shadow .15s;
        }
        .service-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        .service-card.today {
            border-left: 4px solid #facc15;
        }
        .day-badge {
            min-width: 52px;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: var(--surface-section);
            border-radius: 10px;
            padding: .4rem .5rem;
            gap: .1rem;
        }
        .route-arrow {
            display: inline-flex;
            align-items: center;
            gap: .35rem;
            font-size: .78rem;
            color: var(--text-color-secondary);
        }
        .stat-card {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            flex: 1;
            min-width: 0;
        }
        .settlement-card {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            padding: 1.25rem;
            transition: box-shadow .15s;
        }
        .settlement-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
    `],
    template: `
    <p-toast />

    <!-- Header -->
    <div class="portal-header">
        <div class="flex items-center gap-3">
            <span class="brand">LEC<em>MA</em></span>
            <span style="color:rgba(255,255,255,.4);font-size:.75rem;font-weight:600;letter-spacing:.1em">PORTAL CHOFER</span>
        </div>
        <div class="flex items-center gap-2">
            <div style="width:32px;height:32px;border-radius:50%;background:#facc15;display:flex;align-items:center;justify-content:center;font-weight:700;color:#0f172a;font-size:.85rem">
                {{ initials }}
            </div>
            <span style="color:rgba(255,255,255,.8);font-size:.85rem">{{ userName }}</span>
            <p-button icon="pi pi-sign-out" [text]="true" [rounded]="true" severity="secondary" (click)="logout()" pTooltip="Cerrar sesión" tooltipPosition="left" />
        </div>
    </div>

    <div style="max-width:760px;margin:0 auto;padding:1.5rem">

        <!-- Stats row -->
        @if (!loading) {
            <div class="flex gap-3 mb-4 flex-wrap">
                <div class="stat-card">
                    <div class="text-color-secondary text-xs font-semibold uppercase mb-1" style="letter-spacing:.06em">Esta semana</div>
                    <div class="text-3xl font-bold">{{ weekServices.length }}</div>
                    <div class="text-color-secondary text-xs mt-1">servicio{{ weekServices.length !== 1 ? 's' : '' }}</div>
                </div>
                <div class="stat-card">
                    <div class="text-color-secondary text-xs font-semibold uppercase mb-1" style="letter-spacing:.06em">Hoy</div>
                    <div class="text-3xl font-bold" style="color:#facc15">{{ todayCount }}</div>
                    <div class="text-color-secondary text-xs mt-1">servicio{{ todayCount !== 1 ? 's' : '' }}</div>
                </div>
                <div class="stat-card">
                    <div class="text-color-secondary text-xs font-semibold uppercase mb-1" style="letter-spacing:.06em">Total</div>
                    <div class="text-3xl font-bold">{{ allServices.length }}</div>
                    <div class="text-color-secondary text-xs mt-1">histórico</div>
                </div>
            </div>
        }

        <!-- Tabs -->
        <p-tabs [value]="activeTab" (valueChange)="setTab($event)">
            <p-tablist>
                <p-tab value="week">
                    <i class="pi pi-calendar mr-2"></i>Esta semana
                </p-tab>
                <p-tab value="all">
                    <i class="pi pi-list mr-2"></i>Todos mis servicios
                </p-tab>
                <p-tab value="settlements">
                    <i class="pi pi-wallet mr-2"></i>Liquidaciones
                </p-tab>
            </p-tablist>
        </p-tabs>

        <div style="margin-top:1.25rem">

        <!-- ESTA SEMANA -->
        @if (activeTab === 'week') {
            @if (loading) {
                <div class="flex justify-center p-8">
                    <i class="pi pi-spin pi-spinner text-4xl text-color-secondary"></i>
                </div>
            } @else if (weekServices.length === 0) {
                <div style="text-align:center;padding:4rem 2rem;background:var(--surface-card);border-radius:16px;border:1px dashed var(--surface-border)">
                    <i class="pi pi-calendar" style="font-size:3rem;color:var(--surface-400)"></i>
                    <div class="font-semibold text-xl mt-4 mb-2">Sin servicios esta semana</div>
                    <div class="text-color-secondary">No tenés servicios asignados para los próximos días.</div>
                </div>
            } @else {
                <!-- Group by day -->
                @for (day of weekDays; track day.label) {
                    @if (getServicesForDay(day.date).length > 0) {
                        <div class="mb-1 mt-4 flex items-center gap-3">
                            <span class="text-xs font-bold uppercase text-color-secondary" style="letter-spacing:.08em">{{ day.label }}</span>
                            <div style="flex:1;height:1px;background:var(--surface-border)"></div>
                            <span style="font-size:.75rem;background:var(--surface-section);border-radius:999px;padding:.15rem .6rem;font-weight:700">{{ getServicesForDay(day.date).length }}</span>
                        </div>
                        <div class="flex flex-col gap-3 mb-2">
                            @for (s of getServicesForDay(day.date); track s.id) {
                                <div class="service-card" [class.today]="isToday(s.startDate)">
                                    <div class="flex gap-3">
                                        <div class="day-badge shrink-0">
                                            <span style="font-size:1.6rem;font-weight:800;line-height:1">{{ formatDayNum(s.startDate) }}</span>
                                            <span style="font-size:.65rem;font-weight:700;letter-spacing:.05em;color:var(--text-color-secondary)">{{ formatMonth(s.startDate) }}</span>
                                        </div>
                                        <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                                            <div class="flex justify-between items-start gap-2">
                                                <div class="font-bold text-base truncate flex-1">
                                                    {{ s.origin || '—' }}
                                                    <i class="pi pi-arrow-right mx-1" style="font-size:.65rem;color:var(--text-color-secondary)"></i>
                                                    {{ s.destination || '—' }}
                                                </div>
                                                <span [style]="serviceStatusStyle(s.status)" style="font-size:.7rem;font-weight:700;padding:.2rem .55rem;border-radius:999px;white-space:nowrap;shrink-0">
                                                    {{ statusLabel(s.status) }}
                                                </span>
                                            </div>
                                            <div class="flex items-center gap-3 flex-wrap">
                                                <span style="color:#facc15;font-weight:700;font-size:.9rem">
                                                    <i class="pi pi-clock mr-1" style="font-size:.75rem"></i>{{ formatHour(s.startDate) }}
                                                </span>
                                                @if (s.details) {
                                                    <span class="text-sm text-color-secondary">
                                                        <i class="pi pi-user mr-1" style="font-size:.7rem"></i>{{ s.details }}
                                                    </span>
                                                }
                                                @if (s.clients.length) {
                                                    <span class="text-sm text-color-secondary">
                                                        <i class="pi pi-building mr-1" style="font-size:.7rem"></i>{{ s.clients[0].name }}
                                                    </span>
                                                }
                                            </div>
                                            @if (s.notes) {
                                                <div class="text-sm font-italic text-color-secondary">{{ s.notes }}</div>
                                            }
                                            @if (isToday(s.startDate)) {
                                                <div style="margin-top:.25rem">
                                                    <span style="background:#facc15;color:#0f172a;font-size:.7rem;font-weight:800;padding:.2rem .55rem;border-radius:999px;letter-spacing:.04em">HOY</span>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    }
                }
            }
        }

        <!-- TODOS MIS SERVICIOS -->
        @if (activeTab === 'all') {
            @if (loading) {
                <div class="flex justify-center p-8">
                    <i class="pi pi-spin pi-spinner text-4xl text-color-secondary"></i>
                </div>
            } @else if (allServices.length === 0) {
                <div style="text-align:center;padding:4rem 2rem;background:var(--surface-card);border-radius:16px;border:1px dashed var(--surface-border)">
                    <i class="pi pi-list" style="font-size:3rem;color:var(--surface-400)"></i>
                    <div class="font-semibold text-xl mt-4 mb-2">Sin servicios asignados</div>
                    <div class="text-color-secondary">Tu historial de servicios aparecerá acá.</div>
                </div>
            } @else {
                <div style="background:var(--surface-card);border-radius:12px;border:1px solid var(--surface-border);overflow:hidden">
                    @for (s of allServices; track s.id; let last = $last) {
                        <div class="flex gap-3 items-center px-4 py-3" [style]="last ? '' : 'border-bottom: 1px solid var(--surface-border)'">
                            <div style="min-width:48px;text-align:center">
                                <div style="font-size:.95rem;font-weight:800;line-height:1.1">{{ formatDayNum(s.startDate) }}</div>
                                <div style="font-size:.65rem;color:var(--text-color-secondary);font-weight:600;letter-spacing:.04em">{{ formatMonthYear(s.startDate) }}</div>
                            </div>
                            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                                <div class="font-semibold text-sm truncate">{{ s.origin || '—' }} → {{ s.destination || '—' }}</div>
                                @if (s.details) {
                                    <div class="text-xs text-color-secondary truncate"><i class="pi pi-user mr-1"></i>{{ s.details }}</div>
                                }
                            </div>
                            <div class="flex flex-col items-end gap-1 shrink-0">
                                <span style="font-size:.65rem;font-weight:700;color:var(--text-color-secondary)">{{ formatHour(s.startDate) }}</span>
                                <span [style]="serviceStatusStyle(s.status)" style="font-size:.65rem;font-weight:700;padding:.15rem .5rem;border-radius:999px;white-space:nowrap">
                                    {{ statusLabel(s.status) }}
                                </span>
                            </div>
                        </div>
                    }
                </div>
            }
        }

        <!-- LIQUIDACIONES -->
        @if (activeTab === 'settlements') {
            @if (loadingSettlements) {
                <div class="flex justify-center p-8">
                    <i class="pi pi-spin pi-spinner text-4xl text-color-secondary"></i>
                </div>
            } @else if (settlements.length === 0) {
                <div style="text-align:center;padding:4rem 2rem;background:var(--surface-card);border-radius:16px;border:1px dashed var(--surface-border)">
                    <i class="pi pi-wallet" style="font-size:3rem;color:var(--surface-400)"></i>
                    <div class="font-semibold text-xl mt-4 mb-2">Sin liquidaciones aún</div>
                    <div class="text-color-secondary">Tus liquidaciones procesadas aparecerán acá.</div>
                </div>
            } @else {
                <div class="flex flex-col gap-3">
                    @for (s of settlements; track s.id) {
                        <div class="settlement-card">
                            <div class="flex justify-between items-start gap-3 mb-3">
                                <div>
                                    <div class="font-bold text-lg">{{ s.code }}</div>
                                    <div class="text-sm text-color-secondary mt-0.5">
                                        <i class="pi pi-calendar mr-1"></i>
                                        {{ formatShortDate(s.startDate) }} al {{ formatShortDate(s.endDate) }}
                                    </div>
                                </div>
                                <div class="flex flex-col items-end gap-2">
                                    <span [style]="settlementStatusStyle(s.status)" style="font-size:.75rem;font-weight:700;padding:.25rem .7rem;border-radius:999px">
                                        {{ settlementLabel(s.status) }}
                                    </span>
                                </div>
                            </div>
                            <div style="background:var(--surface-section);border-radius:10px;padding:1rem;margin-bottom:.75rem">
                                <div class="text-3xl font-black" style="color:var(--green-500)">
                                    $ {{ formatMoney(s.totalAmount) }}
                                </div>
                                <div class="text-xs text-color-secondary mt-0.5">Total liquidado</div>
                            </div>
                            <div class="flex gap-4 text-sm text-color-secondary">
                                <span><i class="pi pi-car mr-1"></i>{{ s.services.length }} servicio{{ s.services.length !== 1 ? 's' : '' }}</span>
                                @if (s.advances.length) {
                                    <span><i class="pi pi-money-bill mr-1"></i>{{ s.advances.length }} adelanto{{ s.advances.length !== 1 ? 's' : '' }}</span>
                                }
                            </div>
                        </div>
                    }
                </div>
            }
        }

        </div><!-- /tab content -->
    </div>
    `
})
export class DriverPortal implements OnInit {
    activeTab = 'week';
    loading = false;
    loadingSettlements = false;
    weekServices: DriverService[] = [];
    allServices: DriverService[] = [];
    settlements: Settlement[] = [];
    userName = '';
    initials = '';
    private api = environment.apiUrl;

    weekDays: { label: string; date: Date }[] = [];

    constructor(private http: HttpClient, private auth: AuthService, private router: Router) {
        const name = this.auth.getUserName() || this.auth.getUserEmail() || '';
        this.userName = name;
        this.initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
        this.buildWeekDays();
    }

    ngOnInit() {
        this.loadWeekServices();
        this.loadAllServices();
        this.loadSettlements();
    }

    private buildWeekDays() {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);
        this.weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return { label: dayNames[d.getDay()], date: d };
        });
    }

    get todayCount() { return this.weekServices.filter(s => this.isToday(s.startDate)).length; }

    getServicesForDay(day: Date): DriverService[] {
        return this.weekServices.filter(s => {
            const d = new Date(s.startDate);
            return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
        }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }

    private loadWeekServices() {
        this.loading = true;
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        this.http.get<DriverService[]>(`${this.api}driver-portal/services?from=${monday.toISOString()}&to=${sunday.toISOString()}`).subscribe({
            next: v => { this.weekServices = v; this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    private loadAllServices() {
        this.http.get<DriverService[]>(`${this.api}driver-portal/services`).subscribe({ next: v => { this.allServices = v; } });
    }

    private loadSettlements() {
        this.loadingSettlements = true;
        this.http.get<Settlement[]>(`${this.api}driver-portal/settlements`).subscribe({
            next: v => { this.settlements = v; this.loadingSettlements = false; },
            error: () => { this.loadingSettlements = false; },
        });
    }

    setTab(val: any) { if (val != null) this.activeTab = String(val); }
    logout() { this.auth.logout(); }

    isToday(dateStr: string): boolean {
        const d = new Date(dateStr), now = new Date();
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    formatDay(d: string) { return new Date(d).toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase(); }
    formatDayNum(d: string) { return new Date(d).getDate(); }
    formatMonth(d: string) { return new Date(d).toLocaleDateString('es-AR', { month: 'short' }).toUpperCase(); }
    formatMonthYear(d: string) { return new Date(d).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }); }
    formatHour(d: string) { return new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); }
    formatShortDate(d: string) { return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }); }
    formatMoney(n: number) { return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

    serviceStatusStyle(s: string): string {
        const map: any = {
            CREATED: 'background:var(--blue-100,#dbeafe);color:var(--blue-800,#1e40af)',
            PENDING: 'background:var(--yellow-100,#fef9c3);color:var(--yellow-800,#854d0e)',
            PENDING_DETAILS: 'background:var(--yellow-100);color:var(--yellow-800)',
            PENDING_INVOICE: 'background:var(--orange-100,#ffedd5);color:var(--orange-800,#9a3412)',
            PAYMENT_PENDING: 'background:var(--red-100,#fee2e2);color:var(--red-800,#991b1b)',
            PAID: 'background:var(--green-100,#dcfce7);color:var(--green-800,#166534)',
            CANCELLED: 'background:var(--surface-200);color:var(--text-color-secondary)',
        };
        return map[s] || 'background:var(--surface-200);color:var(--text-color)';
    }

    statusLabel(s: string): string {
        return ({ CREATED: 'Creado', PENDING: 'Pendiente', PENDING_DETAILS: 'Env. Detalles', PENDING_INVOICE: 'A Facturar', PAYMENT_PENDING: 'Pend. Pago', PAID: 'Pagado', CANCELLED: 'Cancelado' } as any)[s] || s;
    }

    settlementStatusStyle(s: string): string {
        const map: any = {
            DRAFT: 'background:var(--yellow-100,#fef9c3);color:var(--yellow-800,#854d0e)',
            PROCESSED: 'background:var(--blue-100,#dbeafe);color:var(--blue-800,#1e40af)',
            PAID: 'background:var(--green-100,#dcfce7);color:var(--green-800,#166534)',
        };
        return map[s] || 'background:var(--surface-200);color:var(--text-color)';
    }
    settlementLabel(s: string): string { return ({ DRAFT: 'Borrador', PROCESSED: 'Procesado', PAID: 'Pagado' } as any)[s] || s; }
}

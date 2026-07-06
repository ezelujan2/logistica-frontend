import { Component, HostListener, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { Service } from '../../service/service.service';

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    services: Service[];
}

@Component({
    selector: 'app-service-calendar',
    standalone: true,
    imports: [CommonModule, ButtonModule, TooltipModule, BadgeModule, SelectButtonModule, DialogModule, TagModule, FormsModule],
    providers: [DatePipe],
    template: `
        <div class="cal-wrapper">

            <!-- ── HEADER ── -->
            <div class="flex items-center justify-between px-3 py-3 border-b border-surface-200 dark:border-surface-700 gap-2">
                <div class="flex items-center gap-1 min-w-0">
                    <button pButton icon="pi pi-chevron-left" [rounded]="true" [text]="true" severity="secondary" size="small" (click)="previousPeriod()"></button>
                    <span class="text-sm font-bold capitalize px-1 truncate" style="min-width:130px;text-align:center;">
                        {{ getFormattedHeader() }}
                    </span>
                    <button pButton icon="pi pi-chevron-right" [rounded]="true" [text]="true" severity="secondary" size="small" (click)="nextPeriod()"></button>
                </div>
                <div class="flex gap-2 items-center flex-shrink-0">
                    <p-selectButton [options]="viewOptions" [(ngModel)]="viewMode" optionLabel="label" optionValue="value" (onChange)="generateCalendar()"></p-selectButton>
                    <button pButton label="Hoy" size="small" [outlined]="true" (click)="goToToday()"></button>
                </div>
            </div>

            <!-- ══════════════════════════════════════
                 VISTA MES - Desktop
            ══════════════════════════════════════ -->
            <ng-container *ngIf="viewMode === 'month' && !isMobile">
                <div class="cal-grid-header">
                    <div *ngFor="let d of weekDays" class="text-center text-xs font-semibold text-color-secondary py-2 uppercase tracking-wider">{{ d }}</div>
                </div>
                <div class="cal-grid-body">
                    <div *ngFor="let day of calendarDays"
                         class="cal-cell group"
                         [ngClass]="{ 'cal-cell--other-month': !day.isCurrentMonth, 'cal-cell--today': day.isToday }"
                         (click)="onAddClick($event, day.date)">
                        <div class="flex justify-between items-start mb-1">
                            <button pButton icon="pi pi-plus" [rounded]="true" [text]="true" size="small"
                                    class="opacity-0 group-hover:opacity-100 w-6 h-6 p-0"
                                    (click)="onAddClick($event, day.date)" pTooltip="Nuevo servicio" tooltipPosition="top">
                            </button>
                            <span class="cal-day-number" [ngClass]="day.isToday ? 'cal-day-number--today' : ''">{{ day.date.getDate() }}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <div *ngFor="let s of day.services.slice(0, 2)"
                                 class="cal-month-card" [ngClass]="getServicePillClass(s.status)"
                                 (click)="onServiceClick($event, s)" [pTooltip]="getServiceTooltip(s)" tooltipPosition="top">
                                <div class="flex items-center gap-1 leading-tight">
                                    <span class="font-bold text-[11px] flex-shrink-0">{{ s.startDate | date:'HH:mm' }}</span>
                                    <span class="truncate text-[11px]">{{ s.origin }} → {{ s.destination }}</span>
                                </div>
                                <div *ngIf="s.clientNames" class="truncate text-[10px] opacity-70 mt-0.5 leading-tight">
                                    <i class="pi pi-building text-[9px] mr-0.5"></i>{{ s.clientNames }}
                                </div>
                            </div>
                            <span *ngIf="day.services.length > 2" class="text-[11px] text-primary font-semibold px-1 cursor-pointer hover:underline"
                                  (click)="openDayDetail($event, day)">+{{ day.services.length - 2 }} más</span>
                        </div>
                    </div>
                </div>
            </ng-container>

            <!-- ══════════════════════════════════════
                 VISTA MES - Mobile (grid compacto + agenda)
            ══════════════════════════════════════ -->
            <ng-container *ngIf="viewMode === 'month' && isMobile">
                <div class="cal-grid-header">
                    <div *ngFor="let d of weekDaysMobile" class="text-center text-xs font-semibold text-color-secondary py-2">{{ d }}</div>
                </div>
                <div class="cal-grid-body cal-grid-body--mobile">
                    <div *ngFor="let day of calendarDays"
                         class="flex flex-col items-center py-1.5 cursor-pointer select-none"
                         [ngClass]="{ 'opacity-30': !day.isCurrentMonth }"
                         (click)="selectDay(day)">
                        <span class="cal-day-number"
                              [ngClass]="{ 'cal-day-number--today': day.isToday && !isSelectedDay(day), 'cal-day-number--selected': isSelectedDay(day) }">
                            {{ day.date.getDate() }}
                        </span>
                        <div class="flex gap-0.5 mt-0.5 h-1.5">
                            <span *ngFor="let s of day.services.slice(0,3)" class="w-1.5 h-1.5 rounded-full" [ngClass]="getDotClass(s.status)"></span>
                        </div>
                    </div>
                </div>
                <!-- Agenda día seleccionado -->
                <div *ngIf="selectedDay" class="border-t border-surface-200 dark:border-surface-700">
                    <div class="flex items-center justify-between px-4 py-2 bg-surface-50 dark:bg-surface-800">
                        <span class="font-semibold text-sm">{{ getSelectedDayLabel() }}</span>
                        <button pButton icon="pi pi-plus" size="small" [rounded]="true" [text]="true" (click)="onAddClick($event, selectedDay.date)"></button>
                    </div>
                    <div *ngIf="selectedDay.services.length === 0" class="flex flex-col items-center py-8 text-color-secondary text-sm gap-2">
                        <i class="pi pi-calendar-times text-3xl"></i>Sin servicios este día
                    </div>
                    <div *ngFor="let s of selectedDay.services"
                         class="flex items-start gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-700 cursor-pointer active:bg-surface-100"
                         (click)="onServiceClick($event, s)">
                        <div class="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" [ngClass]="getDotClass(s.status)"></div>
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold text-sm truncate">{{ s.startDate | date:'HH:mm' }} — {{ s.origin }} → {{ s.destination }}</div>
                            <div class="text-xs text-color-secondary mt-0.5 flex gap-3">
                                <span *ngIf="s.driverNames"><i class="pi pi-user text-[10px] mr-1"></i>{{ s.driverNames }}</span>
                                <span *ngIf="s.clientNames"><i class="pi pi-building text-[10px] mr-1"></i>{{ s.clientNames }}</span>
                            </div>
                        </div>
                        <span class="cal-pill flex-shrink-0" [ngClass]="getServicePillClass(s.status)">{{ translateStatus(s.status) }}</span>
                    </div>
                </div>
            </ng-container>

            <!-- ══════════════════════════════════════
                 VISTA SEMANA PANORÁMICA (desktop + mobile)
                 Mobile: scroll horizontal
            ══════════════════════════════════════ -->
            <ng-container *ngIf="viewMode === 'week'">
                <div class="week-scroll"
                     (touchstart)="onWeekPinchStart($event)"
                     (touchmove)="onWeekPinchMove($event)">
                    <!-- Hint de zoom (aparece al pellizcar, posicionado sobre la grilla) -->
                    <div *ngIf="isMobile && zoomHintVisible" class="zoom-hint">
                        <i class="pi pi-arrows-h text-xs mr-1"></i>{{ weekZoomDays }} días
                    </div>
                    <div class="week-grid" [style.gridTemplateColumns]="weekGridColumns">

                        <!-- Cabecera de cada día -->
                        <div *ngFor="let day of calendarDays"
                             class="week-col-header"
                             [ngClass]="{ 'week-col-header--today': day.isToday }">
                            <span class="week-day-name">{{ getShortDayName(day.date) }}</span>
                            <span class="cal-day-number mt-1"
                                  [ngClass]="day.isToday ? 'cal-day-number--today' : ''">
                                {{ day.date.getDate() }}
                            </span>
                            <span class="text-[10px] text-color-secondary">{{ months[day.date.getMonth()].slice(0,3) }}</span>
                        </div>

                        <!-- Servicios de cada día -->
                        <div *ngFor="let day of calendarDays"
                             class="week-col-body"
                             [ngClass]="{ 'week-col-body--today': day.isToday }"
                             (click)="onAddClick($event, day.date)">

                            <!-- Sin servicios -->
                            <div *ngIf="day.services.length === 0" class="week-empty">
                                <button pButton icon="pi pi-plus" [rounded]="true" [text]="true" severity="secondary" size="small"
                                        (click)="onAddClick($event, day.date)"></button>
                            </div>

                            <!-- Tarjeta por servicio -->
                            <div *ngFor="let s of day.services"
                                 class="week-card" [ngClass]="getWeekCardClass(s.status)"
                                 (click)="onServiceClick($event, s)">
                                <!-- hora -->
                                <div class="week-card-time">{{ s.startDate | date:'HH:mm' }}</div>
                                <!-- ruta -->
                                <div class="week-card-route">
                                    <i class="pi pi-map-marker text-[9px] mr-0.5"></i>
                                    <span class="truncate">{{ s.origin }}</span>
                                </div>
                                <div class="week-card-route" *ngIf="s.destination">
                                    <i class="pi pi-arrow-right text-[9px] mr-0.5"></i>
                                    <span class="truncate">{{ s.destination }}</span>
                                </div>
                                <!-- cliente -->
                                <div class="week-card-detail" *ngIf="s.clientNames">
                                    <i class="pi pi-building text-[9px] mr-0.5"></i>
                                    <span class="truncate">{{ s.clientNames }}</span>
                                </div>
                                <!-- chofer -->
                                <div class="week-card-detail" *ngIf="s.driverNames">
                                    <i class="pi pi-user text-[9px] mr-0.5"></i>
                                    <span class="truncate">{{ s.driverNames }}</span>
                                </div>
                                <!-- estado -->
                                <div class="mt-1.5">
                                    <span class="cal-pill" [ngClass]="getServicePillClass(s.status)">{{ translateStatus(s.status) }}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </ng-container>

        <!-- ══ DIALOG: todos los servicios de un día ══ -->
        <p-dialog [(visible)]="dayDetailVisible"
                  [header]="dayDetailLabel"
                  [modal]="true"
                  [style]="{ width: '480px', 'max-width': '95vw' }"
                  [draggable]="false">
            <div class="flex flex-col gap-2 pt-1">
                <div *ngFor="let s of dayDetailServices"
                     class="flex items-start gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                     (click)="onServiceClick($event, s); dayDetailVisible = false">
                    <div class="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" [ngClass]="getDotClass(s.status)"></div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-sm">{{ s.startDate | date:'HH:mm' }}</span>
                            <span class="cal-pill" [ngClass]="getServicePillClass(s.status)">{{ translateStatus(s.status) }}</span>
                        </div>
                        <div class="font-semibold text-sm truncate">{{ s.origin }} → {{ s.destination }}</div>
                        <div class="flex gap-4 mt-1 text-xs text-color-secondary">
                            <span *ngIf="s.clientNames"><i class="pi pi-building mr-1"></i>{{ s.clientNames }}</span>
                            <span *ngIf="s.driverNames"><i class="pi pi-user mr-1"></i>{{ s.driverNames }}</span>
                        </div>
                    </div>
                    <i class="pi pi-pencil text-color-secondary text-sm mt-1 flex-shrink-0"></i>
                </div>
            </div>
        </p-dialog>

        </div>
    `,
    styles: [`
        .cal-wrapper {
            background: var(--surface-card);
            border-radius: 12px;
            border: 1px solid var(--surface-border);
            overflow: hidden;
        }

        /* ── Grilla mes ── */
        .cal-grid-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-bottom: 1px solid var(--surface-border);
            background: var(--surface-ground);
        }
        .cal-grid-body {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        .cal-cell {
            min-height: 150px;
            min-width: 0;
            padding: 6px 8px;
            border-right: 1px solid var(--surface-border);
            border-bottom: 1px solid var(--surface-border);
            display: flex;
            flex-direction: column;
            background: var(--surface-card);
            cursor: pointer;
            transition: background 0.15s;
            overflow: hidden;
        }
        .cal-cell:hover { background: var(--surface-hover); }
        .cal-cell--other-month { opacity: 0.35; }
        .cal-cell--today { background: color-mix(in srgb, var(--primary-color) 6%, var(--surface-card)); }

        /* ── Número de día (círculo) ── */
        .cal-day-number {
            display: flex; align-items: center; justify-content: center;
            width: 30px; height: 30px; border-radius: 50%;
            font-size: 13px; font-weight: 500; color: var(--text-color); flex-shrink: 0;
        }
        .cal-day-number--today    { background: var(--primary-color); color: #fff; font-weight: 700; }
        .cal-day-number--selected { background: var(--primary-700, #1d4ed8); color: #fff; font-weight: 700; }

        /* ── Tarjeta mes desktop (2 líneas) ── */
        .cal-month-card {
            border-radius: 5px;
            padding: 4px 7px;
            cursor: pointer;
            transition: filter 0.15s;
        }
        .cal-month-card:hover { filter: brightness(0.93); }

        /* ── Pill de servicio ── */
        .cal-pill {
            font-size: 11px; padding: 2px 6px; border-radius: 4px;
            cursor: pointer; line-height: 1.5; white-space: nowrap;
        }
        .cal-pill:hover { filter: brightness(0.93); }

        /* ── Colores pills ── */
        .pill-gray   { background: var(--surface-300, #d1d5db); color: var(--text-color); }
        .pill-yellow { background: #fef08a; color: #854d0e; }
        .pill-blue   { background: #bfdbfe; color: #1e3a8a; }
        .pill-purple { background: #e9d5ff; color: #581c87; }
        .pill-green  { background: #bbf7d0; color: #14532d; }
        .pill-red    { background: #fecaca; color: #7f1d1d; }

        /* ── Dots mobile ── */
        .dot-gray   { background: #9ca3af; }
        .dot-yellow { background: #eab308; }
        .dot-blue   { background: #3b82f6; }
        .dot-purple { background: #a855f7; }
        .dot-green  { background: #22c55e; }
        .dot-red    { background: #ef4444; }

        /* ── Grid mes mobile ── */
        .cal-grid-body--mobile .cal-day-number { width: 32px; height: 32px; font-size: 14px; }

        /* ══ VISTA SEMANA PANORÁMICA ══ */
        .week-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            position: relative;
        }
        .week-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(148px, 1fr));
            grid-template-rows: auto 1fr;
            width: 100%;
        }

        /* Hint de zoom (aparece y desaparece) */
        .zoom-hint {
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.65);
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 999px;
            pointer-events: none;
            z-index: 10;
            animation: zoomhint-in 0.15s ease;
        }
        @keyframes zoomhint-in {
            from { opacity: 0; transform: translateX(-50%) scale(0.85); }
            to   { opacity: 1; transform: translateX(-50%) scale(1); }
        }

        /* Cabecera de columna */
        .week-col-header {
            display: flex; flex-direction: column; align-items: center;
            padding: 10px 4px 8px;
            border-right: 1px solid var(--surface-border);
            border-bottom: 2px solid var(--surface-border);
            background: var(--surface-ground);
            position: sticky; top: 0; z-index: 2;
            min-width: 0; overflow: hidden;
        }
        .week-col-header--today {
            background: color-mix(in srgb, var(--primary-color) 8%, var(--surface-ground));
            border-bottom-color: var(--primary-color);
        }
        .week-day-name { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-color-secondary); }

        /* Columna de servicios */
        .week-col-body {
            padding: 8px 6px;
            border-right: 1px solid var(--surface-border);
            display: flex; flex-direction: column; gap: 6px;
            min-height: 200px;
            background: var(--surface-card);
            cursor: pointer;
            transition: background 0.15s;
        }
        .week-col-body:hover { background: var(--surface-hover); }
        .week-col-body--today { background: color-mix(in srgb, var(--primary-color) 4%, var(--surface-card)); }

        /* Placeholder sin servicios */
        .week-empty {
            display: flex; align-items: center; justify-content: center;
            height: 60px; opacity: 0.4;
        }

        /* Tarjeta de servicio en la semana */
        .week-card {
            border-radius: 8px;
            padding: 8px 10px;
            cursor: pointer;
            transition: filter 0.15s, transform 0.1s;
            border-left: 3px solid transparent;
        }
        .week-card:hover { filter: brightness(0.93); transform: translateY(-1px); }
        .week-card:active { transform: translateY(0); }

        .week-card-time   { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
        .week-card-route  { font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 2px; overflow: hidden; }
        .week-card-detail { font-size: 11px; color: inherit; opacity: 0.75; display: flex; align-items: center; gap: 2px; overflow: hidden; margin-top: 2px; }

        /* Colores de tarjetas semana */
        .week-card-gray   { background: var(--surface-200, #e5e7eb); color: var(--text-color); border-left-color: #9ca3af; }
        .week-card-yellow { background: #fefce8; color: #713f12; border-left-color: #eab308; }
        .week-card-blue   { background: #eff6ff; color: #1e3a8a; border-left-color: #3b82f6; }
        .week-card-purple { background: #faf5ff; color: #581c87; border-left-color: #a855f7; }
        .week-card-green  { background: #f0fdf4; color: #14532d; border-left-color: #22c55e; }
        .week-card-red    { background: #fff1f2; color: #7f1d1d; border-left-color: #ef4444; }
    `]
})
export class ServiceCalendar implements OnInit, OnChanges {
    @Input() allServices: Service[] = [];
    @Output() editService = new EventEmitter<Service>();
    @Output() addServiceDate = new EventEmitter<Date>();

    isMobile: boolean = window.innerWidth < 768;
    selectedDay: CalendarDay | null = null;

    dayDetailVisible = false;
    dayDetailLabel = '';
    dayDetailServices: Service[] = [];

    weekZoomDays: number = 7;
    private _pinchStartDist = 0;
    private _pinchStartDays = 7;
    zoomHintVisible = false;
    private _zoomHintTimer: any = null;

    currentDate: Date = new Date();
    weekDays: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    weekDaysMobile: string[] = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    months: string[] = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    calendarDays: CalendarDay[] = [];

    viewMode: 'month' | 'week' = 'month';
    viewOptions = [
        { label: 'Mes', value: 'month' },
        { label: 'Semana', value: 'week' }
    ];

    @HostListener('window:resize')
    onResize() {
        this.isMobile = window.innerWidth < 768;
        if (!this.isMobile) this.weekZoomDays = 7;
    }

    constructor(private datePipe: DatePipe) {}

    ngOnInit() {
        this.weekZoomDays = this.isMobile ? 3 : 7;
        this._pinchStartDays = this.weekZoomDays;
        this.generateCalendar();
        this.autoSelectToday();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['allServices']) {
            this.generateCalendar();
            this.autoSelectToday();
        }
    }

    autoSelectToday() {
        if (!this.selectedDay) {
            const today = this.calendarDays.find(d => d.isToday);
            this.selectedDay = today ?? this.calendarDays.find(d => d.isCurrentMonth) ?? null;
        }
    }

    selectDay(day: CalendarDay) { this.selectedDay = day; }

    isSelectedDay(day: CalendarDay): boolean {
        return !!this.selectedDay && this.isSameDay(day.date, this.selectedDay.date);
    }

    getSelectedDayLabel(): string {
        if (!this.selectedDay) return '';
        const d = this.selectedDay.date;
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return `${dayNames[d.getDay()]} ${d.getDate()} de ${this.months[d.getMonth()]}`;
    }

    openDayDetail(event: Event, day: CalendarDay) {
        event.stopPropagation();
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        this.dayDetailLabel = `${dayNames[day.date.getDay()]} ${day.date.getDate()} de ${this.months[day.date.getMonth()]}`;
        this.dayDetailServices = day.services;
        this.dayDetailVisible = true;
    }

    getShortDayName(date: Date): string {
        return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];
    }

    getWeekCardClass(status: string): string {
        switch (status) {
            case 'PENDING':         return 'week-card week-card-yellow';
            case 'PENDING_DETAILS': return 'week-card week-card-blue';
            case 'PENDING_INVOICE': return 'week-card week-card-purple';
            case 'PAYMENT_PENDING': return 'week-card week-card-red';
            case 'PAID':            return 'week-card week-card-green';
            case 'CANCELLED':       return 'week-card week-card-red';
            default:                return 'week-card week-card-gray';
        }
    }

    getDotClass(status: string): string {
        switch (status) {
            case 'PENDING':         return 'dot-yellow';
            case 'PENDING_DETAILS': return 'dot-blue';
            case 'PENDING_INVOICE': return 'dot-purple';
            case 'PAYMENT_PENDING': return 'dot-red';
            case 'PAID':            return 'dot-green';
            case 'CANCELLED':       return 'dot-red';
            default:                return 'dot-gray';
        }
    }

    getFormattedHeader(): string {
        if (this.viewMode === 'month') {
            const monthName = this.months[this.currentDate.getMonth()];
            const year = this.currentDate.getFullYear();
            return `${monthName} ${year}`;
        } else {
            const currentDayOfWeek = this.currentDate.getDay();
            const startOfWeek = new Date(this.currentDate);
            startOfWeek.setDate(this.currentDate.getDate() - currentDayOfWeek);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const startMonthName = this.months[startOfWeek.getMonth()].slice(0, 3);
            const endMonthName = this.months[endOfWeek.getMonth()].slice(0, 3);

            if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                if (startOfWeek.getFullYear() !== endOfWeek.getFullYear()) {
                    return `Del ${startOfWeek.getDate()} al ${endOfWeek.getDate()} de ${this.months[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()} - ${endOfWeek.getFullYear()}`;
                }
                return `Del ${startOfWeek.getDate()} al ${endOfWeek.getDate()} de ${this.months[startOfWeek.getMonth()]} ${startOfWeek.getFullYear()}`;
            } else {
                return `Del ${startOfWeek.getDate()} ${startMonthName} al ${endOfWeek.getDate()} ${endMonthName} ${endOfWeek.getFullYear()}`;
            }
        }
    }

    generateCalendar() {
        this.calendarDays = [];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const today = new Date();
        const prevSelected = this.selectedDay?.date;

        if (this.viewMode === 'month') {
            const firstDayOfMonth = new Date(year, month, 1);
            const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

            // Add days from previous month
            for (let i = startDayOfWeek - 1; i >= 0; i--) {
                const d = new Date(year, month, 0 - i);
                this.addDayToCalendar(d, false, this.isSameDay(d, today));
            }

            // Add days of current month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(year, month, i);
                this.addDayToCalendar(d, true, this.isSameDay(d, today));
            }

            // Add days from next month to complete the last row
            const totalDaysAdded = this.calendarDays.length;
            const daysToFill = Math.ceil(totalDaysAdded / 7) * 7 - totalDaysAdded;
            for (let i = 1; i <= daysToFill; i++) {
                const d = new Date(year, month + 1, i);
                this.addDayToCalendar(d, false, this.isSameDay(d, today));
            }
        } else {
            // Week View: Sunday to Saturday
            const currentDayOfWeek = this.currentDate.getDay();
            const startOfWeek = new Date(this.currentDate);
            startOfWeek.setDate(this.currentDate.getDate() - currentDayOfWeek);

            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                this.addDayToCalendar(d, d.getMonth() === month, this.isSameDay(d, today));
            }
        }

        // Re-sync selectedDay pointer after array rebuild
        if (prevSelected) {
            this.selectedDay = this.calendarDays.find(d => this.isSameDay(d.date, prevSelected)) ?? null;
        }
    }

    addDayToCalendar(date: Date, isCurrentMonth: boolean, isToday: boolean) {
        // Find services for this exact day
        const dayServices = this.allServices.filter(s => this.isSameDay(new Date(s.startDate), date));

        // Sort services by time
        dayServices.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        this.calendarDays.push({
            date,
            isCurrentMonth,
            isToday,
            services: dayServices
        });
    }

    isSameDay(d1: Date, d2: Date): boolean {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    previousPeriod() {
        if (this.viewMode === 'month') {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
        } else {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() - 7);
        }
        this.generateCalendar();
    }

    nextPeriod() {
        if (this.viewMode === 'month') {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
        } else {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 7);
        }
        this.generateCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.generateCalendar();
    }

    onAddClick(event: Event, date: Date) {
        event.stopPropagation();
        this.addServiceDate.emit(date);
    }

    onServiceClick(event: Event, service: Service) {
        event.stopPropagation();
        this.editService.emit(service);
    }

    getServicePillClass(status: string): string {
        switch (status) {
            case 'CREATED': return 'pill-gray';
            case 'PENDING': return 'pill-yellow';
            case 'PENDING_DETAILS': return 'pill-blue';
            case 'PENDING_INVOICE': return 'pill-purple';
            case 'PAYMENT_PENDING': return 'pill-red';
            case 'PAID': return 'pill-green';
            case 'CANCELLED': return 'bg-red-200 text-red-900 line-through';
            default: return 'pill-gray';
        }
    }

    getServiceTooltip(service: Service): string {
        const drivers = service.driverNames || 'Sin Asignar';
        const dest = service.destination || 'Múltiples destinos';
        const statusEs = this.translateStatus(service.status);
        return `[${statusEs}] ${service.origin} -> ${dest} | Chofer: ${drivers}`;
    }

    translateStatus(status: string): string {
        const map: any = {
            'CREATED': 'Creado',
            'PENDING': 'Pendiente',
            'PENDING_DETAILS': 'Pendiente Detalles',
            'PENDING_INVOICE': 'Pendiente Facturar',
            'PAYMENT_PENDING': 'Pendiente de Pago',
            'PAID': 'Pagado',
            'CANCELLED': 'Cancelado'
        };
        return map[status] || status;
    }

    get weekGridColumns(): string {
        return `repeat(7, calc(100% / ${this.weekZoomDays}))`;
    }

    private _pinchDist(e: TouchEvent): number {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    onWeekPinchStart(e: TouchEvent) {
        if (e.touches.length === 2) {
            this._pinchStartDist = this._pinchDist(e);
            this._pinchStartDays = this.weekZoomDays;
        }
    }

    onWeekPinchMove(e: TouchEvent) {
        if (e.touches.length !== 2) return;
        e.preventDefault();
        const dist = this._pinchDist(e);
        const ratio = dist / this._pinchStartDist;
        const steps = [3, 5, 7];
        let idx = steps.indexOf(this._pinchStartDays);
        if (idx === -1) idx = steps.length - 1;

        let newDays: number | null = null;
        if (ratio > 1.3 && idx > 0) {
            // Dedos se separan → zoom in → menos días
            newDays = steps[idx - 1];
        } else if (ratio < 0.7 && idx < steps.length - 1) {
            // Dedos se juntan → zoom out → más días
            newDays = steps[idx + 1];
        }

        if (newDays !== null && newDays !== this.weekZoomDays) {
            this.weekZoomDays = newDays;
            this._pinchStartDist = dist;
            this._pinchStartDays = newDays;
            this._showZoomHint();
        }
    }

    private _showZoomHint() {
        this.zoomHintVisible = true;
        if (this._zoomHintTimer) clearTimeout(this._zoomHintTimer);
        this._zoomHintTimer = setTimeout(() => { this.zoomHintVisible = false; }, 1200);
    }
}

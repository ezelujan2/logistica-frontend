import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { SelectButtonModule } from 'primeng/selectbutton';
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
    imports: [CommonModule, ButtonModule, TooltipModule, BadgeModule, SelectButtonModule, FormsModule],
    providers: [DatePipe],
    template: `
        <div class="card p-4">
            <!-- Header Toolbar -->
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div class="flex items-center gap-4">
                    <button pButton icon="pi pi-chevron-left" class="p-button-rounded p-button-text p-button-secondary" (click)="previousPeriod()"></button>
                    <h2 class="text-2xl font-bold m-0 capitalize text-primary text-center" style="min-width: 250px;">
                        {{ getFormattedHeader() }}
                    </h2>
                    <button pButton icon="pi pi-chevron-right" class="p-button-rounded p-button-text p-button-secondary" (click)="nextPeriod()"></button>
                </div>

                <div class="flex gap-2 items-center">
                    <p-selectButton [options]="viewOptions" [(ngModel)]="viewMode" optionLabel="label" optionValue="value" (onChange)="generateCalendar()"></p-selectButton>
                    <button pButton label="Hoy" icon="pi pi-calendar" class="p-button-outlined" (click)="goToToday()"></button>
                </div>
            </div>

            <!-- Calendar Grid -->
            <div class="calendar-container overflow-x-auto w-full pb-2">
                <div class="min-w-[800px]">
                    <!-- Day Headers -->
                    <div class="grid grid-cols-7 gap-2 mb-2">
                        <div *ngFor="let day of weekDays" class="text-center font-semibold text-color-secondary p-2 uppercase text-sm">
                            {{ day }}
                        </div>
                    </div>

                    <!-- Calendar Days Grid -->
                    <div class="grid grid-cols-7 gap-2 auto-rows-fr">
                        <div *ngFor="let day of calendarDays"
                         class="calendar-cell min-h-[140px] p-2 border rounded-lg transition-colors flex flex-col gap-1 overflow-hidden relative group"
                         [ngClass]="{
                            'bg-surface-50 opacity-60': !day.isCurrentMonth,
                            'bg-surface-0 border-surface-200': day.isCurrentMonth && !day.isToday,
                            'border-primary bg-primary-50': day.isToday
                         }">

                        <!-- Date Number & Add Action -->
                        <div class="flex justify-between items-center mb-1">
                            <!-- Add Button (visible on group hover) -->
                            <button pButton icon="pi pi-plus"
                                    class="p-button-rounded p-button-text p-button-sm w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    (click)="onAddClick($event, day.date)"
                                    pTooltip="Nuevo servicio este día"
                                    tooltipPosition="top"></button>

                            <div class="font-medium text-sm"
                                 [ngClass]="{ 'text-primary font-bold': day.isToday, 'text-color-secondary': !day.isCurrentMonth }">
                                {{ day.date.getDate() }}
                            </div>
                        </div>

                        <!-- Services List within the Cell -->
                        <div class="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1 relative z-10">
                            <div *ngFor="let service of day.services"
                                 class="service-pill p-1.5 rounded text-[10px] leading-tight flex flex-col gap-1 transition-transform hover:scale-[1.02] shadow-sm hover:shadow-md cursor-pointer mb-1 border border-black/5"
                                 [ngClass]="getServicePillClass(service.status)"
                                 (click)="onServiceClick($event, service)"
                                 [pTooltip]="getServiceTooltip(service)" tooltipPosition="top">

                                <div class="flex justify-between items-center font-bold text-xs mb-0.5">
                                    <span><i class="pi pi-clock text-[9px] mr-1"></i>{{ service.startDate | date:'HH:mm' }}</span>
                                    <span class="truncate max-w-[80px]" [title]="service.driverNames">{{ service.driverNames || 'Sin Chofer' }}</span>
                                </div>
                                <div class="truncate opacity-90 mb-0.5 font-medium" [title]="service.clientNames">
                                    <i class="pi pi-building text-[9px] mr-1"></i>{{ service.clientNames || 'Sin Cliente' }}
                                </div>
                                <div class="truncate opacity-90" [title]="service.origin + ' -> ' + service.destination">
                                    <i class="pi pi-map-marker text-[9px] mr-1"></i>{{ service.origin }} -> {{ service.destination || 'Varios' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }

        .calendar-cell {
           border: 1px solid var(--surface-border);
        }

        .bg-surface-50 {
            background-color: var(--surface-hover);
        }
        .bg-surface-0 {
            background-color: var(--surface-card);
        }

        /* Pre-defined semantic colors following the system's palette for services */
        .pill-gray { background-color: var(--surface-200); color: var(--text-color); }
        .pill-yellow { background-color: #fef08a; color: #854d0e; }
        .pill-blue { background-color: #bfdbfe; color: #1e3a8a; }
        .pill-purple { background-color: #e9d5ff; color: #581c87; }
        .pill-indigo { background-color: #c7d2fe; color: #312e81; }
        .pill-green { background-color: #bbf7d0; color: #14532d; }
        .pill-red { background-color: #fecaca; color: #7f1d1d; border: 1px solid #f87171; }
    `]
})
export class ServiceCalendar implements OnInit, OnChanges {
    @Input() allServices: Service[] = [];
    @Output() editService = new EventEmitter<Service>();
    @Output() addServiceDate = new EventEmitter<Date>();

    currentDate: Date = new Date();
    weekDays: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    months: string[] = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    calendarDays: CalendarDay[] = [];

    viewMode: 'month' | 'week' = 'month';
    viewOptions = [
        { label: 'Mes', value: 'month' },
        { label: 'Semana', value: 'week' }
    ];

    constructor(private datePipe: DatePipe) {}

    ngOnInit() {
        this.generateCalendar();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['allServices']) {
            this.generateCalendar();
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
}

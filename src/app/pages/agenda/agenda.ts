import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AgendaService, AgendaEntry, AgendaKind, AffectedService, UpcomingService, VEHICLE_REASONS, agendaLabel, agendaIcon } from '../../service/agenda.service';
import { DriverService, Driver } from '../../service/driver.service';
import { VehicleService, Vehicle } from '../../service/vehicle.service';

/** Intervalo de service que se propone si no se sabe otro (se puede cambiar). */
const DEFAULT_SERVICE_INTERVAL_KM = 10000;

type AgendaMode = 'timed' | 'day' | 'days';

/** Duración con la que arranca una carga con horario. */
const DEFAULT_DURATION_MS = 60 * 60 * 1000;

interface AgendaForm {
    id?: number;
    kind: AgendaKind;
    reason: string | null;
    title: string | null;
    /** Con horario (un día, de tal hora a tal hora), todo el día, o varios días enteros. */
    mode: AgendaMode;
    day: Date | null;
    startTime: Date | null;
    endTime: Date | null;
    /** Sólo para "Varios días". */
    startDate: Date | null;
    endDate: Date | null;
    notes: string | null;
    vehicleId: number | null;
    driverId: number | null;
    serviceKm: number | null;
    nextServiceKm: number | null;
}

// Agenda: días en que un auto o un chofer no está disponible (taller, service,
// un trámite…) y eventos sueltos. Se ve en el calendario de servicios y avisa
// al cargar un servicio, pero nunca impide nada.
@Component({
    selector: 'app-agenda',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, DialogModule, InputTextModule, TextareaModule,
        InputNumberModule, DatePickerModule, SelectModule, SelectButtonModule, TagModule, TooltipModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog [style]="{ width: '420px' }"></p-confirmDialog>

        <div class="card">
            <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                    <h1 class="text-xl font-semibold m-0">Agenda</h1>
                    <p class="text-sm text-muted-color mt-1 mb-0">Talleres, services, días en que un chofer no puede y otros eventos. Se ven en el calendario y avisan al cargar un servicio.</p>
                </div>
                <div class="flex gap-2 flex-wrap">
                    <p-button label="Auto no disponible" icon="pi pi-wrench" size="small" (click)="openNew('VEHICLE')" />
                    <p-button label="Chofer no disponible" icon="pi pi-user-minus" size="small" [outlined]="true" (click)="openNew('DRIVER')" />
                    <p-button label="Evento" icon="pi pi-bookmark" size="small" [outlined]="true" (click)="openNew('EVENT')" />
                </div>
            </div>

            <div *ngIf="upcoming.length" class="mb-6">
                <h2 class="text-base font-semibold mb-2">Próximos services</h2>
                <p class="text-xs text-muted-color mt-0 mb-3">Km estimados: los del último service más los km de los viajes cargados desde entonces.</p>
                <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
                    <div *ngFor="let u of upcoming" class="border border-surface rounded-lg p-3">
                        <div class="flex items-center justify-between gap-2">
                            <span class="font-semibold">{{ u.plate }}</span>
                            <p-tag [value]="remainingLabel(u)" [severity]="remainingSeverity(u)"></p-tag>
                        </div>
                        <div class="text-sm mt-2">Próximo a los <b>{{ km(u.nextServiceKm) }} km</b></div>
                        <div class="text-xs text-muted-color mt-1">
                            Hoy ~{{ km(u.estimatedKm) }} km · último service {{ km(u.lastServiceKm) }} km el {{ shortDate(u.lastServiceDate) }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                <p-selectButton [options]="periodOptions" [(ngModel)]="period" optionLabel="label" optionValue="value" [allowEmpty]="false"></p-selectButton>
                <div class="flex gap-2 flex-wrap">
                    <p-select [options]="vehicles" [(ngModel)]="filterVehicleId" optionLabel="plate" optionValue="id" placeholder="Auto" [showClear]="true" appendTo="body" styleClass="w-40"></p-select>
                    <p-select [options]="drivers" [(ngModel)]="filterDriverId" optionLabel="name" optionValue="id" placeholder="Chofer" [showClear]="true" appendTo="body" styleClass="w-40"></p-select>
                </div>
            </div>

            <p-table [value]="filtered" [loading]="loading" [rows]="15" [paginator]="filtered.length > 15" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '44rem' }">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Qué</th>
                        <th>Cuándo</th>
                        <th>Notas</th>
                        <th>Cargó</th>
                        <th class="text-right"></th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-e>
                    <tr>
                        <td>
                            <span class="inline-flex items-center gap-2 font-medium">
                                <i [class]="icon(e.kind)" class="text-muted-color"></i>{{ label(e) }}
                            </span>
                            <div *ngIf="e.serviceKm" class="text-xs text-muted-color mt-1">
                                Service de los {{ km(e.serviceKm) }} km<span *ngIf="e.nextServiceKm"> · próximo a los {{ km(e.nextServiceKm) }} km</span>
                            </div>
                        </td>
                        <td class="whitespace-nowrap">{{ when(e) }}</td>
                        <td class="text-sm">{{ e.notes || '' }}</td>
                        <td class="text-sm text-muted-color">{{ e.createdBy?.name || e.createdBy?.email || '' }}</td>
                        <td class="text-right whitespace-nowrap">
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="edit(e)" pTooltip="Editar" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="confirmDelete(e)" pTooltip="Borrar" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr><td colspan="5" class="text-center text-muted-color py-6">{{ period === 'upcoming' ? 'No hay nada cargado de hoy en adelante.' : 'No hay nada cargado.' }}</td></tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="dialog" [header]="dialogTitle" [modal]="true" [style]="{ width: '480px', 'max-width': '95vw' }" [draggable]="false" [focusOnShow]="false">
            <div class="flex flex-col gap-4 pt-1">
                <p-selectButton [options]="kindOptions" [(ngModel)]="form.kind" optionLabel="label" optionValue="value" [allowEmpty]="false" (onChange)="onKindChange()"></p-selectButton>

                <ng-container *ngIf="form.kind === 'VEHICLE'">
                    <div class="flex gap-3">
                        <div class="flex flex-col gap-2 flex-1">
                            <label>Auto</label>
                            <p-select [options]="vehicles" [(ngModel)]="form.vehicleId" optionLabel="plate" optionValue="id" placeholder="Elegí el auto" [filter]="true" filterBy="plate,model" appendTo="body" styleClass="w-full"></p-select>
                        </div>
                        <div class="flex flex-col gap-2 flex-1">
                            <label>Motivo</label>
                            <p-select [options]="vehicleReasons" [(ngModel)]="form.reason" appendTo="body" styleClass="w-full"></p-select>
                        </div>
                    </div>
                    <div *ngIf="form.reason === 'Service'" class="flex gap-3">
                        <div class="flex flex-col gap-2 flex-1">
                            <label>Service de los (km)</label>
                            <p-inputNumber [(ngModel)]="form.serviceKm" [min]="0" [useGrouping]="true" locale="es-AR" suffix=" km" (onInput)="onServiceKmInput($event.value)" styleClass="w-full" inputStyleClass="w-full"></p-inputNumber>
                        </div>
                        <div class="flex flex-col gap-2 flex-1">
                            <label>Próximo a los (km)</label>
                            <p-inputNumber [(ngModel)]="form.nextServiceKm" [min]="0" [useGrouping]="true" locale="es-AR" suffix=" km" styleClass="w-full" inputStyleClass="w-full"></p-inputNumber>
                        </div>
                    </div>
                    <small *ngIf="form.reason === 'Service'" class="text-muted-color -mt-2">El próximo se propone a {{ km(defaultInterval) }} km; cambialo si el manual del auto dice otra cosa.</small>
                </ng-container>

                <ng-container *ngIf="form.kind === 'DRIVER'">
                    <div class="flex flex-col gap-2">
                        <label>Chofer</label>
                        <p-select [options]="drivers" [(ngModel)]="form.driverId" optionLabel="name" optionValue="id" placeholder="Elegí el chofer" [filter]="true" filterBy="name" appendTo="body" styleClass="w-full"></p-select>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label>Motivo <span class="text-muted-color font-normal">(opcional)</span></label>
                        <input pInputText [(ngModel)]="form.reason" placeholder="Ej. trámite, viaje, médico" class="w-full" />
                    </div>
                </ng-container>

                <div *ngIf="form.kind === 'EVENT'" class="flex flex-col gap-2">
                    <label>Título</label>
                    <input pInputText [(ngModel)]="form.title" placeholder="Ej. reunión con Techint" class="w-full" />
                </div>

                <p-selectButton [options]="modeOptions" [(ngModel)]="form.mode" optionLabel="label" optionValue="value" [allowEmpty]="false" size="small"></p-selectButton>

                <div *ngIf="form.mode !== 'days'" class="flex gap-3">
                    <div class="flex flex-col gap-2 flex-1">
                        <label>Día</label>
                        <p-datepicker [(ngModel)]="form.day" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" inputStyleClass="w-full"></p-datepicker>
                    </div>
                    <ng-container *ngIf="form.mode === 'timed'">
                        <div class="flex flex-col gap-2 w-28">
                            <label>De</label>
                            <p-datepicker [ngModel]="form.startTime" (ngModelChange)="onStartTimeChange($event)" [timeOnly]="true" hourFormat="24" appendTo="body" styleClass="w-full" inputStyleClass="w-full"></p-datepicker>
                        </div>
                        <div class="flex flex-col gap-2 w-28">
                            <label>A</label>
                            <p-datepicker [(ngModel)]="form.endTime" [timeOnly]="true" hourFormat="24" appendTo="body" styleClass="w-full" inputStyleClass="w-full"></p-datepicker>
                        </div>
                    </ng-container>
                </div>

                <div *ngIf="form.mode === 'days'" class="flex gap-3">
                    <div class="flex flex-col gap-2 flex-1">
                        <label>Desde</label>
                        <p-datepicker [(ngModel)]="form.startDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" inputStyleClass="w-full" (onSelect)="onStartSelect()"></p-datepicker>
                    </div>
                    <div class="flex flex-col gap-2 flex-1">
                        <label>Hasta</label>
                        <p-datepicker [(ngModel)]="form.endDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" inputStyleClass="w-full"></p-datepicker>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label>Notas <span class="text-muted-color font-normal">(opcional)</span></label>
                    <textarea pTextarea [(ngModel)]="form.notes" rows="2" class="w-full"></textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" [text]="true" (click)="dialog = false" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="saving" (click)="save()" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="affectedDialog" header="Ojo: hay servicios en esas fechas" [modal]="true" [style]="{ width: '520px', 'max-width': '95vw' }" [draggable]="false">
            <p class="mt-0">Quedó guardado. Estos servicios usan {{ affectedWho }} en los días que cargaste; revisá si hay que cambiar el chofer o el auto.</p>
            <div class="flex flex-col gap-2">
                <div *ngFor="let s of affected" class="border border-surface rounded-lg px-3 py-2">
                    <div class="font-medium">{{ serviceWhen(s.inicio) }} · {{ s.trayecto || 'Sin trayecto' }}</div>
                    <div class="text-sm text-muted-color">
                        Servicio #{{ s.id }}<span *ngIf="s.reporte"> · {{ s.reporte }}</span><span *ngIf="s.cliente"> · {{ s.cliente }}</span>
                    </div>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-button label="Entendido" (click)="affectedDialog = false" />
            </ng-template>
        </p-dialog>
    `
})
export class AgendaPage implements OnInit {
    entries: AgendaEntry[] = [];
    upcoming: UpcomingService[] = [];
    drivers: Driver[] = [];
    vehicles: Vehicle[] = [];
    loading = true;

    period: 'upcoming' | 'all' = 'upcoming';
    periodOptions = [
        { label: 'De hoy en adelante', value: 'upcoming' },
        { label: 'Todo', value: 'all' }
    ];
    filterVehicleId: number | null = null;
    filterDriverId: number | null = null;

    kindOptions = [
        { label: 'Auto', value: 'VEHICLE' },
        { label: 'Chofer', value: 'DRIVER' },
        { label: 'Evento', value: 'EVENT' }
    ];
    modeOptions = [
        { label: 'Con horario', value: 'timed' },
        { label: 'Todo el día', value: 'day' },
        { label: 'Varios días', value: 'days' }
    ];
    vehicleReasons = VEHICLE_REASONS;
    defaultInterval = DEFAULT_SERVICE_INTERVAL_KM;

    dialog = false;
    saving = false;
    form: AgendaForm = this.emptyForm('VEHICLE');

    affectedDialog = false;
    affected: AffectedService[] = [];
    affectedWho = '';

    label = agendaLabel;
    icon = agendaIcon;

    constructor(
        private agendaService: AgendaService,
        private driverService: DriverService,
        private vehicleService: VehicleService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.load();
        this.driverService.getDrivers().then((d) => (this.drivers = d)).catch(() => {});
        this.vehicleService.getVehicles().then((v) => (this.vehicles = v)).catch(() => {});
    }

    async load() {
        this.loading = true;
        try {
            [this.entries, this.upcoming] = await Promise.all([this.agendaService.list(), this.agendaService.upcomingServices()]);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la agenda' });
        } finally {
            this.loading = false;
        }
    }

    get filtered(): AgendaEntry[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.entries.filter((e) => {
            if (this.period === 'upcoming' && new Date(e.endDate) < today) return false;
            if (this.filterVehicleId && e.vehicleId !== this.filterVehicleId) return false;
            if (this.filterDriverId && e.driverId !== this.filterDriverId) return false;
            return true;
        });
    }

    get dialogTitle(): string {
        return this.form.id ? 'Editar' : 'Cargar en la agenda';
    }

    when(e: AgendaEntry): string {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        const day = (d: Date) => d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        const time = (d: Date) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const sameDay = start.toDateString() === end.toDateString();
        if (e.allDay) return sameDay ? day(start) : `${day(start)} al ${day(end)}`;
        return sameDay ? `${day(start)} ${time(start)} a ${time(end)}` : `${day(start)} ${time(start)} al ${day(end)} ${time(end)}`;
    }

    km(value: number | null | undefined): string {
        return (value ?? 0).toLocaleString('es-AR');
    }

    shortDate(value: string): string {
        return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }

    serviceWhen(value: string): string {
        const d = new Date(value);
        return `${d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    remainingLabel(u: UpcomingService): string {
        if (u.remainingKm <= 0) return 'Ya toca';
        return `Faltan ~${u.remainingKm.toLocaleString('es-AR')} km`;
    }

    remainingSeverity(u: UpcomingService): 'danger' | 'warn' | 'success' {
        if (u.remainingKm <= 0) return 'danger';
        return u.remainingKm <= 1500 ? 'warn' : 'success';
    }

    private emptyForm(kind: AgendaKind): AgendaForm {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Arranca en la próxima hora en punto y dura una hora.
        const start = new Date();
        start.setHours(start.getHours() + 1, 0, 0, 0);
        return {
            kind,
            reason: kind === 'VEHICLE' ? 'Taller' : null,
            title: null,
            mode: 'timed',
            day: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
            startTime: start,
            endTime: new Date(start.getTime() + DEFAULT_DURATION_MS),
            startDate: today,
            endDate: new Date(today),
            notes: null,
            vehicleId: null,
            driverId: null,
            serviceKm: null,
            nextServiceKm: null
        };
    }

    openNew(kind: AgendaKind) {
        this.form = this.emptyForm(kind);
        this.dialog = true;
    }

    edit(e: AgendaEntry) {
        this.form = {
            id: e.id,
            kind: e.kind,
            reason: e.reason ?? null,
            title: e.title ?? null,
            ...this.datesFrom(e),
            notes: e.notes ?? null,
            vehicleId: e.vehicleId ?? null,
            driverId: e.driverId ?? null,
            serviceKm: e.serviceKm ?? null,
            nextServiceKm: e.nextServiceKm ?? null
        };
        this.dialog = true;
    }

    /** De lo guardado a los campos del formulario según el tipo de fecha. */
    private datesFrom(e: AgendaEntry): Pick<AgendaForm, 'mode' | 'day' | 'startTime' | 'endTime' | 'startDate' | 'endDate'> {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const sameDay = startDay.getTime() === endDay.getTime();
        const mode: AgendaMode = !e.allDay ? 'timed' : sameDay ? 'day' : 'days';
        return { mode, day: startDay, startTime: start, endTime: end, startDate: startDay, endDate: endDay };
    }

    /** Al mover la hora de inicio, la de fin se corre igual (mantiene la duración). */
    onStartTimeChange(value: Date | null) {
        const prev = this.form.startTime;
        const end = this.form.endTime;
        const duration = prev && end && end.getTime() > prev.getTime() ? end.getTime() - prev.getTime() : DEFAULT_DURATION_MS;
        this.form.startTime = value;
        if (value) this.form.endTime = new Date(value.getTime() + duration);
    }

    onKindChange() {
        this.form.reason = this.form.kind === 'VEHICLE' ? 'Taller' : null;
    }

    onStartSelect() {
        if (this.form.startDate && (!this.form.endDate || this.form.endDate < this.form.startDate)) {
            this.form.endDate = new Date(this.form.startDate);
        }
    }

    onServiceKmInput(value: number | string | null | undefined) {
        const km = Number(value);
        if (Number.isFinite(km) && km > 0) this.form.nextServiceKm = km + DEFAULT_SERVICE_INTERVAL_KM;
    }

    async save() {
        const f = this.form;
        const warn = (detail: string) => this.messageService.add({ severity: 'warn', summary: 'Revisá las fechas', detail });
        let start: Date;
        let end: Date;
        if (f.mode === 'timed') {
            if (!f.day || !f.startTime || !f.endTime) return warn('Completá el día y las horas.');
            start = new Date(f.day);
            start.setHours(f.startTime.getHours(), f.startTime.getMinutes(), 0, 0);
            end = new Date(f.day);
            end.setHours(f.endTime.getHours(), f.endTime.getMinutes(), 0, 0);
            if (end <= start) return warn('La hora de fin tiene que ser después de la de inicio.');
        } else {
            // "Todo el día" y "Varios días" van de las 0 del primer día al final del último.
            const from = f.mode === 'day' ? f.day : f.startDate;
            const to = f.mode === 'day' ? f.day : f.endDate;
            if (!from || !to) return warn(f.mode === 'day' ? 'Elegí el día.' : 'Completá desde y hasta.');
            start = new Date(from);
            start.setHours(0, 0, 0, 0);
            end = new Date(to);
            end.setHours(23, 59, 59, 0);
            if (end < start) return warn('La fecha "Hasta" es anterior a "Desde".');
        }
        const isService = f.kind === 'VEHICLE' && f.reason === 'Service';
        const payload: AgendaEntry = {
            kind: f.kind,
            reason: f.reason,
            title: f.title,
            startDate: start,
            endDate: end,
            allDay: f.mode !== 'timed',
            notes: f.notes,
            vehicleId: f.vehicleId,
            driverId: f.driverId,
            serviceKm: isService ? f.serviceKm : null,
            nextServiceKm: isService ? f.nextServiceKm : null
        };

        this.saving = true;
        try {
            const result = f.id ? await this.agendaService.update(f.id, payload) : await this.agendaService.create(payload);
            this.dialog = false;
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: agendaLabel(result.entry), life: 2500 });
            if (result.affectedServices.length) {
                this.affected = result.affectedServices;
                this.affectedWho = f.kind === 'VEHICLE' ? 'ese auto' : 'ese chofer';
                this.affectedDialog = true;
            }
            await this.load();
        } catch (err: any) {
            this.messageService.add({ severity: 'error', summary: 'No se pudo guardar', detail: err?.error?.error || 'Probá de nuevo.' });
        } finally {
            this.saving = false;
        }
    }

    confirmDelete(e: AgendaEntry) {
        this.confirmationService.confirm({
            header: 'Borrar',
            message: `¿Borrar "${agendaLabel(e)}" (${this.when(e)})?`,
            acceptLabel: 'Borrar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: async () => {
                try {
                    await this.agendaService.remove(e.id!);
                    await this.load();
                } catch {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo borrar' });
                }
            }
        });
    }
}

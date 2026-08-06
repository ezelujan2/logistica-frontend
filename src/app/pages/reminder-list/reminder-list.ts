import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ReminderService, DocumentReminder, DocumentReminderHistoryEntry } from '../../service/reminder.service';
import { DriverService, Driver } from '../../service/driver.service';
import { VehicleService, Vehicle } from '../../service/vehicle.service';

@Component({
    selector: 'app-reminder-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        InputNumberModule,
        DatePickerModule,
        SelectModule,
        TagModule,
        TooltipModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService, DatePipe],
    template: `
        <div class="card px-6 py-6">
            <p-toast></p-toast>
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <button pButton pRipple label="Nuevo Vencimiento" icon="pi pi-plus" class="p-button-success mr-2" (click)="openNew()"></button>
                    <button pButton pRipple label="Historial" icon="pi pi-history" class="p-button-text" (click)="openHistory()"></button>
                </ng-template>
            </p-toolbar>

            <div class="flex flex-wrap gap-3 mb-4">
                <p-select [options]="typeFilterOptions" [(ngModel)]="filterType" placeholder="Tipo" [showClear]="true" appendTo="body" styleClass="w-52"></p-select>
                <p-select [options]="vehicles" [(ngModel)]="filterVehicleId" optionLabel="plate" optionValue="id" placeholder="Vehículo" [showClear]="true" appendTo="body" styleClass="w-52"></p-select>
                <p-select [options]="drivers" [(ngModel)]="filterDriverId" optionLabel="name" optionValue="id" placeholder="Chofer" [showClear]="true" appendTo="body" styleClass="w-52"></p-select>
                <p-select [options]="statusFilterOptions" [(ngModel)]="filterStatus" placeholder="Estado" [showClear]="true" appendTo="body" styleClass="w-52"></p-select>
            </div>

            <p-table [value]="filteredReminders" [rows]="10" [paginator]="true" [loading]="loading" responsiveLayout="scroll" styleClass="p-datatable-sm" [tableStyle]="{'min-width': '50rem'}">
                <ng-template pTemplate="caption">
                    <h5 class="m-0">Vencimientos (seguros, VTV, carnets, etc.)</h5>
                </ng-template>
                <ng-template pTemplate="header">
                    <tr>
                        <th>Tipo</th>
                        <th>Vencimiento</th>
                        <th>Asociado a</th>
                        <th class="text-center">Estado</th>
                        <th class="text-center">Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-reminder>
                    <tr>
                        <td>{{ reminder.type }}</td>
                        <td>{{ reminder.expirationDate | date: 'dd/MM/yyyy' }}</td>
                        <td>{{ reminder.vehicle?.plate || reminder.driver?.name || '-' }}</td>
                        <td class="text-center">
                            <p-tag [value]="statusLabel(reminder)" [severity]="statusSeverity(reminder)"></p-tag>
                        </td>
                        <td class="text-center">
                            <button pButton pRipple icon="pi pi-history" class="p-button-rounded p-button-text mr-2" pTooltip="Ver historial de este vencimiento" (click)="openHistory(reminder)"></button>
                            <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" (click)="editReminder(reminder)"></button>
                            <button pButton pRipple icon="pi pi-trash" class="p-button-rounded p-button-warning" (click)="deleteReminder(reminder)"></button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr><td colspan="5" class="text-center">No hay vencimientos que coincidan con el filtro.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="reminderDialog" [style]="{width: '450px'}" header="Vencimiento" [modal]="true" class="p-fluid" [focusOnShow]="false">
            <ng-template pTemplate="content">
                <div class="field">
                    <label for="type">Tipo</label>
                    <input id="type" type="text" pInputText [(ngModel)]="reminder.type" placeholder="Ej: Seguro, VTV, Carnet de conducir" class="w-full" />
                    <small class="p-error" *ngIf="submitted && !reminder.type">El tipo es obligatorio.</small>
                </div>

                <div class="field">
                    <label for="expirationDate">Fecha de vencimiento</label>
                    <p-datepicker id="expirationDate" [(ngModel)]="reminder.expirationDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" [style]="{'width':'100%'}"></p-datepicker>
                    <small class="p-error" *ngIf="submitted && !reminder.expirationDate">La fecha es obligatoria.</small>
                </div>

                <div class="field">
                    <label for="alertDaysBefore">Avisar con cuántos días de anticipación</label>
                    <p-inputNumber id="alertDaysBefore" [(ngModel)]="reminder.alertDaysBefore" [min]="1" [max]="365" styleClass="w-full" [style]="{'width':'100%'}"></p-inputNumber>
                </div>

                <div class="field">
                    <label for="vehicle">Vehículo (opcional)</label>
                    <p-select [options]="vehicles" [(ngModel)]="reminder.vehicleId" optionLabel="plate" optionValue="id" [showClear]="true" placeholder="Seleccionar vehículo" appendTo="body" styleClass="w-full" [style]="{'width':'100%'}"></p-select>
                </div>

                <div class="field">
                    <label for="driver">Chofer (opcional)</label>
                    <p-select [options]="drivers" [(ngModel)]="reminder.driverId" optionLabel="name" optionValue="id" [showClear]="true" placeholder="Seleccionar chofer" appendTo="body" styleClass="w-full" [style]="{'width':'100%'}"></p-select>
                </div>

                <div class="field">
                    <label for="notes">Notas (opcional)</label>
                    <textarea id="notes" pTextarea [(ngModel)]="reminder.notes" rows="3" class="w-full"></textarea>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <button pButton pRipple label="Cancelar" icon="pi pi-times" class="p-button-text" (click)="hideDialog()"></button>
                <button pButton pRipple label="Guardar" icon="pi pi-check" class="p-button-text" (click)="saveReminder()"></button>
            </ng-template>
        </p-dialog>

        <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>

        <p-dialog [(visible)]="historyDialog" [style]="{width: '750px'}" [header]="historyTitle" [modal]="true" [focusOnShow]="false">
            <ng-template pTemplate="content">
                <div class="flex flex-wrap gap-3 mb-4" *ngIf="!historyScoped">
                    <p-select [options]="typeFilterOptions" [(ngModel)]="historyFilterType" (onChange)="loadHistory()" placeholder="Tipo" [showClear]="true" appendTo="body" styleClass="w-52"></p-select>
                    <p-select [options]="vehicles" [(ngModel)]="historyFilterVehicleId" (onChange)="loadHistory()" optionLabel="plate" optionValue="id" placeholder="Vehículo" [showClear]="true" appendTo="body" styleClass="w-52"></p-select>
                    <p-select [options]="drivers" [(ngModel)]="historyFilterDriverId" (onChange)="loadHistory()" optionLabel="name" optionValue="id" placeholder="Chofer" [showClear]="true" appendTo="body" styleClass="w-52"></p-select>
                </div>
                <button *ngIf="historyScoped" pButton pRipple label="Ver historial completo" icon="pi pi-list" class="p-button-text mb-3" (click)="clearHistoryScope()"></button>

                <p-table [value]="history" [rows]="15" [paginator]="true" [loading]="loadingHistory" styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Asociado a</th>
                            <th>Anterior</th>
                            <th>Nuevo</th>
                            <th>Usuario</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-entry>
                        <tr>
                            <td>{{ entry.createdAt | date: 'dd/MM/yy HH:mm' }}</td>
                            <td>{{ entry.type }}</td>
                            <td>{{ entry.vehicle?.plate || entry.driver?.name || '-' }}</td>
                            <td>{{ entry.previousExpiration ? (entry.previousExpiration | date: 'dd/MM/yyyy') : '—' }}</td>
                            <td>{{ entry.newExpiration ? (entry.newExpiration | date: 'dd/MM/yyyy') : 'Eliminado' }}</td>
                            <td>{{ entry.user?.name || entry.user?.email || '-' }}</td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr><td colspan="6" class="text-center">Todavía no hay cambios registrados.</td></tr>
                    </ng-template>
                </p-table>
            </ng-template>
            <ng-template pTemplate="footer">
                <button pButton pRipple label="Cerrar" icon="pi pi-times" class="p-button-text" (click)="historyDialog = false"></button>
            </ng-template>
        </p-dialog>
    `
})
export class ReminderList implements OnInit {
    reminders: DocumentReminder[] = [];
    reminder: Partial<DocumentReminder> = {};
    drivers: Driver[] = [];
    vehicles: Vehicle[] = [];

    reminderDialog = false;
    submitted = false;
    loading = true;

    filterType: string | null = null;
    filterVehicleId: number | null = null;
    filterDriverId: number | null = null;
    filterStatus: string | null = null;
    statusFilterOptions = [
        { label: 'Al día', value: 'OK' },
        { label: 'Vence pronto', value: 'WARN' },
        { label: 'Vencido', value: 'DANGER' }
    ];

    historyDialog = false;
    history: DocumentReminderHistoryEntry[] = [];
    loadingHistory = false;
    historyFilterType: string | null = null;
    historyFilterVehicleId: number | null = null;
    historyFilterDriverId: number | null = null;
    historyScoped = false;
    historyTitle = 'Historial de vencimientos';

    constructor(
        private reminderService: ReminderService,
        private driverService: DriverService,
        private vehicleService: VehicleService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadData();
        this.loadAuxData();
    }

    async loadData() {
        this.loading = true;
        try {
            this.reminders = await this.reminderService.getReminders();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los vencimientos' });
        } finally {
            this.loading = false;
        }
    }

    async loadAuxData() {
        try {
            this.drivers = await this.driverService.getDrivers();
            this.vehicles = await this.vehicleService.getVehicles();
        } catch {
            // no bloquea la carga principal
        }
    }

    get typeFilterOptions(): { label: string; value: string }[] {
        const types = new Set(this.reminders.map((r) => r.type));
        return [...types].sort().map((t) => ({ label: t, value: t }));
    }

    get filteredReminders(): DocumentReminder[] {
        return this.reminders.filter((r) => {
            if (this.filterType && r.type !== this.filterType) return false;
            if (this.filterVehicleId && r.vehicleId !== this.filterVehicleId) return false;
            if (this.filterDriverId && r.driverId !== this.filterDriverId) return false;
            if (this.filterStatus && this.statusSeverityKey(r) !== this.filterStatus) return false;
            return true;
        });
    }

    daysLeft(reminder: DocumentReminder): number {
        const expiration = new Date(reminder.expirationDate).getTime();
        return Math.ceil((expiration - Date.now()) / 86_400_000);
    }

    private statusSeverityKey(reminder: DocumentReminder): 'OK' | 'WARN' | 'DANGER' {
        const days = this.daysLeft(reminder);
        if (days < 0) return 'DANGER';
        if (days <= reminder.alertDaysBefore) return 'WARN';
        return 'OK';
    }

    statusLabel(reminder: DocumentReminder): string {
        const days = this.daysLeft(reminder);
        if (days < 0) return `Vencido hace ${Math.abs(days)}d`;
        if (days <= reminder.alertDaysBefore) return `Vence en ${days}d`;
        return 'OK';
    }

    statusSeverity(reminder: DocumentReminder): 'success' | 'warn' | 'danger' {
        const key = this.statusSeverityKey(reminder);
        if (key === 'DANGER') return 'danger';
        if (key === 'WARN') return 'warn';
        return 'success';
    }

    async openHistory(reminder?: DocumentReminder) {
        this.historyDialog = true;

        if (reminder) {
            this.historyScoped = true;
            this.historyFilterType = reminder.type;
            this.historyFilterVehicleId = reminder.vehicleId ?? null;
            this.historyFilterDriverId = reminder.driverId ?? null;
            this.historyTitle = `Historial — ${reminder.type} (${reminder.vehicle?.plate || reminder.driver?.name || 'sin asociar'})`;
        } else {
            this.historyScoped = false;
            this.historyFilterType = null;
            this.historyFilterVehicleId = null;
            this.historyFilterDriverId = null;
            this.historyTitle = 'Historial de vencimientos';
        }

        await this.loadHistory();
    }

    clearHistoryScope() {
        this.historyScoped = false;
        this.historyFilterType = null;
        this.historyFilterVehicleId = null;
        this.historyFilterDriverId = null;
        this.historyTitle = 'Historial de vencimientos';
        this.loadHistory();
    }

    async loadHistory() {
        this.loadingHistory = true;
        try {
            this.history = await this.reminderService.getHistory({
                type: this.historyFilterType ?? undefined,
                vehicleId: this.historyFilterVehicleId ?? undefined,
                driverId: this.historyFilterDriverId ?? undefined
            });
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial' });
        } finally {
            this.loadingHistory = false;
        }
    }

    openNew() {
        this.reminder = { alertDaysBefore: 30 };
        this.submitted = false;
        this.reminderDialog = true;
    }

    editReminder(reminder: DocumentReminder) {
        this.reminder = { ...reminder, expirationDate: new Date(reminder.expirationDate) };
        this.submitted = false;
        this.reminderDialog = true;
    }

    deleteReminder(reminder: DocumentReminder) {
        this.confirmationService.confirm({
            message: '¿Eliminar este vencimiento?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await this.reminderService.deleteReminder(reminder.id!);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Vencimiento eliminado' });
                    this.loadData();
                } catch {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
                }
            }
        });
    }

    hideDialog() {
        this.reminderDialog = false;
        this.submitted = false;
    }

    async saveReminder() {
        this.submitted = true;
        if (!this.reminder.type || !this.reminder.expirationDate) return;

        const body: DocumentReminder = {
            type: this.reminder.type,
            expirationDate: this.reminder.expirationDate,
            alertDaysBefore: this.reminder.alertDaysBefore ?? 30,
            notes: this.reminder.notes ?? null,
            vehicleId: this.reminder.vehicleId ?? null,
            driverId: this.reminder.driverId ?? null
        };

        try {
            if (this.reminder.id) {
                await this.reminderService.updateReminder(this.reminder.id, body);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Vencimiento actualizado' });
            } else {
                await this.reminderService.createReminder(body);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Vencimiento creado' });
            }
            this.hideDialog();
            this.loadData();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
        }
    }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ExpenseService } from '../../service/expense.service';
import { DriverService } from '../../service/driver.service';
import { VehicleService } from '../../service/vehicle.service';

@Component({
    selector: 'app-expense-list',
    templateUrl: './expense-list.html',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        InputNumberModule,
        SelectModule,
        DatePickerModule,
        TagModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService, DatePipe]
})
export class ExpenseList implements OnInit {

    expenses: any[] = [];
    expense: any = {};
    selectedExpenses: any[] = [];

    drivers: any[] = [];
    vehicles: any[] = [];

    expenseDialog: boolean = false;
    submitted: boolean = false;
    loading: boolean = true;

    expenseTypes = [
        { label: 'Combustible', value: 'FUEL' },
        { label: 'Peaje', value: 'TOLL' },
        { label: 'Lavado', value: 'WASH' },
        { label: 'Viático', value: 'SNACK' },
        { label: 'Taller / Mantenimiento', value: 'MAINTENANCE' },
        { label: 'Otro', value: 'OTHER' }
    ];


    // Filters
    year: number = new Date().getFullYear();
    month: number = new Date().getMonth() + 1;

    years: any[] = [];
    months = [
        { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
        { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
        { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
        { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 }
    ];

    constructor(
        private expenseService: ExpenseService,
        private driverService: DriverService,
        private vehicleService: VehicleService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {
        // Generate last 5 years
        const currentYear = new Date().getFullYear();
        for(let i = 0; i < 5; i++) {
            this.years.push({ label: (currentYear - i).toString(), value: currentYear - i });
        }
    }

    ngOnInit() {
        this.loadData();
        this.loadAuxData();
    }

    loadData() {
        this.loading = true;
        this.expenseService.getExpenses({ year: this.year, month: this.month }).subscribe({
            next: (data) => {
                this.expenses = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    async loadAuxData() {
        try {
            this.drivers = await this.driverService.getDrivers();
            this.vehicles = await this.vehicleService.getVehicles();
        } catch (error) {
            console.error('Error loading aux data', error);
        }
    }

    openNew() {
        this.expense = {
            date: new Date(),
            type: 'OTHER'
        };
        this.submitted = false;
        this.expenseDialog = true;
    }

    editExpense(expense: any) {
        this.expense = { ...expense };
        if (this.expense.date) this.expense.date = new Date(this.expense.date);
        this.expenseDialog = true;
    }

    deleteExpense(expense: any) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que deseas eliminar este gasto?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.expenseService.deleteExpense(expense.id).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto eliminado' });
                    this.loadData();
                });
            }
        });
    }

    hideDialog() {
        this.expenseDialog = false;
        this.submitted = false;
    }

    saveExpense() {
        this.submitted = true;

        if (this.expense.amount && this.expense.type) {
            const body = {
                ...this.expense,
                driverId: this.expense.driver?.id || (this.expense.driverId ? this.expense.driverId : null),
                vehicleId: this.expense.vehicle?.id || (this.expense.vehicleId ? this.expense.vehicleId : null)
            };

            // Fix PrimeNG dropdown object vs value issue if happens
            if (typeof body.driverId === 'object') body.driverId = body.driverId.id;
            if (typeof body.vehicleId === 'object') body.vehicleId = body.vehicleId.id;


            if (this.expense.id) {
                this.expenseService.updateExpense(this.expense.id, body).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto actualizado' });
                        this.hideDialog();
                        this.loadData();
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' })
                });
            } else {
                this.expenseService.createExpense(body).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto creado' });
                        this.hideDialog();
                        this.loadData();
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' })
                });
            }
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Advance, AdvanceService } from '../../service/advance.service';
import { Driver, DriverService } from '../../service/driver.service';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-advance-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="font-semibold text-xl mb-4">Adelantos a Choferes</div>

            <p-table #dt [value]="advances" [rows]="10" [paginator]="true" [loading]="loading" responsiveLayout="stack" breakpoint="960px">
                <ng-template pTemplate="caption">
                    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p-button label="Nuevo Adelanto" icon="pi pi-plus" (click)="openNew()" />
                        <p-select [options]="drivers" [(ngModel)]="selectedDriverFilter" optionLabel="name" optionValue="id" placeholder="Filtrar por Chofer" [showClear]="true" (onChange)="loadAdvances()" styleClass="w-full md:w-64" appendTo="body"></p-select>
                    </div>
                </ng-template>
                <ng-template pTemplate="header">
                    <tr>
                        <th pSortableColumn="date">Fecha <p-sortIcon field="date" /></th>
                        <th pSortableColumn="driver.name">Chofer <p-sortIcon field="driver.name" /></th>
                        <th>Descripción</th>
                        <th pSortableColumn="amount">Monto <p-sortIcon field="amount" /></th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-advance>
                    <tr>
                        <td>{{ advance.date | date:'dd/MM/yyyy' }}</td>
                        <td>{{ advance.driver?.name }}</td>
                        <td>{{ advance.description }}</td>
                        <td class="font-bold text-green-600">{{ advance.amount | currency:'USD' }}</td>
                        <td>
                            <p-tag [value]="advance.isDeducted ? 'Deducido' : 'Pendiente'" [severity]="advance.isDeducted ? 'success' : 'warn'"></p-tag>
                        </td>
                        <td>
                             <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" (click)="editAdvance(advance)" [disabled]="advance.isDeducted" class="mr-2"></p-button>
                             <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteAdvance(advance)" [disabled]="advance.isDeducted"></p-button>
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="advanceDialog" [style]="{width: '450px'}" [header]="advance.id ? 'Editar Adelanto' : 'Nuevo Adelanto'" [modal]="true" styleClass="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                             <label>Chofer</label>
                             <p-select [options]="drivers" [(ngModel)]="advance.driverId" optionLabel="name" optionValue="id" placeholder="Seleccionar Chofer" appendTo="body"></p-select>
                        </div>
                        <div class="flex flex-col gap-2">
                             <label>Fecha</label>
                             <p-datepicker [(ngModel)]="advance.date" dateFormat="dd/mm/yy" appendTo="body"></p-datepicker>
                        </div>
                        <div class="flex flex-col gap-2">
                             <label>Monto</label>
                             <p-inputNumber [(ngModel)]="advance.amount" mode="currency" currency="USD" locale="en-US"></p-inputNumber>
                        </div>
                        <div class="flex flex-col gap-2">
                             <label>Nota</label>
                             <input type="text" pInputText [(ngModel)]="advance.description" />
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveAdvance()" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, DialogModule, FormsModule, SelectModule, InputNumberModule, DatePickerModule, ToastModule, TagModule],
    providers: [MessageService, AdvanceService, DriverService]
})
export class AdvanceList implements OnInit {
    advances: Advance[] = [];
    drivers: Driver[] = [];
    loading: boolean = true;

    advanceDialog: boolean = false;
    advance: any = {};

    selectedDriverFilter: number | null = null;

    constructor(
        private advanceService: AdvanceService,
        private driverService: DriverService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadDrivers();
        this.loadAdvances();
    }

    loadDrivers() {
        this.driverService.getDrivers().then(data => this.drivers = data);
    }

    loadAdvances() {
        this.loading = true;
        this.advanceService.getAdvances(this.selectedDriverFilter || undefined).subscribe({
            next: (data) => {
                this.advances = data;
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    openNew() {
        this.advance = {
            date: new Date(),
            amount: 0
        };
        this.advanceDialog = true;
    }

    hideDialog() {
        this.advanceDialog = false;
    }

    editAdvance(advance: any) {
        this.advance = { ...advance };
        this.advance.date = new Date(this.advance.date); // Ensure date object
        this.advanceDialog = true;
    }

    saveAdvance() {
        if (this.advance.driverId && this.advance.amount) {
            if (this.advance.id) {
                this.advanceService.updateAdvance(this.advance.id, this.advance).subscribe({
                    next: () => {
                        this.messageService.add({severity:'success', summary:'Éxito', detail:'Adelanto actualizado'});
                        this.advanceDialog = false;
                        this.loadAdvances();
                    },
                    error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo actualizar'})
                });
            } else {
                this.advanceService.createAdvance(this.advance).subscribe({
                    next: () => {
                        this.messageService.add({severity:'success', summary:'Éxito', detail:'Adelanto registrado'});
                        this.advanceDialog = false;
                        this.loadAdvances();
                    },
                    error: () => this.messageService.add({severity:'error', summary:'Error', detail:'No se pudo guardar'})
                });
            }
        }
    }

    deleteAdvance(advance: any) {
        if (confirm('Eliminar adelanto?')) {
            this.advanceService.deleteAdvance(advance.id).subscribe(() => {
                this.messageService.add({severity:'success', summary:'Eliminado', detail:'Adelanto eliminado'});
                this.loadAdvances();
            });
        }
    }
}

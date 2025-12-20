import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { Client, ClientService } from '../../service/client.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-client-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="font-semibold text-xl mb-4">Clientes</div>
            <p-table #dt1 [value]="clients" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true" [globalFilterFields]="['name', 'cuit', 'email']">
                <ng-template pTemplate="caption">
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold">Listado de Clientes</span>
                        <div class="flex gap-2">
                            <p-button label="Nuevo" icon="pi pi-plus" (click)="openNew()" />
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="dt1.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." />
                            </p-iconfield>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="header">
                    <tr>
                        <th pSortableColumn="name">Nombre <p-sortIcon field="name" /></th>
                        <th>CUIT</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-client>
                    <tr>
                        <td>{{ client.name }}</td>
                        <td>{{ client.cuit }}</td>
                        <td>{{ client.phone }}</td>
                        <td>{{ client.email }}</td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="editClient(client)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteClient(client)" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="clientDialog" [style]="{ width: '450px' }" header="Detalles del Cliente" [modal]="true" styleClass="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="name">Nombre</label>
                            <input type="text" pInputText id="name" [(ngModel)]="client.name" required autofocus />
                            <small class="p-error" *ngIf="submitted && !client.name">El nombre es obligatorio.</small>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="cuit">CUIT</label>
                                <input type="text" pInputText id="cuit" [(ngModel)]="client.cuit" />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="phone">Teléfono</label>
                                <input type="text" pInputText id="phone" [(ngModel)]="client.phone" />
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="email">Email</label>
                                <input type="text" pInputText id="email" [(ngModel)]="client.email" />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="address">Dirección</label>
                                <input type="text" pInputText id="address" [(ngModel)]="client.address" />
                            </div>
                        </div>

                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-6 flex items-center gap-2">
                                <p-checkbox [(ngModel)]="client.send_details" [binary]="true" inputId="send_details"></p-checkbox>
                                <label for="send_details">Enviar detalles</label>
                            </div>
                            <div class="col-span-6 flex items-center gap-2">
                                <p-checkbox [(ngModel)]="client.send_invoices" [binary]="true" inputId="send_invoices"></p-checkbox>
                                <label for="send_invoices">Enviar facturas</label>
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                             <label for="notes">Notas</label>
                             <textarea id="notes" pTextarea [(ngModel)]="client.notes" rows="3" cols="20"></textarea>
                        </div>
                    </div>
                </ng-template>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveClient()" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, FormsModule, TextareaModule, CheckboxModule, ToastModule],
    providers: [MessageService]
})
export class ClientList implements OnInit {
    clients: Client[] = [];
    client: Client = { name: '' };
    loading: boolean = true;
    clientDialog: boolean = false;
    submitted: boolean = false;

    constructor(private clientService: ClientService, private messageService: MessageService) {}

    ngOnInit() {
        this.loadClients();
    }

    async loadClients() {
        this.loading = true;
        try {
            this.clients = await this.clientService.getClients();
        } catch (error) {
            console.error(error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los clientes' });
        } finally {
            this.loading = false;
        }
    }

    openNew() {
        this.client = { name: '' };
        this.submitted = false;
        this.clientDialog = true;
    }

    editClient(client: Client) {
        this.client = { ...client };
        this.clientDialog = true;
    }

    async deleteClient(client: Client) {
        if (!client.id) return;
        if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
             try {
                await this.clientService.deleteClient(client.id);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente eliminado', life: 3000 });
                this.loadClients();
            } catch (error) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el cliente' });
            }
        }
    }

    hideDialog() {
        this.clientDialog = false;
        this.submitted = false;
    }

    async saveClient() {
        this.submitted = true;

        if (this.client.name?.trim()) {
            try {
                if (this.client.id) {
                    await this.clientService.updateClient(this.client.id, this.client);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente actualizado', life: 3000 });
                } else {
                    await this.clientService.createClient(this.client);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente creado', life: 3000 });
                }
                this.clientDialog = false;
                this.client = { name: '' };
                this.loadClients();
            } catch (error) {
                 this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el cliente' });
            }
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { Client, ClientService } from '../../service/client.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ClientForm } from './client-form';

@Component({
    selector: 'app-client-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="font-semibold text-xl mb-4">Clientes</div>
            <p-table #dt1 [value]="clients" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading" [paginator]="true" [globalFilterFields]="['name', 'legal_name', 'cuit', 'email']" styleClass="mobile-cards">
                <ng-template pTemplate="caption">
                    <div class="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                        <span class="hidden sm:inline text-xl font-bold">Listado de Clientes</span>
                        <div class="flex gap-2">
                            <p-button label="Nuevo" icon="pi pi-plus" (click)="openNew()" />
                            <p-iconfield class="flex-1 sm:flex-none">
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="dt1.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." class="w-full" />
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
                    <tr class="m-card">
                        <td class="m-title">
                            <a class="font-medium text-primary cursor-pointer hover:underline" [routerLink]="['/app/clients', client.id]">{{ client.name }}</a>
                            <div *ngIf="client.legal_name && client.legal_name !== client.name" class="text-xs text-muted-color">{{ client.legal_name }}</div>
                        </td>
                        <td [attr.data-label]="client.cuit ? 'CUIT' : null">{{ client.cuit }}</td>
                        <td>{{ client.phone }}</td>
                        <td class="break-all">{{ client.email }}</td>
                        <td class="m-actions whitespace-nowrap">
                            <p-button icon="pi pi-id-card" [rounded]="true" [text]="true" pTooltip="Abrir la ficha" [routerLink]="['/app/clients', client.id]" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Eliminar" (click)="deleteClient(client)" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="clientDialog" [style]="{ width: '760px' }" [breakpoints]="{ '800px': '95vw' }" header="Nuevo cliente" [modal]="true" [draggable]="false">
                <ng-template pTemplate="content">
                    <app-client-form [client]="client" [submitted]="submitted" />
                </ng-template>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" [text]="true" severity="secondary" (click)="hideDialog()" />
                    <p-button label="Crear cliente" icon="pi pi-check" [loading]="saving" (click)="saveClient()" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, ToastModule, TooltipModule, ClientForm],
    providers: [MessageService]
})
export class ClientList implements OnInit {
    clients: Client[] = [];
    client: Client = { name: '' };
    loading: boolean = true;
    clientDialog: boolean = false;
    submitted: boolean = false;
    saving = false;

    constructor(private clientService: ClientService, private messageService: MessageService, private route: ActivatedRoute, private router: Router) {}

    async ngOnInit() {
        // Links viejos (?action=edit&id=…) van a la ficha.
        const params = this.route.snapshot.queryParams;
        if (params['action'] === 'edit' && params['id']) {
            this.router.navigate(['/app/clients', Number(params['id'])], { queryParams: { tab: 'datos' }, replaceUrl: true });
            return;
        }
        await this.loadClients();
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

    /** Crea el cliente y abre su ficha, para seguir con los contactos. */
    async saveClient() {
        this.submitted = true;
        if (!this.client.name?.trim()) return;
        this.saving = true;
        try {
            const created = await this.clientService.createClient(this.client);
            this.clientDialog = false;
            this.router.navigate(['/app/clients', created.id], { queryParams: { tab: 'contactos' } });
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el cliente' });
        } finally {
            this.saving = false;
        }
    }
}

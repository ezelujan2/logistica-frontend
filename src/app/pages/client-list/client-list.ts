import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { Client, ClientService } from '../../service/client.service';
import { ServiceRequestService } from '../../service/service-request.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-client-list',
    template: `
        <div class="card">
            <p-toast></p-toast>
            <p-table #dt1 [value]="clients" dataKey="id" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]"
                [loading]="loading" [paginator]="true" [globalFilterFields]="['name', 'cuit', 'email']">
                <ng-template pTemplate="caption">
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold">Listado de Clientes</span>
                        <div class="flex gap-2">
                            <p-button label="Nuevo" icon="pi pi-plus" (click)="openNew()" />
                            <p-iconfield>
                                <p-inputicon class="pi pi-search" />
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
                        <th>Portal</th>
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
                            @if (getUserForClient(client.id); as u) {
                                <p-tag value="Activo" severity="success" />
                            } @else {
                                <p-tag value="Sin acceso" severity="secondary" />
                            }
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="editClient(client)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="deleteClient(client)" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="clientDialog" [style]="{ width: '500px' }" header="Detalles del Cliente" [modal]="true" class="p-fluid">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4 pt-2">
                        <div class="flex flex-col gap-2">
                            <label for="cname">Nombre *</label>
                            <input type="text" pInputText id="cname" [(ngModel)]="client.name" required autofocus />
                            @if (submitted && !client.name) { <small class="p-error">El nombre es obligatorio.</small> }
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="ccuit">CUIT</label>
                                <input type="text" pInputText id="ccuit" [(ngModel)]="client.cuit" />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="cphone">Teléfono</label>
                                <input type="text" pInputText id="cphone" [(ngModel)]="client.phone" />
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="cemail">Email</label>
                                <input type="text" pInputText id="cemail" [(ngModel)]="client.email" />
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="caddress">Dirección</label>
                                <input type="text" pInputText id="caddress" [(ngModel)]="client.address" />
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
                            <label for="cnotes">Notas</label>
                            <textarea id="cnotes" pTextarea [(ngModel)]="client.notes" rows="3"></textarea>
                        </div>

                        <!-- Portal access -->
                        <div class="font-semibold text-sm text-color-secondary pt-1" style="border-top:1px solid var(--surface-border)">ACCESO AL PORTAL</div>

                        @if (!linkedUser) {
                            <!-- No user yet: create one -->
                            <small class="text-color-secondary -mt-2">
                                Completá estos campos para darle acceso al portal cliente. Podés dejarlo vacío y crearlo después.
                            </small>
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label for="uemail">Email de acceso</label>
                                    <input type="email" pInputText id="uemail" [(ngModel)]="newUserEmail" placeholder="email@ejemplo.com" />
                                </div>
                                <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                    <label for="upassword">Contraseña</label>
                                    <input type="password" pInputText id="upassword" [(ngModel)]="newUserPassword" placeholder="Contraseña inicial" />
                                </div>
                            </div>
                            @if (newUserEmail && !newUserPassword) {
                                <small class="p-error">Ingresá una contraseña para crear el acceso.</small>
                            }
                        } @else {
                            <!-- User exists: show info + password reset -->
                            <div class="flex items-center justify-between surface-50 border-1 surface-border border-round px-3 py-2">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-user text-color-secondary"></i>
                                    <span class="font-semibold text-sm">{{ linkedUser.email }}</span>
                                    <p-tag value="Activo" severity="success" />
                                </div>
                                <p-button
                                    [label]="showResetPwd ? 'Cancelar' : 'Cambiar contraseña'"
                                    [icon]="showResetPwd ? 'pi pi-times' : 'pi pi-key'"
                                    [text]="true"
                                    size="small"
                                    severity="secondary"
                                    (click)="showResetPwd = !showResetPwd; resetPwdValue = ''"
                                />
                            </div>
                            @if (showResetPwd) {
                                <div class="flex flex-col gap-2">
                                    <label for="newpwd">Nueva contraseña</label>
                                    <input type="password" pInputText id="newpwd" [(ngModel)]="resetPwdValue" placeholder="Nueva contraseña" />
                                </div>
                            }
                        }
                    </div>
                </ng-template>

                <ng-template pTemplate="footer">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveClient()" [loading]="saving" />
                </ng-template>
            </p-dialog>
        </div>
    `,
    standalone: true,
    imports: [TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule, DialogModule, FormsModule, TextareaModule, CheckboxModule, TagModule, ToastModule],
    providers: [MessageService]
})
export class ClientList implements OnInit {
    clients: Client[] = [];
    client: Client = { name: '' };
    loading = true;
    saving = false;
    clientDialog = false;
    submitted = false;

    users: any[] = [];
    linkedUser: any = null;
    newUserEmail = '';
    newUserPassword = '';
    showResetPwd = false;
    resetPwdValue = '';

    constructor(
        private clientService: ClientService,
        private srs: ServiceRequestService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadClients();
        this.loadUsers();
    }

    async loadClients() {
        this.loading = true;
        try {
            this.clients = await this.clientService.getClients();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los clientes' });
        } finally {
            this.loading = false;
        }
    }

    loadUsers() {
        this.srs.getUsers().subscribe({ next: v => { this.users = v; } });
    }

    getUserForClient(clientId: number | undefined): any {
        if (!clientId) return null;
        return this.users.find(u => u.clientId === clientId) ?? null;
    }

    openNew() {
        this.client = { name: '' };
        this.submitted = false;
        this.linkedUser = null;
        this.newUserEmail = '';
        this.newUserPassword = '';
        this.showResetPwd = false;
        this.resetPwdValue = '';
        this.clientDialog = true;
    }

    editClient(client: Client) {
        this.client = { ...client };
        this.submitted = false;
        this.linkedUser = this.getUserForClient(client.id);
        this.newUserEmail = '';
        this.newUserPassword = '';
        this.showResetPwd = false;
        this.resetPwdValue = '';
        this.clientDialog = true;
    }

    async deleteClient(client: Client) {
        if (!client.id) return;
        if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
            try {
                await this.clientService.deleteClient(client.id);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente eliminado', life: 3000 });
                this.loadClients();
            } catch {
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
        if (!this.client.name?.trim()) return;
        if (this.newUserEmail && !this.newUserPassword) return;

        this.saving = true;
        try {
            let savedId = this.client.id;
            if (this.client.id) {
                await this.clientService.updateClient(this.client.id, this.client);
            } else {
                const created: any = await this.clientService.createClient(this.client);
                savedId = created?.id;
            }

            // Create new user access if email+password provided
            if (!this.linkedUser && this.newUserEmail && this.newUserPassword && savedId) {
                await firstValueFrom(this.srs.createUser({
                    name: this.client.name,
                    email: this.newUserEmail,
                    password: this.newUserPassword,
                    role: 'CLIENT',
                    clientId: savedId,
                }));
                this.loadUsers();
            }

            // Reset password if requested
            if (this.linkedUser && this.showResetPwd && this.resetPwdValue) {
                await firstValueFrom(this.srs.resetPassword(this.linkedUser.id, this.resetPwdValue));
            }

            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente guardado', life: 3000 });
            this.clientDialog = false;
            this.client = { name: '' };
            this.loadClients();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el cliente' });
        } finally {
            this.saving = false;
        }
    }
}

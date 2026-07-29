import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ServiceRequestService } from '../../../service/service-request.service';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, FormsModule, TagModule, ButtonModule, DialogModule, SelectModule, ToastModule, TableModule, InputTextModule, IconFieldModule, InputIconModule, TooltipModule],
    providers: [MessageService],
    template: `
    <div class="card">
        <p-toast></p-toast>

        <p-table #dt [value]="users" [loading]="loading" [rows]="10" [paginator]="true"
            [rowsPerPageOptions]="[10,25,50]" [globalFilterFields]="['name','email','role']"
            dataKey="id">
            <ng-template pTemplate="caption">
                <div class="flex justify-between items-center">
                    <span class="text-xl font-bold">Gestión de usuarios</span>
                    <div class="flex gap-2">
                        <p-button label="Nuevo usuario" icon="pi pi-plus" (click)="openNew()" />
                        <p-iconfield>
                            <p-inputicon class="pi pi-search" />
                            <input pInputText type="text" (input)="dt.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar..." />
                        </p-iconfield>
                    </div>
                </div>
            </ng-template>
            <ng-template pTemplate="header">
                <tr>
                    <th pSortableColumn="name">Nombre <p-sortIcon field="name" /></th>
                    <th pSortableColumn="email">Email <p-sortIcon field="email" /></th>
                    <th>Rol</th>
                    <th>Vinculado a</th>
                    <th>Estado</th>
                    <th style="width:110px">Acciones</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-u>
                <tr>
                    <td>{{ u.name || '—' }}</td>
                    <td>{{ u.email }}</td>
                    <td><p-tag [value]="roleLabel(u.role)" [severity]="roleSeverity(u.role)" /></td>
                    <td>
                        @if (u.driver) { <span><i class="pi pi-user mr-1 text-color-secondary"></i>{{ u.driver.name }}</span> }
                        @else if (u.client) { <span><i class="pi pi-building mr-1 text-color-secondary"></i>{{ u.client.name }}</span> }
                        @else { <span class="text-color-secondary">—</span> }
                    </td>
                    <td>
                        @if (u.isBlocked) { <p-tag value="Bloqueado" severity="danger" /> }
                        @else { <p-tag value="Activo" severity="success" /> }
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="openEdit(u)" pTooltip="Editar" />
                        <p-button icon="pi pi-key" [rounded]="true" [text]="true" severity="warn" (click)="openReset(u)" pTooltip="Cambiar contraseña" />
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="6" class="text-center p-6 text-color-secondary">No hay usuarios</td></tr>
            </ng-template>
        </p-table>

        <!-- Create/Edit dialog -->
        <p-dialog [(visible)]="formVisible" [style]="{ width: '500px' }" [header]="editingUser ? 'Editar usuario' : 'Nuevo usuario'" [modal]="true" class="p-fluid">
            <ng-template pTemplate="content">
                <div class="flex flex-col gap-4 pt-2">
                    <div class="flex flex-col gap-2">
                        <label for="uname">Nombre</label>
                        <input type="text" pInputText id="uname" [(ngModel)]="form.name" placeholder="Nombre completo" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="uemail">Email *</label>
                        <input type="email" pInputText id="uemail" [(ngModel)]="form.email" placeholder="email@ejemplo.com" />
                    </div>
                    @if (!editingUser) {
                        <div class="flex flex-col gap-2">
                            <label for="upassword">Contraseña *</label>
                            <input type="password" pInputText id="upassword" [(ngModel)]="form.password" placeholder="Contraseña inicial" />
                        </div>
                    }
                    <div class="flex flex-col gap-2">
                        <label for="urole">Rol *</label>
                        <p-select [filter]="true" appendTo="body" inputId="urole" [options]="roleOptions" [(ngModel)]="form.role"
                            optionLabel="label" optionValue="value" [style]="{'width':'100%'}" (onChange)="onRoleChange()" />
                    </div>
                    @if (form.role === 'DRIVER') {
                        <div class="flex flex-col gap-2">
                            <label for="udriverid">Chofer vinculado</label>
                            <p-select [filter]="true" appendTo="body" inputId="udriverid" [options]="drivers" [(ngModel)]="form.driverId"
                                optionLabel="name" optionValue="id" [style]="{'width':'100%'}"
                                [showClear]="true" placeholder="Seleccioná un chofer" />
                        </div>
                    }
                    @if (form.role === 'CLIENT') {
                        <div class="flex flex-col gap-2">
                            <label for="uclientid">Cliente vinculado</label>
                            <p-select [filter]="true" appendTo="body" inputId="uclientid" [options]="clients" [(ngModel)]="form.clientId"
                                optionLabel="name" optionValue="id" [style]="{'width':'100%'}"
                                [showClear]="true" placeholder="Seleccioná un cliente" />
                        </div>
                    }
                    @if (editingUser) {
                        <div class="flex flex-col gap-2">
                            <label for="ustatus">Estado</label>
                            <p-select [filter]="true" appendTo="body" inputId="ustatus"
                                [options]="[{label:'Activo',value:false},{label:'Bloqueado',value:true}]"
                                [(ngModel)]="form.isBlocked" optionLabel="label" optionValue="value" [style]="{'width':'100%'}" />
                        </div>
                    }
                    @if (formError) {
                        <small class="p-error">{{ formError }}</small>
                    }
                </div>
            </ng-template>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="formVisible = false" />
                <p-button [label]="editingUser ? 'Guardar' : 'Crear usuario'" icon="pi pi-check" [text]="true" (click)="save()" [loading]="submitting" />
            </ng-template>
        </p-dialog>

        <!-- Reset password dialog -->
        <p-dialog [(visible)]="resetVisible" [style]="{ width: '380px' }" header="Cambiar contraseña" [modal]="true" class="p-fluid">
            <ng-template pTemplate="content">
                <div class="flex flex-col gap-4 pt-2">
                    <p class="m-0">Usuario: <strong>{{ resetUser?.email }}</strong></p>
                    <div class="flex flex-col gap-2">
                        <label for="newpwd">Nueva contraseña *</label>
                        <input type="password" pInputText id="newpwd" [(ngModel)]="newPassword" placeholder="Nueva contraseña" />
                    </div>
                </div>
            </ng-template>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="resetVisible = false" />
                <p-button label="Cambiar" icon="pi pi-check" [text]="true" (click)="doReset()" [loading]="submitting" [disabled]="!newPassword" />
            </ng-template>
        </p-dialog>
    </div>
    `
})
export class AdminUsers implements OnInit {
    loading = false;
    submitting = false;
    formVisible = false;
    resetVisible = false;
    formError = '';
    users: any[] = [];
    drivers: any[] = [];
    clients: any[] = [];
    editingUser: any = null;
    resetUser: any = null;
    newPassword = '';
    form: any = { name: '', email: '', password: '', role: 'DIRECTOR', driverId: null, clientId: null, isBlocked: false };
    private api = environment.apiUrl;

    roleOptions = [
        { label: 'Administrador', value: 'ADMIN' },
        { label: 'Director', value: 'DIRECTOR' },
        { label: 'Chofer', value: 'DRIVER' },
        { label: 'Cliente', value: 'CLIENT' },
    ];

    constructor(private srs: ServiceRequestService, private http: HttpClient, private toast: MessageService) {}

    ngOnInit() {
        this.load();
        this.http.get<any[]>(`${this.api}drivers`).subscribe({ next: v => { this.drivers = v; } });
        this.http.get<any[]>(`${this.api}clients`).subscribe({ next: v => { this.clients = v; } });
    }

    load() {
        this.loading = true;
        this.srs.getUsers().subscribe({ next: v => { this.users = v; this.loading = false; }, error: () => { this.loading = false; } });
    }

    openNew() {
        this.editingUser = null;
        this.form = { name: '', email: '', password: '', role: 'DIRECTOR', driverId: null, clientId: null, isBlocked: false };
        this.formError = '';
        this.formVisible = true;
    }

    openEdit(u: any) {
        this.editingUser = u;
        this.form = { name: u.name, email: u.email, password: '', role: u.role, driverId: u.driverId, clientId: u.clientId, isBlocked: u.isBlocked };
        this.formError = '';
        this.formVisible = true;
    }

    onRoleChange() {
        if (this.form.role !== 'DRIVER') this.form.driverId = null;
        if (this.form.role !== 'CLIENT') this.form.clientId = null;
    }

    save() {
        this.formError = '';
        if (!this.form.email || !this.form.role) { this.formError = 'Email y rol son requeridos'; return; }
        if (!this.editingUser && !this.form.password) { this.formError = 'La contraseña es requerida'; return; }
        this.submitting = true;
        const obs = this.editingUser
            ? this.srs.updateUser(this.editingUser.id, this.form)
            : this.srs.createUser(this.form);
        obs.subscribe({
            next: () => {
                this.submitting = false;
                this.formVisible = false;
                this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Usuario guardado correctamente.' });
                this.load();
            },
            error: (e: any) => {
                this.submitting = false;
                this.formError = e?.error?.error || 'Error al guardar usuario';
            },
        });
    }

    openReset(u: any) { this.resetUser = u; this.newPassword = ''; this.resetVisible = true; }

    doReset() {
        if (!this.newPassword || !this.resetUser) return;
        this.submitting = true;
        this.srs.resetPassword(this.resetUser.id, this.newPassword).subscribe({
            next: () => {
                this.submitting = false;
                this.resetVisible = false;
                this.toast.add({ severity: 'success', summary: 'Contraseña cambiada', detail: 'La contraseña fue actualizada.' });
            },
            error: () => { this.submitting = false; this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar la contraseña.' }); },
        });
    }

    roleLabel(r: string): string { return ({ ADMIN: 'Admin', DIRECTOR: 'Director', USER: 'Director', DRIVER: 'Chofer', CLIENT: 'Cliente' } as any)[r] || r; }
    roleSeverity(r: string): any { return ({ ADMIN: 'danger', DIRECTOR: 'warn', USER: 'warn', DRIVER: 'info', CLIENT: 'success' } as any)[r] || 'info'; }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ManagedUser, UsersService } from '../../../service/users.service';
import { AuthService } from '../../../service/auth.service';
import { Role } from '../../../service/permissions';

interface RoleOption {
    label: string;
    value: Role;
}

const ALL_ROLE_OPTIONS: RoleOption[] = [
    { label: 'Administrador', value: 'ADMIN' },
    { label: 'Administrador Operativo', value: 'ADMIN_OPERATIVO' },
    { label: 'Director', value: 'DIRECTOR' }
];

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, PasswordModule, SelectModule, ToggleSwitchModule, DialogModule, ToastModule, TagModule, TooltipModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <p-toast></p-toast>
            <div class="flex justify-between items-center mb-4">
                <span class="text-xl font-bold">Usuarios del sistema</span>
                <p-button label="Nuevo usuario" icon="pi pi-plus" (click)="openNew()" />
            </div>

            <p-table [value]="users" [loading]="loading" dataKey="id" [rows]="15" [paginator]="true">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Último acceso</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-user>
                    <tr>
                        <td>{{ user.name || '-' }}</td>
                        <td>{{ user.email }}</td>
                        <td>{{ getRoleLabel(user.role) }}</td>
                        <td>{{ user.lastLoginAt ? (user.lastLoginAt | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}</td>
                        <td>
                            <p-tag [value]="user.isBlocked ? 'Bloqueado' : 'Activo'" [severity]="user.isBlocked ? 'danger' : 'success'"></p-tag>
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="editUser(user)" />
                            <p-button [icon]="user.isBlocked ? 'pi pi-lock-open' : 'pi pi-lock'" [rounded]="true" [text]="true"
                                      [severity]="user.isBlocked ? 'success' : 'danger'" (click)="toggleBlocked(user)"
                                      [pTooltip]="user.isBlocked ? 'Desbloquear' : 'Bloquear'" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr><td colspan="6" class="text-center p-4">No hay usuarios cargados.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [(visible)]="userDialog" [style]="{ width: '450px' }" header="Datos del usuario" [modal]="true" styleClass="p-fluid">
            <ng-template pTemplate="content">
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="name">Nombre</label>
                        <input type="text" pInputText id="name" [(ngModel)]="editingUser.name" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="email">Email</label>
                        <input type="text" pInputText id="email" [(ngModel)]="editingUser.email" required />
                    </div>
                    <div class="flex flex-col gap-2" *ngIf="!editingUser.id">
                        <label for="password">Contraseña</label>
                        <p-password id="password" [(ngModel)]="editingUser.password" [toggleMask]="true" [feedback]="false"></p-password>
                    </div>
                    <div class="flex flex-col gap-2" *ngIf="editingUser.id">
                        <label for="password">Nueva contraseña (opcional)</label>
                        <p-password id="password" [(ngModel)]="editingUser.password" [toggleMask]="true" [feedback]="false"></p-password>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="role">Rol</label>
                        <p-select id="role" [options]="availableRoleOptions" [(ngModel)]="editingUser.role" optionLabel="label" optionValue="value" placeholder="Seleccionar rol" appendTo="body"></p-select>
                    </div>
                    <div class="flex items-center gap-2" *ngIf="editingUser.id">
                        <p-toggleswitch [(ngModel)]="editingUser.isBlocked"></p-toggleswitch>
                        <label>Usuario bloqueado</label>
                    </div>
                    <small class="p-error" *ngIf="submitted && (!editingUser.email || !editingUser.role || (!editingUser.id && !editingUser.password))">
                        Completá email, contraseña (en alta) y rol.
                    </small>
                </div>
            </ng-template>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="hideDialog()" />
                <p-button label="Guardar" icon="pi pi-check" [text]="true" (click)="saveUser()" />
            </ng-template>
        </p-dialog>
    `
})
export class AdminUsers implements OnInit {
    users: ManagedUser[] = [];
    loading = true;
    userDialog = false;
    submitted = false;

    editingUser: Partial<ManagedUser> & { password?: string } = {};

    constructor(private usersService: UsersService, private authService: AuthService, private messageService: MessageService) {}

    ngOnInit() {
        this.loadUsers();
    }

    // Un DIRECTOR no puede asignar (ni ver como opción) el rol ADMIN.
    get availableRoleOptions(): RoleOption[] {
        if (this.authService.currentUser()?.role === 'ADMIN') return ALL_ROLE_OPTIONS;
        return ALL_ROLE_OPTIONS.filter(o => o.value !== 'ADMIN');
    }

    getRoleLabel(role: Role): string {
        return ALL_ROLE_OPTIONS.find(o => o.value === role)?.label || role;
    }

    async loadUsers() {
        this.loading = true;
        try {
            this.users = await new Promise<ManagedUser[]>((resolve, reject) => {
                this.usersService.getUsers().subscribe({ next: resolve, error: reject });
            });
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
        } finally {
            this.loading = false;
        }
    }

    openNew() {
        this.editingUser = { role: 'ADMIN_OPERATIVO' as Role };
        this.submitted = false;
        this.userDialog = true;
    }

    editUser(user: ManagedUser) {
        this.editingUser = { ...user, password: '' };
        this.submitted = false;
        this.userDialog = true;
    }

    hideDialog() {
        this.userDialog = false;
        this.submitted = false;
    }

    async toggleBlocked(user: ManagedUser) {
        try {
            await new Promise((resolve, reject) => {
                this.usersService.updateUser(user.id, { isBlocked: !user.isBlocked }).subscribe({ next: resolve, error: reject });
            });
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: user.isBlocked ? 'Usuario desbloqueado' : 'Usuario bloqueado', life: 3000 });
            this.loadUsers();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario' });
        }
    }

    async saveUser() {
        this.submitted = true;
        const u = this.editingUser;

        if (!u.email || !u.role || (!u.id && !u.password)) return;

        try {
            if (u.id) {
                const payload: any = { name: u.name, email: u.email, role: u.role, isBlocked: u.isBlocked };
                if (u.password) payload.password = u.password;
                await new Promise((resolve, reject) => {
                    this.usersService.updateUser(u.id!, payload).subscribe({ next: resolve, error: reject });
                });
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado', life: 3000 });
            } else {
                await new Promise((resolve, reject) => {
                    this.usersService.createUser({ email: u.email!, password: u.password!, name: u.name || undefined, role: u.role! }).subscribe({ next: resolve, error: reject });
                });
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado', life: 3000 });
            }
            this.userDialog = false;
            this.loadUsers();
        } catch (error: any) {
            const detail = error?.error?.error || 'No se pudo guardar el usuario';
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
        }
    }
}

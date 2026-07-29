import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ServiceRequestService, PassengerModel } from '../../../service/service-request.service';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-admin-passengers',
    standalone: true,
    imports: [FormsModule, ButtonModule, DialogModule, MultiSelectModule, SelectModule, ToastModule, TableModule, InputTextModule, IconFieldModule, InputIconModule],
    providers: [MessageService],
    template: `
    <div class="card">
        <p-toast></p-toast>

        <p-table #dt [value]="passengers" [loading]="loading" [rows]="10" [paginator]="true"
            [rowsPerPageOptions]="[10,25,50]" [globalFilterFields]="['name','phone','address']" dataKey="id">
            <ng-template pTemplate="caption">
                <div class="flex justify-between items-center flex-wrap gap-2">
                    <span class="text-xl font-bold">Pasajeros</span>
                    <div class="flex gap-2 items-center">
                        <p-select [filter]="true" appendTo="body" [options]="clientFilterOptions" [(ngModel)]="filterClientId"
                            optionLabel="label" optionValue="value" [showClear]="true"
                            placeholder="Todos los clientes" [style]="{'min-width':'180px'}" (onChange)="load()" />
                        <p-button label="Nuevo" icon="pi pi-plus" (click)="openNew()" />
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
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>Clientes</th>
                    <th>Notas</th>
                    <th style="width:100px">Acciones</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-p>
                <tr>
                    <td><strong>{{ p.name }}</strong></td>
                    <td>{{ p.phone || '—' }}</td>
                    <td>{{ p.address || '—' }}</td>
                    <td>
                        <div class="flex flex-wrap gap-1">
                            @for (c of p.clients || []; track c.id) {
                                <span class="border-round px-2 py-1 text-xs font-semibold surface-200 text-color">{{ c.name }}</span>
                            }
                            @if (!p.clients?.length) { <span class="text-color-secondary">—</span> }
                        </div>
                    </td>
                    <td class="text-color-secondary text-sm">{{ p.notes || '—' }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="openEdit(p)" pTooltip="Editar" />
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="confirmDelete(p)" pTooltip="Eliminar" />
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="6" class="text-center p-6 text-color-secondary">No hay pasajeros</td></tr>
            </ng-template>
        </p-table>

        <!-- Form dialog -->
        <p-dialog [(visible)]="formVisible" [style]="{ width: '480px' }" [header]="editingPassenger ? 'Editar pasajero' : 'Nuevo pasajero'" [modal]="true" class="p-fluid">
            <ng-template pTemplate="content">
                <div class="flex flex-col gap-4 pt-2">
                    <div class="flex flex-col gap-2">
                        <label for="pname">Nombre *</label>
                        <input type="text" pInputText id="pname" [(ngModel)]="form.name" placeholder="Nombre completo" autofocus />
                        @if (submitted && !form.name) { <small class="p-error">El nombre es obligatorio.</small> }
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label for="pphone">Teléfono</label>
                            <input type="tel" pInputText id="pphone" [(ngModel)]="form.phone" placeholder="+54 11 ..." />
                        </div>
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label for="paddress">Dirección</label>
                            <input type="text" pInputText id="paddress" [(ngModel)]="form.address" placeholder="Dirección habitual" />
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="pnotes">Notas</label>
                        <input type="text" pInputText id="pnotes" [(ngModel)]="form.notes" placeholder="Observaciones" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="pclients">Clientes asociados</label>
                        <p-multiselect appendTo="body" inputId="pclients" [options]="clients" [(ngModel)]="form.clientIds"
                            optionLabel="name" optionValue="id" [style]="{'width':'100%'}"
                            placeholder="Seleccioná clientes" display="chip" />
                    </div>
                    @if (formError) {
                        <small class="p-error">{{ formError }}</small>
                    }
                </div>
            </ng-template>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="formVisible = false" />
                <p-button [label]="editingPassenger ? 'Guardar' : 'Crear'" icon="pi pi-check" [text]="true" (click)="save()" [loading]="submitting" />
            </ng-template>
        </p-dialog>

        <!-- Delete confirm -->
        <p-dialog [(visible)]="deleteVisible" [style]="{ width: '360px' }" header="Confirmar eliminación" [modal]="true">
            <ng-template pTemplate="content">
                <p class="m-0">¿Eliminar a <strong>{{ deletingPassenger?.name }}</strong>?</p>
            </ng-template>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="deleteVisible = false" />
                <p-button label="Eliminar" icon="pi pi-trash" [text]="true" severity="danger" (click)="doDelete()" [loading]="submitting" />
            </ng-template>
        </p-dialog>
    </div>
    `
})
export class AdminPassengers implements OnInit {
    loading = false;
    submitting = false;
    submitted = false;
    formVisible = false;
    deleteVisible = false;
    formError = '';
    passengers: PassengerModel[] = [];
    clients: any[] = [];
    clientFilterOptions: any[] = [];
    filterClientId: number | null = null;
    editingPassenger: PassengerModel | null = null;
    deletingPassenger: PassengerModel | null = null;
    form: any = { name: '', phone: '', address: '', notes: '', clientIds: [] };
    private api = environment.apiUrl;

    constructor(private srs: ServiceRequestService, private http: HttpClient, private toast: MessageService) {}

    ngOnInit() {
        this.http.get<any[]>(`${this.api}clients`).subscribe({ next: v => {
            this.clients = v;
            this.clientFilterOptions = v.map(c => ({ label: c.name, value: c.id }));
        }});
        this.load();
    }

    load() {
        this.loading = true;
        this.srs.getPassengers(this.filterClientId ?? undefined).subscribe({
            next: v => { this.passengers = v; this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    openNew() {
        this.editingPassenger = null;
        this.submitted = false;
        this.form = { name: '', phone: '', address: '', notes: '', clientIds: [] };
        this.formError = '';
        this.formVisible = true;
    }

    openEdit(p: PassengerModel) {
        this.editingPassenger = p;
        this.submitted = false;
        this.form = { name: p.name, phone: p.phone || '', address: p.address || '', notes: p.notes || '', clientIds: (p.clients || []).map((c: any) => c.id) };
        this.formError = '';
        this.formVisible = true;
    }

    save() {
        this.submitted = true;
        this.formError = '';
        if (!this.form.name?.trim()) return;
        this.submitting = true;
        const obs = this.editingPassenger
            ? this.srs.updatePassenger(this.editingPassenger.id, this.form)
            : this.srs.createPassenger(this.form);
        obs.subscribe({
            next: () => {
                this.submitting = false;
                this.formVisible = false;
                this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pasajero guardado.', life: 3000 });
                this.load();
            },
            error: (e: any) => {
                this.submitting = false;
                this.formError = e?.error?.error || 'Error al guardar';
            },
        });
    }

    confirmDelete(p: PassengerModel) { this.deletingPassenger = p; this.deleteVisible = true; }

    doDelete() {
        if (!this.deletingPassenger) return;
        this.submitting = true;
        this.srs.deletePassenger(this.deletingPassenger.id).subscribe({
            next: () => {
                this.submitting = false;
                this.deleteVisible = false;
                this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pasajero eliminado.', life: 3000 });
                this.load();
            },
            error: () => { this.submitting = false; this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }); },
        });
    }
}

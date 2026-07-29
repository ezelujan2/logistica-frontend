import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ServiceRequestService, ServiceTemplateModel } from '../../../service/service-request.service';
import { ConfigurationService, SystemConfiguration } from '../../../service/configuration.service';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-admin-templates',
    standalone: true,
    imports: [FormsModule, TagModule, ButtonModule, DialogModule, SelectModule, InputNumberModule, ToastModule, TableModule, InputTextModule, IconFieldModule, InputIconModule],
    providers: [MessageService],
    template: `
    <div class="card">
        <p-toast></p-toast>

        <p-table #dt [value]="templates" [loading]="loading" [rows]="10" [paginator]="true"
            [rowsPerPageOptions]="[10,25,50]" [globalFilterFields]="['name','origin','destination']" dataKey="id">
            <ng-template pTemplate="caption">
                <div class="flex justify-between items-center flex-wrap gap-2">
                    <span class="text-xl font-bold">Templates de servicio</span>
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
                    <th>Cliente</th>
                    <th>Ruta</th>
                    <th>Tipo</th>
                    <th>Tarifario</th>
                    <th>Límite</th>
                    <th>Estado</th>
                    <th style="width:100px">Acciones</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-t>
                <tr>
                    <td><strong>{{ t.name }}</strong></td>
                    <td>{{ t.client?.name || '—' }}</td>
                    <td class="text-sm">{{ t.origin }} → {{ t.destination }}</td>
                    <td>{{ serviceTypeLabel(t.serviceType) }}</td>
                    <td>{{ t.configuration?.name || '—' }}</td>
                    <td class="text-sm text-color-secondary">{{ deadlineLabel(t) }}</td>
                    <td>
                        @if (t.isActive) { <p-tag value="Activo" severity="success" /> }
                        @else { <p-tag value="Inactivo" severity="secondary" /> }
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" (click)="openEdit(t)" pTooltip="Editar" />
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (click)="confirmDelete(t)" pTooltip="Eliminar" />
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="8" class="text-center p-6 text-color-secondary">No hay templates</td></tr>
            </ng-template>
        </p-table>

        <!-- Form dialog -->
        <p-dialog [(visible)]="formVisible" [style]="{ width: '560px' }" [header]="editingTemplate ? 'Editar template' : 'Nuevo template'" [modal]="true" class="p-fluid">
            <ng-template pTemplate="content">
                <div class="flex flex-col gap-4 pt-2">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label for="tname">Nombre *</label>
                            <input type="text" pInputText id="tname" [(ngModel)]="form.name" placeholder="Ej: Traslado semanal" autofocus />
                            @if (submitted && !form.name) { <small class="p-error">Requerido.</small> }
                        </div>
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label for="tclient">Cliente *</label>
                            <p-select [filter]="true" appendTo="body" inputId="tclient" [options]="clients" [(ngModel)]="form.clientId"
                                optionLabel="name" optionValue="id" [style]="{'width':'100%'}" placeholder="Seleccioná cliente" />
                            @if (submitted && !form.clientId) { <small class="p-error">Requerido.</small> }
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label for="torigin">Origen *</label>
                            <input type="text" pInputText id="torigin" [(ngModel)]="form.origin" placeholder="Dirección de origen" />
                            @if (submitted && !form.origin) { <small class="p-error">Requerido.</small> }
                        </div>
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label for="tdest">Destino *</label>
                            <input type="text" pInputText id="tdest" [(ngModel)]="form.destination" placeholder="Dirección de destino" />
                            @if (submitted && !form.destination) { <small class="p-error">Requerido.</small> }
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label for="ttype">Tipo de servicio *</label>
                            <p-select [filter]="true" appendTo="body" inputId="ttype" [options]="serviceTypeOptions" [(ngModel)]="form.serviceType"
                                optionLabel="label" optionValue="value" [style]="{'width':'100%'}" />
                        </div>
                        <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                            <label for="tconfig">Tarifa (tarifario)</label>
                            <p-select [filter]="true" appendTo="body" inputId="tconfig" [options]="configurations" [(ngModel)]="form.configurationId"
                                optionLabel="name" optionValue="id" [style]="{'width':'100%'}"
                                placeholder="Sin tarifa asignada" [showClear]="true" />
                        </div>
                    </div>

                    <!-- Deadline section -->
                    <div class="font-semibold text-sm text-color-secondary pt-2" style="border-top: 1px solid var(--surface-border)">LÍMITE DE CARGA</div>
                    <div class="flex flex-col gap-2">
                        <label for="tdeadlinetype">Tipo de límite</label>
                        <p-select [filter]="true" appendTo="body" inputId="tdeadlinetype" [options]="deadlineTypeOptions" [(ngModel)]="form.deadlineType"
                            optionLabel="label" optionValue="value" [style]="{'width':'100%'}" (onChange)="onDeadlineTypeChange()" />
                    </div>
                    @if (form.deadlineType !== 'NONE') {
                        <div class="grid grid-cols-12 gap-4">
                            @if (form.deadlineType === 'WEEKLY') {
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label for="tweekday">Día de la semana</label>
                                    <p-select [filter]="true" appendTo="body" inputId="tweekday" [options]="weekdayOptions" [(ngModel)]="form.deadlineDay"
                                        optionLabel="label" optionValue="value" [style]="{'width':'100%'}" />
                                </div>
                            }
                            @if (form.deadlineType === 'MONTHLY') {
                                <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                    <label for="tmonthday">Día del mes</label>
                                    <p-inputNumber inputId="tmonthday" [(ngModel)]="form.deadlineDay" [min]="1" [max]="28" />
                                </div>
                            }
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="thour">Hora límite</label>
                                <p-inputNumber inputId="thour" [(ngModel)]="form.deadlineHour" [min]="0" [max]="23" placeholder="23" />
                            </div>
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="tmin">Minuto límite</label>
                                <p-inputNumber inputId="tmin" [(ngModel)]="form.deadlineMinute" [min]="0" [max]="59" placeholder="59" />
                            </div>
                        </div>
                        <small class="text-color-secondary">Después de este límite la solicitud se marcará como <strong>fuera de plazo</strong>.</small>
                    }

                    <div class="flex flex-col gap-2">
                        <label for="tstatus">Estado</label>
                        <p-select [filter]="true" appendTo="body" inputId="tstatus"
                            [options]="[{label:'Activo',value:true},{label:'Inactivo',value:false}]"
                            [(ngModel)]="form.isActive" optionLabel="label" optionValue="value" [style]="{'width':'100%'}" />
                    </div>
                    @if (formError) { <small class="p-error">{{ formError }}</small> }
                </div>
            </ng-template>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="formVisible = false" />
                <p-button [label]="editingTemplate ? 'Guardar' : 'Crear template'" icon="pi pi-check" [text]="true" (click)="save()" [loading]="submitting" />
            </ng-template>
        </p-dialog>

        <!-- Delete confirm -->
        <p-dialog [(visible)]="deleteVisible" [style]="{ width: '360px' }" header="Confirmar eliminación" [modal]="true">
            <ng-template pTemplate="content">
                <p class="m-0">¿Eliminar el template <strong>{{ deletingTemplate?.name }}</strong>?</p>
            </ng-template>
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (click)="deleteVisible = false" />
                <p-button label="Eliminar" icon="pi pi-trash" [text]="true" severity="danger" (click)="doDelete()" [loading]="submitting" />
            </ng-template>
        </p-dialog>
    </div>
    `
})
export class AdminTemplates implements OnInit {
    loading = false;
    submitting = false;
    submitted = false;
    formVisible = false;
    deleteVisible = false;
    formError = '';
    templates: ServiceTemplateModel[] = [];
    clients: any[] = [];
    configurations: SystemConfiguration[] = [];
    clientFilterOptions: any[] = [];
    filterClientId: number | null = null;
    editingTemplate: ServiceTemplateModel | null = null;
    deletingTemplate: ServiceTemplateModel | null = null;
    form: any = { name: '', clientId: null, origin: '', destination: '', serviceType: 'SERVICE', configurationId: null, deadlineType: 'NONE', deadlineDay: null, deadlineHour: 23, deadlineMinute: 59, isActive: true };
    private api = environment.apiUrl;

    serviceTypeOptions = [
        { label: 'Servicio', value: 'SERVICE' },
        { label: 'Mensajería', value: 'MESSAGING' },
        { label: 'Manejo', value: 'DRIVING' },
        { label: 'Medio turno', value: 'HALF_ROUND' },
        { label: 'Otro', value: 'OTHER' },
    ];
    deadlineTypeOptions = [
        { label: 'Sin límite', value: 'NONE' },
        { label: 'Semanal', value: 'WEEKLY' },
        { label: 'Mensual', value: 'MONTHLY' },
    ];
    weekdayOptions = [
        { label: 'Domingo', value: 0 }, { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 },
        { label: 'Miércoles', value: 3 }, { label: 'Jueves', value: 4 }, { label: 'Viernes', value: 5 }, { label: 'Sábado', value: 6 },
    ];

    constructor(private srs: ServiceRequestService, private http: HttpClient, private toast: MessageService, private configSvc: ConfigurationService) {}

    ngOnInit() {
        this.http.get<any[]>(`${this.api}clients`).subscribe({ next: v => {
            this.clients = v;
            this.clientFilterOptions = v.map(c => ({ label: c.name, value: c.id }));
        }});
        this.configSvc.getConfigs().subscribe({ next: v => { this.configurations = v; } });
        this.load();
    }

    load() {
        this.loading = true;
        this.srs.getTemplates(this.filterClientId ?? undefined).subscribe({
            next: v => { this.templates = v; this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    openNew() {
        this.editingTemplate = null;
        this.submitted = false;
        this.form = { name: '', clientId: null, origin: '', destination: '', serviceType: 'SERVICE', configurationId: null, deadlineType: 'NONE', deadlineDay: null, deadlineHour: 23, deadlineMinute: 59, isActive: true };
        this.formError = '';
        this.formVisible = true;
    }

    openEdit(t: ServiceTemplateModel) {
        this.editingTemplate = t;
        this.submitted = false;
        this.form = { name: t.name, clientId: t.clientId, origin: t.origin, destination: t.destination, serviceType: t.serviceType, configurationId: t.configurationId ?? null, deadlineType: t.deadlineType, deadlineDay: t.deadlineDay ?? null, deadlineHour: t.deadlineHour, deadlineMinute: t.deadlineMinute, isActive: t.isActive };
        this.formError = '';
        this.formVisible = true;
    }

    onDeadlineTypeChange() {
        if (this.form.deadlineType === 'NONE') { this.form.deadlineDay = null; }
        else if (this.form.deadlineType === 'WEEKLY' && this.form.deadlineDay === null) { this.form.deadlineDay = 0; }
        else if (this.form.deadlineType === 'MONTHLY' && this.form.deadlineDay === null) { this.form.deadlineDay = 1; }
    }

    save() {
        this.submitted = true;
        this.formError = '';
        if (!this.form.name?.trim() || !this.form.clientId || !this.form.origin?.trim() || !this.form.destination?.trim()) return;
        this.submitting = true;
        const obs = this.editingTemplate
            ? this.srs.updateTemplate(this.editingTemplate.id, this.form)
            : this.srs.createTemplate(this.form);
        obs.subscribe({
            next: () => {
                this.submitting = false;
                this.formVisible = false;
                this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Template guardado.', life: 3000 });
                this.load();
            },
            error: (e: any) => {
                this.submitting = false;
                this.formError = e?.error?.error || 'Error al guardar';
            },
        });
    }

    confirmDelete(t: ServiceTemplateModel) { this.deletingTemplate = t; this.deleteVisible = true; }

    doDelete() {
        if (!this.deletingTemplate) return;
        this.submitting = true;
        this.srs.deleteTemplate(this.deletingTemplate.id).subscribe({
            next: () => {
                this.submitting = false;
                this.deleteVisible = false;
                this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Template eliminado.', life: 3000 });
                this.load();
            },
            error: () => { this.submitting = false; this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }); },
        });
    }

    deadlineLabel(t: ServiceTemplateModel): string {
        if (t.deadlineType === 'NONE') return 'Sin límite';
        const time = `${String(t.deadlineHour).padStart(2, '0')}:${String(t.deadlineMinute).padStart(2, '0')}`;
        if (t.deadlineType === 'WEEKLY') {
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return `${days[t.deadlineDay ?? 0]} ${time}`;
        }
        return `Día ${t.deadlineDay} ${time}`;
    }

    serviceTypeLabel(s: string): string {
        return ({ SERVICE: 'Servicio', MESSAGING: 'Mensajería', DRIVING: 'Manejo', HALF_ROUND: 'Medio turno', OTHER: 'Otro' } as any)[s] || s;
    }

    formatMoney(n: number) { return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 }); }
}

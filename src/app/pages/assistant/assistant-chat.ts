import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { AssistantAction, AssistantService, BatchRow, ConversationSummary, ToolCall } from '../../service/assistant.service';
import { DriverService } from '../../service/driver.service';
import { AuthService } from '../../service/auth.service';

const CAPABILITIES = [
    'Responder sobre servicios, reportes, facturas, gastos, liquidaciones, adelantos y vencimientos',
    'Hacer filtros a medida ("servicios de X en agosto con más de 3 horas de espera sin facturar")',
    'Estadísticas y análisis: márgenes, gastos por auto, cobranzas, rankings, comparaciones entre meses (sólo administradores y directores)',
    'Mostrar los resultados como tabla (descargable en Excel) o como gráfico',
    'Leer una o varias órdenes de compra (PDF o foto) e identificar a qué servicio corresponde cada una',
    'Crear o editar servicios y cambiarles el estado: te propone el cambio y vos lo confirmás con un botón',
    'Cargar de una vez los viajes de una planilla o una foto (por ejemplo, la semana de un cliente), sin duplicar los que ya están',
    'Recordar lo que hablaron en la conversación ("pasá el segundo a pagado")'
];

marked.setOptions({ breaks: true });

interface ChatTable {
    titulo: string;
    columnas: string[];
    filas: (string | number | null)[][];
}

interface ChatChart {
    titulo: string;
    tipo: 'bar' | 'line' | 'pie';
    data: any;
    options: any;
}

interface ChatBubble {
    role: 'user' | 'assistant';
    text: string;
    html: SafeHtml;
    toolCalls?: ToolCall[];
    showTools?: boolean;
    costUsd?: number;
    openLinks?: { label: string; serviceId: number }[];
    tables?: ChatTable[];
    charts?: ChatChart[];
    actions?: (AssistantAction & { busy?: boolean })[];
    progress?: string;
}

const CHART_COLORS = ['#2f6fb3', '#e0a63a', '#3aa57a', '#c4553a', '#7a5ab8', '#4fa3b8', '#8a8f98'];

function parseResult(call: ToolCall): any {
    try {
        return JSON.parse(call.result);
    } catch {
        return null;
    }
}

function openLinksFrom(toolCalls?: ToolCall[]) {
    return (toolCalls ?? [])
        .filter((c) => c.name === 'abrir_servicio')
        .map(parseResult)
        .filter((r) => r?.found && r?.id)
        .map((r) => ({ serviceId: r.id as number, label: r.reporte ? `Abrir ${r.reporte}` : `Abrir servicio #${r.id}` }));
}

function tablesFrom(toolCalls?: ToolCall[]): ChatTable[] {
    return (toolCalls ?? []).filter((c) => c.name === 'mostrar_tabla' && Array.isArray(c.input?.columnas)).map((c) => c.input as ChatTable);
}

function chartsFrom(toolCalls?: ToolCall[]): ChatChart[] {
    return (toolCalls ?? [])
        .filter((c) => c.name === 'mostrar_grafico' && Array.isArray(c.input?.series))
        .map((c) => {
            const { titulo, tipo, etiquetas, series } = c.input;
            const pie = tipo === 'pie';
            return {
                titulo,
                tipo,
                data: {
                    labels: etiquetas,
                    datasets: series.map((s: any, i: number) => ({
                        label: s.nombre,
                        data: s.valores,
                        backgroundColor: pie ? etiquetas.map((_: any, j: number) => CHART_COLORS[j % CHART_COLORS.length]) : CHART_COLORS[i % CHART_COLORS.length],
                        borderColor: pie ? undefined : CHART_COLORS[i % CHART_COLORS.length],
                        fill: false,
                        tension: 0.2
                    }))
                },
                options: { maintainAspectRatio: false, plugins: { legend: { display: pie || series.length > 1 } } }
            };
        });
}

function actionIdsFrom(toolCalls?: ToolCall[]): number[] {
    return (toolCalls ?? [])
        .filter((c) => c.name.startsWith('proponer_'))
        .map((c) => parseResult(c)?.accionId)
        .filter((id): id is number => typeof id === 'number');
}

@Component({
    selector: 'app-assistant-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, CardModule, ToastModule, TableModule, TooltipModule, SelectModule, DialogModule, ConfirmDialogModule, ChartModule, TagModule, CheckboxModule],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="card flex flex-col h-[78vh]">
            <p-toast></p-toast>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div class="flex items-center gap-2">
                    <div class="font-semibold text-xl">{{ title }}</div>
                    <p-button icon="pi pi-question-circle" [text]="true" [rounded]="true" pTooltip="¿Qué puede hacer?" (click)="helpDialog = true" />
                </div>
                <div class="flex items-center gap-2">
                    <p-select
                        [options]="conversations"
                        optionLabel="title"
                        optionValue="id"
                        placeholder="Conversaciones anteriores"
                        [ngModel]="activeConversationId"
                        (onChange)="loadConversation($event.value)"
                        [showClear]="true"
                        appendTo="body"
                        styleClass="w-64"
                    />
                    <p-button icon="pi pi-trash" [text]="true" severity="danger" pTooltip="Eliminar esta conversación" [disabled]="!activeConversationId" (click)="confirmDeleteConversation()" />
                    <p-button label="Nueva conversación" icon="pi pi-plus" [text]="true" (click)="newConversation()" />
                </div>
            </div>

            <div #scrollArea class="flex-1 overflow-y-auto flex flex-col gap-3 p-2">
                <div *ngFor="let bubble of bubbles" class="flex" [ngClass]="bubble.role === 'user' ? 'justify-end' : 'justify-start'">
                    <div class="rounded-xl px-4 py-2" [ngClass]="bubble.role === 'user' ? 'max-w-[75%] bg-primary text-primary-contrast' : 'max-w-[90%] w-fit bg-surface-100 dark:bg-surface-800'">
                        <div *ngIf="bubble.progress" class="flex items-center gap-2 text-sm text-muted-color">
                            <i class="pi pi-spin pi-spinner"></i>
                            <span>{{ bubble.progress }}</span>
                        </div>
                        <div *ngIf="!bubble.progress" class="prose-sm max-w-none" [innerHTML]="bubble.html"></div>

                        <!-- Tablas -->
                        <div *ngFor="let table of bubble.tables" class="mt-3">
                            <div class="flex items-center justify-between gap-2 mb-1">
                                <span class="font-semibold text-sm">{{ table.titulo }}</span>
                                <p-button icon="pi pi-file-excel" label="Excel" size="small" [text]="true" severity="success" (click)="exportTable(table)" />
                            </div>
                            <p-table [value]="table.filas" [scrollable]="true" scrollHeight="320px" styleClass="p-datatable-sm text-sm" [paginator]="table.filas.length > 50" [rows]="50">
                                <ng-template pTemplate="header">
                                    <tr><th *ngFor="let col of table.columnas" class="whitespace-nowrap">{{ col }}</th></tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-row>
                                    <tr><td *ngFor="let cell of row" class="whitespace-nowrap" [class.text-right]="isNumber(cell)">{{ formatCell(cell) }}</td></tr>
                                </ng-template>
                            </p-table>
                        </div>

                        <!-- Gráficos -->
                        <div *ngFor="let chart of bubble.charts" class="mt-3">
                            <div class="font-semibold text-sm mb-1">{{ chart.titulo }}</div>
                            <div class="h-72 min-w-[320px] md:min-w-[560px]">
                                <p-chart [type]="chart.tipo" [data]="chart.data" [options]="chart.options" height="100%"></p-chart>
                            </div>
                        </div>

                        <!-- Propuestas para confirmar -->
                        <div *ngFor="let action of bubble.actions" class="mt-3 p-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-0 dark:bg-surface-900">
                            <div *ngIf="!isBatch(action)" class="text-sm mb-2">{{ action.summary }}</div>

                            <!-- Carga por lotes: tabla con chofer editable y filas para incluir o saltear -->
                            <ng-container *ngIf="isBatch(action)">
                                <div class="text-sm font-medium mb-1">Crear servicios para {{ action.payload.cliente }}</div>
                                <div class="text-xs text-muted-color mb-2">Chofer, auto y km según sus viajes recientes. Podés cambiar el chofer o destildar un viaje antes de confirmar.</div>
                                <div class="overflow-x-auto">
                                    <table class="w-full text-sm">
                                        <thead>
                                            <tr class="text-left text-muted-color text-xs">
                                                <th class="py-1 pr-2"></th>
                                                <th class="py-1 pr-2">Fecha</th>
                                                <th class="py-1 pr-2">Viaje</th>
                                                <th class="py-1 pr-2">Chofer</th>
                                                <th class="py-1 pr-2 text-right">Km</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr *ngFor="let row of batchRows(action)" class="border-t border-surface-200 dark:border-surface-700" [class.opacity-60]="!row.incluir">
                                                <td class="py-1 pr-2">
                                                    <p-checkbox [(ngModel)]="row.incluir" [binary]="true" [disabled]="action.status !== 'PENDING'" />
                                                </td>
                                                <td class="py-1 pr-2 whitespace-nowrap">{{ rowDay(row) }}</td>
                                                <td class="py-1 pr-2">
                                                    {{ row.detalle }}
                                                    <div *ngIf="row.aviso" class="text-xs text-orange-600 dark:text-orange-400"><i class="pi pi-info-circle"></i> {{ row.aviso }}</div>
                                                </td>
                                                <td class="py-1 pr-2 min-w-44">
                                                    <p-select
                                                        *ngIf="action.status === 'PENDING'; else driverName"
                                                        [options]="drivers"
                                                        [(ngModel)]="row.choferId"
                                                        optionLabel="name"
                                                        optionValue="id"
                                                        placeholder="Sin chofer"
                                                        [showClear]="true"
                                                        [filter]="true"
                                                        appendTo="body"
                                                        size="small"
                                                        styleClass="w-full"
                                                    />
                                                    <ng-template #driverName>{{ row.chofer || 'Sin chofer' }}</ng-template>
                                                </td>
                                                <td class="py-1 pr-2 text-right">{{ row.km ?? '—' }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </ng-container>

                            <div *ngIf="action.status === 'PENDING'" class="flex gap-2" [class.mt-3]="isBatch(action)">
                                <p-button *ngIf="isBatch(action)" [label]="batchLabel(action)" icon="pi pi-check" size="small" severity="success" [disabled]="!batchCount(action)" [loading]="!!action.busy" (click)="resolveAction(action, true)" />
                                <p-button *ngIf="!isBatch(action)" label="Confirmar" icon="pi pi-check" size="small" severity="success" [loading]="!!action.busy" (click)="resolveAction(action, true)" />
                                <p-button label="Cancelar" icon="pi pi-times" size="small" [text]="true" severity="secondary" [disabled]="!!action.busy" (click)="resolveAction(action, false)" />
                            </div>
                            <div *ngIf="action.status !== 'PENDING'" class="flex items-center gap-2 text-sm">
                                <p-tag [value]="actionLabel(action.status)" [severity]="actionSeverity(action.status)" />
                                <span *ngIf="action.result" class="text-muted-color">{{ action.result }}</span>
                            </div>
                        </div>

                        <div *ngIf="bubble.openLinks?.length" class="flex flex-wrap gap-2 mt-2">
                            <p-button *ngFor="let link of bubble.openLinks" [label]="link.label" icon="pi pi-external-link" size="small" [routerLink]="['/app/services/all']" [queryParams]="{ id: link.serviceId }" />
                        </div>

                        <div *ngIf="bubble.toolCalls?.length" class="mt-1">
                            <button type="button" class="text-xs text-muted-color flex items-center gap-1 opacity-70 hover:opacity-100" (click)="bubble.showTools = !bubble.showTools">
                                <i class="pi" [ngClass]="bubble.showTools ? 'pi-chevron-down' : 'pi-wrench'"></i>
                                {{ bubble.showTools ? 'Ocultar detalle técnico' : 'Ver cómo lo resolvió (' + bubble.toolCalls!.length + ' pasos)' }}
                            </button>
                            <p-table *ngIf="bubble.showTools" [value]="bubble.toolCalls!" styleClass="mt-2 text-xs" [rows]="10">
                                <ng-template pTemplate="header">
                                    <tr><th>Herramienta</th><th>Pedido</th><th>Resultado</th></tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-call>
                                    <tr>
                                        <td>{{ call.name }}</td>
                                        <td class="max-w-[260px] truncate" [pTooltip]="callInput(call)">{{ callInput(call) }}</td>
                                        <td class="max-w-[260px] truncate" [pTooltip]="call.result">{{ call.result }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                        <div *ngIf="bubble.costUsd" class="text-xs text-muted-color opacity-60 mt-1">~US\${{ bubble.costUsd.toFixed(3) }}</div>
                    </div>
                </div>
            </div>

            <div *ngIf="selectedFiles.length" class="flex flex-wrap gap-2 mt-3">
                <p-tag *ngFor="let file of selectedFiles; let i = index" severity="info" [value]="file.name" icon="pi pi-file" styleClass="cursor-pointer" (click)="removeFile(i)" pTooltip="Quitar" />
            </div>
            <div class="flex gap-2 items-center mt-3">
                <input type="file" #fileInput accept=".pdf,.jpg,.jpeg,.png" multiple class="hidden" (change)="onFilesSelected($event)" />
                <p-button icon="pi pi-paperclip" [text]="true" (click)="fileInput.click()" [severity]="selectedFiles.length ? 'success' : 'secondary'" pTooltip="Adjuntar PDF o fotos (órdenes de compra, comprobantes)" />
                <input type="text" pInputText class="flex-1" [placeholder]="placeholder" [(ngModel)]="draft" (keyup.enter)="send()" [disabled]="loading" />
                <p-button label="Enviar" icon="pi pi-send" (click)="send()" [loading]="loading" [disabled]="!draft.trim() && !selectedFiles.length" />
            </div>
        </div>

        <p-dialog [(visible)]="helpDialog" [style]="{ width: '520px' }" header="¿Qué puede hacer el asistente?" [modal]="true">
            <ul class="list-disc pl-5 flex flex-col gap-2 text-sm">
                <li *ngFor="let item of capabilities">{{ item }}</li>
            </ul>
            <ng-template pTemplate="footer">
                <p-button label="Cerrar" icon="pi pi-times" [text]="true" (click)="helpDialog = false" />
            </ng-template>
        </p-dialog>

        <p-confirmDialog [style]="{ width: '420px' }"></p-confirmDialog>
    `
})
export class AssistantChat implements OnInit, AfterViewChecked {
    @Input() title = 'Asistente';
    @ViewChild('scrollArea') scrollArea?: ElementRef<HTMLDivElement>;

    bubbles: ChatBubble[] = [];
    draft = '';
    loading = false;
    selectedFiles: File[] = [];
    conversations: ConversationSummary[] = [];
    activeConversationId: number | null = null;
    helpDialog = false;
    capabilities = CAPABILITIES;
    private shouldScroll = false;

    get placeholder(): string {
        return this.authService.hasPermission('useAnalyst')
            ? 'Ej: ¿cuánto gastamos en combustible por auto en septiembre? o adjuntá una orden de compra'
            : 'Ej: servicios del cliente X en agosto sin facturar, o adjuntá una orden de compra';
    }

    constructor(
        private assistantService: AssistantService,
        private authService: AuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private sanitizer: DomSanitizer,
        private driverService: DriverService
    ) {}

    ngOnInit() {
        this.showWelcome();
        this.loadConversations();
    }

    private showWelcome() {
        this.bubbles.push(
            this.toBubble(
                'assistant',
                'Hola. Preguntame lo que necesites del sistema: servicios, gastos, cobranzas, estadísticas, o adjuntá órdenes de compra y busco a qué servicio corresponde cada una. También puedo crear o editar servicios: te muestro el cambio y vos lo confirmás.'
            )
        );
    }

    private async loadConversations() {
        try {
            this.conversations = await this.assistantService.getConversations();
        } catch {
            // silencioso: el historial es secundario, no debe bloquear el chat
        }
    }

    async loadConversation(id: number | null) {
        if (!id) {
            this.newConversation();
            return;
        }
        this.loading = true;
        try {
            const conversation = await this.assistantService.getConversation(id);
            const actionsById = new Map(conversation.pendingActions.map((a) => [a.id, a]));
            this.activeConversationId = conversation.id;
            this.bubbles = conversation.messages.map((m) => {
                const bubble = this.toBubble(m.role, m.content, m.toolCalls ?? undefined);
                bubble.actions = actionIdsFrom(m.toolCalls ?? undefined)
                    .map((id) => actionsById.get(id))
                    .filter((a): a is AssistantAction => !!a);
                return bubble;
            });
            this.shouldScroll = true;
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la conversación' });
        } finally {
            this.loading = false;
        }
    }

    newConversation() {
        this.activeConversationId = null;
        this.bubbles = [];
        this.showWelcome();
    }

    confirmDeleteConversation() {
        if (!this.activeConversationId) return;
        this.confirmationService.confirm({
            message: '¿Eliminar esta conversación? No se puede deshacer.',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await this.assistantService.deleteConversation(this.activeConversationId!);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Conversación eliminada' });
                    this.newConversation();
                    this.loadConversations();
                } catch {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la conversación' });
                }
            }
        });
    }

    private toBubble(role: 'user' | 'assistant', text: string, toolCalls?: ToolCall[], costUsd?: number): ChatBubble {
        const rawHtml = marked.parse(text, { async: false }) as string;
        const safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, rawHtml) ?? '';
        return {
            role,
            text,
            html: this.sanitizer.bypassSecurityTrustHtml(safeHtml),
            toolCalls,
            costUsd,
            openLinks: openLinksFrom(toolCalls),
            tables: tablesFrom(toolCalls),
            charts: chartsFrom(toolCalls)
        };
    }

    ngAfterViewChecked() {
        if (this.shouldScroll && this.scrollArea) {
            this.scrollArea.nativeElement.scrollTop = this.scrollArea.nativeElement.scrollHeight;
            this.shouldScroll = false;
        }
    }

    onFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        this.selectedFiles = [...this.selectedFiles, ...Array.from(input.files ?? [])].slice(0, 5);
        input.value = '';
    }

    removeFile(index: number) {
        this.selectedFiles.splice(index, 1);
    }

    async send() {
        if (this.loading || (!this.draft.trim() && !this.selectedFiles.length)) return;

        const message = this.draft.trim();
        const files = this.selectedFiles;
        const shown = message || `Adjunto: ${files.map((f) => f.name).join(', ')}`;
        this.bubbles.push(this.toBubble('user', files.length && message ? `${message}\n\n📎 ${files.map((f) => f.name).join(', ')}` : shown));

        const pending = this.toBubble('assistant', '');
        pending.progress = 'Pensando…';
        this.bubbles.push(pending);
        this.shouldScroll = true;

        this.draft = '';
        this.selectedFiles = [];
        this.loading = true;

        try {
            const result = await this.assistantService.sendMessage(message, files, this.activeConversationId, (text) => (pending.progress = text));
            const bubble = this.toBubble('assistant', result.reply, result.toolCalls, result.costUsd);
            bubble.actions = result.actions;
            this.bubbles[this.bubbles.indexOf(pending)] = bubble;
            const isNewConversation = this.activeConversationId === null;
            this.activeConversationId = result.conversationId;
            if (isNewConversation) this.loadConversations();
        } catch (error: any) {
            this.bubbles[this.bubbles.indexOf(pending)] = this.toBubble('assistant', error?.message ?? 'Tuve un problema para responder. Probá de nuevo.');
        } finally {
            this.loading = false;
            this.shouldScroll = true;
        }
    }

    // Choferes para el selector de las cargas por lotes; se piden una vez, cuando aparece la primera.
    drivers: { id: number; name: string }[] = [];
    private driversRequested = false;

    isBatch(action: AssistantAction): boolean {
        return action.type === 'CREATE_SERVICES' && Array.isArray(action.payload?.filas);
    }

    batchRows(action: AssistantAction): BatchRow[] {
        if (!this.driversRequested && action.status === 'PENDING') {
            this.driversRequested = true;
            this.driverService
                .getDrivers()
                .then((list) => (this.drivers = list.filter((d) => d.id).map((d) => ({ id: d.id!, name: d.name })).sort((a, b) => a.name.localeCompare(b.name))))
                .catch(() => (this.driversRequested = false));
        }
        return action.payload.filas;
    }

    rowDay(row: BatchRow): string {
        return new Date(row.inicio).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', day: '2-digit', month: '2-digit' });
    }

    batchCount(action: AssistantAction): number {
        return (action.payload?.filas ?? []).filter((r: BatchRow) => r.incluir).length;
    }

    batchLabel(action: AssistantAction): string {
        const n = this.batchCount(action);
        return n === 1 ? 'Crear 1 servicio' : `Crear ${n} servicios`;
    }

    async resolveAction(action: AssistantAction & { busy?: boolean }, confirm: boolean) {
        action.busy = true;
        try {
            const edits = this.isBatch(action) ? { filas: (action.payload.filas as BatchRow[]).map((r) => ({ incluir: r.incluir, choferId: r.choferId ?? null })) } : undefined;
            const updated = confirm ? await this.assistantService.confirmAction(action.id, edits) : await this.assistantService.cancelAction(action.id);
            Object.assign(action, updated);
            if (updated.status === 'FAILED') this.messageService.add({ severity: 'error', summary: 'No se pudo hacer', detail: updated.result ?? '' });
        } catch (err: any) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.error ?? 'No se pudo resolver la acción' });
        } finally {
            action.busy = false;
        }
    }

    actionLabel(status: string): string {
        return ({ CONFIRMED: 'Hecho', CANCELLED: 'Cancelado', FAILED: 'Falló' } as Record<string, string>)[status] ?? status;
    }

    actionSeverity(status: string): 'success' | 'secondary' | 'danger' | 'info' {
        return status === 'CONFIRMED' ? 'success' : status === 'FAILED' ? 'danger' : 'secondary';
    }

    async exportTable(table: ChatTable) {
        const XLSX = await import('xlsx');
        const sheet = XLSX.utils.aoa_to_sheet([table.columnas, ...table.filas]);
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, sheet, 'Datos');
        const name = table.titulo.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 60) || 'tabla';
        XLSX.writeFile(book, `${name}.xlsx`);
    }

    isNumber(value: unknown): boolean {
        return typeof value === 'number';
    }

    formatCell(value: unknown): string {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value.toLocaleString('es-AR', { maximumFractionDigits: 2 });
        return String(value);
    }

    callInput(call: ToolCall): string {
        return call.input?.sql ?? JSON.stringify(call.input);
    }
}

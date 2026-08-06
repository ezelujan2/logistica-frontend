import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { AssistantChatType, AssistantMessage, AssistantService, ConversationSummary } from '../../service/assistant.service';

marked.setOptions({ breaks: true });

interface ChatBubble {
    role: 'user' | 'assistant';
    text: string;
    html: SafeHtml;
    toolCalls?: { name: string; input: any; result: string }[];
    showTools?: boolean;
    costUsd?: number;
}

@Component({
    selector: 'app-assistant-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CardModule, ToastModule, TableModule, TooltipModule, SelectModule],
    providers: [MessageService],
    template: `
        <div class="card flex flex-col h-[75vh]">
            <p-toast></p-toast>
            <div class="flex items-center justify-between gap-2 mb-4">
                <div class="font-semibold text-xl">{{ title }}</div>
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
                    <p-button label="Nueva conversación" icon="pi pi-plus" [text]="true" (click)="newConversation()" />
                </div>
            </div>

            <div #scrollArea class="flex-1 overflow-y-auto flex flex-col gap-3 p-2">
                <div *ngFor="let bubble of bubbles" class="flex" [ngClass]="bubble.role === 'user' ? 'justify-end' : 'justify-start'">
                    <div class="max-w-[75%] rounded-xl px-4 py-2" [ngClass]="bubble.role === 'user' ? 'bg-primary text-primary-contrast' : 'bg-surface-100 dark:bg-surface-800'">
                        <div class="prose-sm max-w-none" [innerHTML]="bubble.html"></div>

                        <div *ngIf="bubble.toolCalls?.length" class="mt-1">
                            <button
                                type="button"
                                class="text-xs text-muted-color flex items-center gap-1 opacity-70 hover:opacity-100"
                                (click)="bubble.showTools = !bubble.showTools"
                            >
                                <i class="pi" [ngClass]="bubble.showTools ? 'pi-chevron-down' : 'pi-wrench'"></i>
                                {{ bubble.showTools ? 'Ocultar detalle técnico' : 'Ver herramientas usadas (' + bubble.toolCalls!.length + ')' }}
                            </button>
                            <p-table *ngIf="bubble.showTools" [value]="bubble.toolCalls!" styleClass="mt-2 text-xs" [rows]="10">
                                <ng-template pTemplate="header">
                                    <tr><th>Herramienta</th><th>Resultado</th></tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-call>
                                    <tr><td>{{ call.name }}</td><td class="max-w-[300px] truncate" [pTooltip]="call.result">{{ call.result }}</td></tr>
                                </ng-template>
                            </p-table>
                        </div>
                        <div *ngIf="bubble.costUsd" class="text-xs text-muted-color opacity-60 mt-1">~\${{ bubble.costUsd.toFixed(3) }}</div>
                    </div>
                </div>
                <div *ngIf="loading" class="text-sm text-muted-color">Pensando...</div>
            </div>

            <div class="flex gap-2 items-center mt-4">
                <ng-container *ngIf="allowFileUpload">
                    <input type="file" #fileInput accept=".pdf,.jpg,.jpeg,.png" class="hidden" (change)="onFileSelected($event)" />
                    <p-button icon="pi pi-paperclip" [text]="true" (click)="fileInput.click()" [severity]="selectedFile ? 'success' : 'secondary'" [pTooltip]="selectedFile?.name || 'Adjuntar PDF'" />
                </ng-container>
                <input type="text" pInputText class="flex-1" [placeholder]="inputPlaceholder" [(ngModel)]="draft" (keyup.enter)="send()" [disabled]="loading" />
                <p-button label="Enviar" icon="pi pi-send" (click)="send()" [loading]="loading" [disabled]="!draft.trim() && !selectedFile" />
            </div>
        </div>
    `
})
export class AssistantChat implements OnInit, AfterViewChecked {
    @Input() chatType: AssistantChatType = 'assistant';
    @Input() title = 'Asistente';
    @Input() allowFileUpload = false;
    @ViewChild('scrollArea') scrollArea?: ElementRef<HTMLDivElement>;

    bubbles: ChatBubble[] = [];
    draft = '';
    loading = false;
    selectedFile: File | null = null;
    conversations: ConversationSummary[] = [];
    activeConversationId: number | null = null;
    private shouldScroll = false;

    get inputPlaceholder(): string {
        return this.chatType === 'analyst'
            ? 'Ej: ¿cuál fue el margen promedio con el cliente X en julio?'
            : 'Ej: servicios del cliente X en agosto, o el chofer del viaje #123';
    }

    constructor(private assistantService: AssistantService, private messageService: MessageService, private sanitizer: DomSanitizer) {}

    ngOnInit() {
        this.showWelcome();
        this.loadConversations();
    }

    private showWelcome() {
        this.pushBubble(
            'assistant',
            this.chatType === 'analyst'
                ? 'Preguntame lo que necesites saber sobre márgenes, promedios o tiempos de pago.'
                : 'Preguntame por servicios, o subí un PDF (orden de compra) y busco a qué servicio corresponde.'
        );
    }

    private async loadConversations() {
        try {
            this.conversations = await this.assistantService.getConversations(this.chatType);
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
            const conversation = await this.assistantService.getConversation(this.chatType, id);
            this.activeConversationId = conversation.id;
            this.bubbles = conversation.messages.map((m) => this.toBubble(m.role, m.content, m.toolCalls ?? undefined));
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

    private toBubble(role: 'user' | 'assistant', text: string, toolCalls?: { name: string; input: any; result: string }[], costUsd?: number): ChatBubble {
        const rawHtml = marked.parse(text, { async: false }) as string;
        const safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, rawHtml) ?? '';
        return { role, text, html: this.sanitizer.bypassSecurityTrustHtml(safeHtml), toolCalls, costUsd };
    }

    ngAfterViewChecked() {
        if (this.shouldScroll && this.scrollArea) {
            this.scrollArea.nativeElement.scrollTop = this.scrollArea.nativeElement.scrollHeight;
            this.shouldScroll = false;
        }
    }

    private pushBubble(role: 'user' | 'assistant', text: string, toolCalls?: { name: string; input: any; result: string }[], costUsd?: number) {
        this.bubbles.push(this.toBubble(role, text, toolCalls, costUsd));
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        this.selectedFile = input.files?.[0] ?? null;
    }

    async send() {
        if (!this.draft.trim() && !this.selectedFile) return;

        const userText = this.draft.trim() || `[Documento adjunto: ${this.selectedFile?.name}]`;
        this.pushBubble('user', userText);
        this.shouldScroll = true;

        const history: AssistantMessage[] = this.bubbles
            .filter((b) => !b.toolCalls || b.role === 'user')
            .map((b) => ({ role: b.role, content: b.text }));

        const file = this.selectedFile ?? undefined;
        this.draft = '';
        this.selectedFile = null;
        this.loading = true;

        try {
            const result = await this.assistantService.sendMessage(this.chatType, history, file, this.activeConversationId ?? undefined);
            this.pushBubble('assistant', result.reply, result.toolCalls, result.costUsd);
            const isNewConversation = this.activeConversationId === null;
            this.activeConversationId = result.conversationId;
            if (isNewConversation) this.loadConversations();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar la consulta' });
            this.pushBubble('assistant', 'Uh, tuve un problema para responder. Probá de nuevo.');
        } finally {
            this.loading = false;
            this.shouldScroll = true;
        }
    }
}

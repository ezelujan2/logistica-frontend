import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ToolCall {
    name: string;
    input: any;
    result: string;
}

/** Una fila de una carga por lotes (CREATE_SERVICES), tal como la armó el backend. */
export interface BatchRow {
    inicio: string;
    fin: string;
    origen: string;
    destino: string;
    pasajeros: string | null;
    detalle: string;
    choferId: number | null;
    chofer: string | null;
    vehiculo: string | null;
    km: number | null;
    incluir: boolean;
    duplicadoDe: number | null;
    aviso: string | null;
}

export interface AssistantAction {
    id: number;
    type?: string;
    payload?: any;
    summary: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
    result: string | null;
}

export interface AssistantReply {
    reply: string;
    toolCalls: ToolCall[];
    actions: AssistantAction[];
    conversationId: number;
    costUsd: number;
}

export interface ConversationSummary {
    id: number;
    title: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationDetail extends ConversationSummary {
    messages: {
        id: number;
        role: 'user' | 'assistant';
        content: string;
        toolCalls: ToolCall[] | null;
        createdAt: string;
    }[];
    pendingActions: AssistantAction[];
}

export interface UnansweredQuery {
    id: number;
    question: string;
    reason: string | null;
    resolved: boolean;
    createdAt: string;
    user: { id: number; name: string | null; email: string } | null;
}

export interface AssistantUsage {
    chatType: 'ASISTENTE' | 'ANALISTA';
    _sum: { estimatedCostUsd: string | null; inputTokens: number | null; outputTokens: number | null };
}

@Injectable({
    providedIn: 'root'
})
export class AssistantService {
    private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {}

    /**
     * Manda un mensaje y va avisando el avance (`onProgress`) mientras el
     * asistente trabaja. El backend responde con Server-Sent Events, que
     * HttpClient no sabe leer de a partes, por eso va con fetch.
     */
    async sendMessage(message: string, files: File[], conversationId: number | null, onProgress: (text: string) => void): Promise<AssistantReply> {
        const form = new FormData();
        form.append('message', message);
        if (conversationId) form.append('conversationId', String(conversationId));
        for (const file of files) form.append('files', file);

        const token = this.authService.getToken();
        const response = await fetch(`${this.apiUrl}assistant/message`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: form
        });
        if (!response.ok || !response.body) {
            if (response.status === 401) throw new Error('Tu sesión venció. Volvé a iniciar sesión.');
            const data = await response.json().catch(() => null);
            throw new Error(data?.error ?? 'No se pudo procesar la consulta');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let cut: number;
            while ((cut = buffer.indexOf('\n\n')) >= 0) {
                const chunk = buffer.slice(0, cut);
                buffer = buffer.slice(cut + 2);
                const line = chunk.split('\n').find((l) => l.startsWith('data: '));
                if (!line) continue; // los comentarios ": ping" mantienen viva la conexión
                const event = JSON.parse(line.slice(6));
                if (event.type === 'progress') onProgress(event.text);
                else if (event.type === 'done') return event as AssistantReply;
                else if (event.type === 'error') throw new Error(event.error);
            }
        }
        throw new Error('La conexión se cortó antes de terminar. Probá de nuevo.');
    }

    async confirmAction(id: number, edits?: { filas: { incluir: boolean; choferId: number | null }[] }): Promise<AssistantAction> {
        return await firstValueFrom(this.http.post<AssistantAction>(`${this.apiUrl}assistant/actions/${id}/confirm`, edits ?? {}));
    }

    async cancelAction(id: number): Promise<AssistantAction> {
        return await firstValueFrom(this.http.post<AssistantAction>(`${this.apiUrl}assistant/actions/${id}/cancel`, {}));
    }

    async getConversations(): Promise<ConversationSummary[]> {
        return await firstValueFrom(this.http.get<ConversationSummary[]>(`${this.apiUrl}assistant/conversations`));
    }

    async getConversation(id: number): Promise<ConversationDetail> {
        return await firstValueFrom(this.http.get<ConversationDetail>(`${this.apiUrl}assistant/conversations/${id}`));
    }

    async deleteConversation(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}assistant/conversations/${id}`));
    }

    async getUnanswered(): Promise<UnansweredQuery[]> {
        return await firstValueFrom(this.http.get<UnansweredQuery[]>(`${this.apiUrl}assistant/unanswered`));
    }

    async resolveUnanswered(id: number): Promise<UnansweredQuery> {
        return await firstValueFrom(this.http.patch<UnansweredQuery>(`${this.apiUrl}assistant/unanswered/${id}`, {}));
    }

    async getUsage(): Promise<AssistantUsage[]> {
        return await firstValueFrom(this.http.get<AssistantUsage[]>(`${this.apiUrl}assistant/usage`));
    }
}

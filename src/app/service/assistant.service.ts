import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export type AssistantChatType = 'assistant' | 'analyst';

export interface AssistantMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AssistantReply {
    reply: string;
    toolCalls: { name: string; input: any; result: string }[];
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
        toolCalls: { name: string; input: any; result: string }[] | null;
        createdAt: string;
    }[];
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

    constructor(private http: HttpClient) {}

    async sendMessage(chatType: AssistantChatType, messages: AssistantMessage[], file?: File, conversationId?: number): Promise<AssistantReply> {
        const url = `${this.apiUrl}${chatType}/message`;

        if (chatType === 'assistant' && file) {
            const formData = new FormData();
            formData.append('messages', JSON.stringify(messages));
            formData.append('file', file);
            if (conversationId) formData.append('conversationId', String(conversationId));
            return await firstValueFrom(this.http.post<AssistantReply>(url, formData));
        }

        return await firstValueFrom(this.http.post<AssistantReply>(url, { messages, conversationId }));
    }

    async getConversations(chatType: AssistantChatType): Promise<ConversationSummary[]> {
        return await firstValueFrom(this.http.get<ConversationSummary[]>(`${this.apiUrl}${chatType}/conversations`));
    }

    async getConversation(chatType: AssistantChatType, id: number): Promise<ConversationDetail> {
        return await firstValueFrom(this.http.get<ConversationDetail>(`${this.apiUrl}${chatType}/conversations/${id}`));
    }

    async deleteConversation(chatType: AssistantChatType, id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}${chatType}/conversations/${id}`));
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

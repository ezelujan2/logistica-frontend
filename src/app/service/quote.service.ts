import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QuoteItem {
    id?: number;
    serviceType: string;
    origin?: string;
    destination?: string;
    estimatedKm: number;
    estimatedHours: number;
    kmPrice: number;
    hourPrice: number;
    extraKmPrice: number;
    subtotal?: number;
    taxAmount?: number;
    total?: number;
    notes?: string;
    order?: number;
}

export interface Quote {
    id?: number;
    code?: string;
    clientId?: number | null;
    client?: any;
    contactName: string;
    contactPhone?: string;
    contactEmail?: string;
    status?: string;
    validUntil?: Date | string | null;
    discount?: number;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    notes?: string;
    internalNotes?: string;
    publicToken?: string;
    sentAt?: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
    acceptedByName?: string;
    rejectionReason?: string;
    pdfUrl?: string;
    items?: QuoteItem[];
    convertedServices?: any[];
    createdBy?: any;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface QuoteTemplate {
    id?: number;
    name: string;
    clientId?: number | null;
    client?: any;
    serviceType: string;
    origin?: string;
    destination?: string;
    estimatedKm: number;
    estimatedHours: number;
    kmPrice: number;
    hourPrice: number;
    extraKmPrice: number;
    notes?: string;
    isFavorite: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class QuoteService {
    private apiUrl = environment.apiUrl + 'quotes';

    constructor(private http: HttpClient) {}

    async getQuotes(filters?: { status?: string; clientId?: number }): Promise<Quote[]> {
        let params: any = {};
        if (filters?.status) params.status = filters.status;
        if (filters?.clientId) params.clientId = filters.clientId;
        return await firstValueFrom(this.http.get<Quote[]>(this.apiUrl, { params }));
    }

    async getQuoteById(id: number): Promise<Quote> {
        return await firstValueFrom(this.http.get<Quote>(`${this.apiUrl}/${id}`));
    }

    async createQuote(quote: any): Promise<Quote> {
        return await firstValueFrom(this.http.post<Quote>(this.apiUrl, quote));
    }

    async createQuickQuote(data: any): Promise<Quote> {
        return await firstValueFrom(this.http.post<Quote>(`${this.apiUrl}/quick`, data));
    }

    async updateQuote(id: number, quote: any): Promise<Quote> {
        return await firstValueFrom(this.http.put<Quote>(`${this.apiUrl}/${id}`, quote));
    }

    async deleteQuote(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    }

    async sendQuote(id: number): Promise<Quote> {
        return await firstValueFrom(this.http.post<Quote>(`${this.apiUrl}/${id}/send`, {}));
    }

    async acceptQuote(id: number): Promise<Quote> {
        return await firstValueFrom(this.http.post<Quote>(`${this.apiUrl}/${id}/accept`, {}));
    }

    async rejectQuote(id: number, reason?: string): Promise<Quote> {
        return await firstValueFrom(this.http.post<Quote>(`${this.apiUrl}/${id}/reject`, { reason }));
    }

    async convertToServices(id: number): Promise<any> {
        return await firstValueFrom(this.http.post<any>(`${this.apiUrl}/${id}/convert`, {}));
    }

    async duplicateQuote(id: number): Promise<Quote> {
        return await firstValueFrom(this.http.post<Quote>(`${this.apiUrl}/${id}/duplicate`, {}));
    }

    async getQuotePdf(id: number): Promise<any> {
        return await firstValueFrom(this.http.get<any>(`${this.apiUrl}/${id}/pdf`));
    }

    // Templates
    async getTemplates(): Promise<QuoteTemplate[]> {
        return await firstValueFrom(this.http.get<QuoteTemplate[]>(`${this.apiUrl}/templates`));
    }

    async createTemplate(template: any): Promise<QuoteTemplate> {
        return await firstValueFrom(this.http.post<QuoteTemplate>(`${this.apiUrl}/templates`, template));
    }

    async updateTemplate(id: number, template: any): Promise<QuoteTemplate> {
        return await firstValueFrom(this.http.put<QuoteTemplate>(`${this.apiUrl}/templates/${id}`, template));
    }

    async deleteTemplate(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/templates/${id}`));
    }

    // Public
    async getPublicQuote(token: string): Promise<Quote> {
        return await firstValueFrom(this.http.get<Quote>(`${this.apiUrl}/public/${token}`));
    }

    async acceptPublicQuote(token: string, name: string): Promise<any> {
        return await firstValueFrom(this.http.post<any>(`${this.apiUrl}/public/${token}/accept`, { name }));
    }

    async rejectPublicQuote(token: string, reason?: string): Promise<any> {
        return await firstValueFrom(this.http.post<any>(`${this.apiUrl}/public/${token}/reject`, { reason }));
    }
}

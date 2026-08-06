import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentReminder {
    id?: number;
    type: string;
    expirationDate: string | Date;
    alertDaysBefore: number;
    notes?: string | null;
    notified?: boolean;
    vehicleId?: number | null;
    driverId?: number | null;
    vehicle?: { id: number; plate: string } | null;
    driver?: { id: number; name: string } | null;
}

export interface DocumentReminderHistoryEntry {
    id: number;
    type: string;
    previousExpiration: string | null;
    newExpiration: string | null;
    createdAt: string;
    vehicle?: { id: number; plate: string } | null;
    driver?: { id: number; name: string } | null;
    user?: { id: number; name: string | null; email: string } | null;
}

@Injectable({ providedIn: 'root' })
export class ReminderService {
    private apiUrl = environment.apiUrl + 'reminders';

    constructor(private http: HttpClient) {}

    async getReminders(): Promise<DocumentReminder[]> {
        return await firstValueFrom(this.http.get<DocumentReminder[]>(this.apiUrl));
    }

    async createReminder(reminder: DocumentReminder): Promise<DocumentReminder> {
        return await firstValueFrom(this.http.post<DocumentReminder>(this.apiUrl, reminder));
    }

    async updateReminder(id: number, reminder: DocumentReminder): Promise<DocumentReminder> {
        return await firstValueFrom(this.http.put<DocumentReminder>(`${this.apiUrl}/${id}`, reminder));
    }

    async deleteReminder(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    }

    async getHistory(filters?: { type?: string; vehicleId?: number; driverId?: number }): Promise<DocumentReminderHistoryEntry[]> {
        let params = new HttpParams();
        if (filters?.type) params = params.set('type', filters.type);
        if (filters?.vehicleId) params = params.set('vehicleId', filters.vehicleId);
        if (filters?.driverId) params = params.set('driverId', filters.driverId);
        return await firstValueFrom(this.http.get<DocumentReminderHistoryEntry[]>(`${this.apiUrl}/history`, { params }));
    }
}

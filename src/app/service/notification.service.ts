import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppNotification {
    id: string;
    type: 'reminder' | 'unanswered' | 'security';
    severity: 'info' | 'warn' | 'danger';
    title: string;
    detail: string;
    link: string;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private apiUrl = environment.apiUrl + 'notifications';

    constructor(private http: HttpClient) {}

    async getNotifications(): Promise<AppNotification[]> {
        return await firstValueFrom(this.http.get<AppNotification[]>(this.apiUrl));
    }
}

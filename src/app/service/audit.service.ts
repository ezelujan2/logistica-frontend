import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AuditLog {
    id: number;
    entity: string;
    entityId: number;
    action: string;
    oldData?: any;
    newData?: any;
    userId?: number;
    createdAt: string;
    user?: {
        name: string;
        email: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getAudits() {
        return this.http.get<AuditLog[]>(`${this.apiUrl}audits`).toPromise();
    }
}

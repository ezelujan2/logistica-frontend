import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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

export interface AuditFilters {
    from?: string | null;
    to?: string | null;
    userId?: number | 'system' | null;
    entity?: string | null;
    action?: string | null;
    entityId?: number | null;
}

export interface AuditPage {
    items: AuditLog[];
    /** Cuántos hay con esos filtros; si pasa de limit, sólo vienen los últimos. */
    total: number;
    limit: number;
}

export interface AuditOptions {
    entities: string[];
    actions: string[];
    users: { id: number; name: string }[];
}

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    /** Fechas en AAAA-MM-DD; userId puede ser "system" (lo que hizo el sistema). */
    getAudits(filters: AuditFilters = {}) {
        const params: Record<string, string> = {};
        for (const [k, v] of Object.entries(filters)) if (v !== null && v !== undefined && v !== '') params[k] = String(v);
        return firstValueFrom(this.http.get<AuditPage>(`${this.apiUrl}audits`, { params }));
    }

    getOptions() {
        return firstValueFrom(this.http.get<AuditOptions>(`${this.apiUrl}audits/options`));
    }
}

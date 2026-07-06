import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentRecord {
    id?: number;
    type: string;
    description?: string;
    expiryDate: Date | string;
    fileUrl?: string;
    notes?: string;
    alertSent30?: boolean;
    alertSent15?: boolean;
    alertSent7?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    // Enriched fields from expiring endpoint
    entityType?: 'driver' | 'vehicle';
    entityName?: string;
    entityId?: number;
    isExpired?: boolean;
    daysUntilExpiry?: number;
    driver?: any;
    vehicle?: any;
}

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private apiUrl = environment.apiUrl + 'documents';

    constructor(private http: HttpClient) {}

    async getDriverDocuments(driverId: number): Promise<DocumentRecord[]> {
        return await firstValueFrom(this.http.get<DocumentRecord[]>(`${this.apiUrl}/drivers/${driverId}`));
    }

    async createDriverDocument(driverId: number, doc: any): Promise<DocumentRecord> {
        return await firstValueFrom(this.http.post<DocumentRecord>(`${this.apiUrl}/drivers/${driverId}`, doc));
    }

    async getVehicleDocuments(vehicleId: number): Promise<DocumentRecord[]> {
        return await firstValueFrom(this.http.get<DocumentRecord[]>(`${this.apiUrl}/vehicles/${vehicleId}`));
    }

    async createVehicleDocument(vehicleId: number, doc: any): Promise<DocumentRecord> {
        return await firstValueFrom(this.http.post<DocumentRecord>(`${this.apiUrl}/vehicles/${vehicleId}`, doc));
    }

    async updateDocument(id: number, doc: any, entityType: string = 'driver'): Promise<DocumentRecord> {
        return await firstValueFrom(this.http.put<DocumentRecord>(`${this.apiUrl}/${id}?entityType=${entityType}`, doc));
    }

    async deleteDocument(id: number, entityType: string = 'driver'): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}?entityType=${entityType}`));
    }

    async getExpiringDocuments(days: number = 30): Promise<DocumentRecord[]> {
        return await firstValueFrom(this.http.get<DocumentRecord[]>(`${this.apiUrl}/expiring?days=${days}`));
    }

    async getExpiredDocuments(): Promise<any> {
        return await firstValueFrom(this.http.get<any>(`${this.apiUrl}/expired`));
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Service {
    id?: number;
    startDate: Date;
    endDate?: Date;
    serviceType: string;
    origin: string;
    destination: string;
    details?: string;
    kmTraveled?: number;
    waitingHours?: number;
    kmPriceOverride?: number;
    hourPriceOverride?: number;
    driverKmPriceOverride?: number;
    driverHourPriceOverride?: number;
    discountPercentage?: number;

    // Backend Consistency
    total_amount?: number;
    totalAmount?: number;

    status: string;
    billingType: string;

    // Relations
    clientIds: number[];
    driverIds: number[];
    vehicleIds: number[];

    expenses?: any[];
    serviceGroup?: any;
    serviceGroupId?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ServiceService {
    private apiUrl = environment.apiUrl + 'services';

    constructor(private http: HttpClient) {}

    async getServices(filters: any = {}): Promise<Service[]> {
        return await firstValueFrom(this.http.get<Service[]>(this.apiUrl, { params: filters }));
    }

    async createService(service: any): Promise<Service> {
        return await firstValueFrom(this.http.post<Service>(this.apiUrl, service));
    }

    async updateService(id: number, service: any): Promise<Service> {
        return await firstValueFrom(this.http.put<Service>(`${this.apiUrl}/${id}`, service));
    }

    async deleteService(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    }

    async createGroup(serviceIds: number[], clientId: number) {
        return firstValueFrom(this.http.post<any>(environment.apiUrl + 'groups', { serviceIds, clientId }));
    }

    async getGroups(params?: any) {
        return firstValueFrom(this.http.get<any[]>(environment.apiUrl + 'groups', { params }));
    }

    async updateGroupStatus(id: number, status: string) {
        return firstValueFrom(this.http.patch(environment.apiUrl + 'groups/' + id + '/status', { status }));
    }
}

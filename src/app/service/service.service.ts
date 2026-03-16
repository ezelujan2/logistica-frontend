import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { Client } from './client.service';
import { Driver } from './driver.service';
import { Vehicle } from './vehicle.service';
import { Expense } from './expense.service';

export interface ClientReimbursable {
  id?: number;
  description: string;
  amount: number;
  photoUrls?: string[];
  serviceId?: number;
}

export interface Service {
  id?: number;
  startDate: Date | string;
  endDate?: Date | string;

  serviceType: string;

  origin?: string;
  destination?: string;
  details?: string;

  // Pricing Overrides (Split Rates)
  kmPriceOverride?: number;
  hourPriceOverride?: number;
  driverKmPriceOverride?: number;
  driverHourPriceOverride?: number;

  kmTraveled?: number;
  waitingHours?: number;
  discountPercentage?: number;

  net_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  driver_amount?: number;
  status: string;

  billingType?: string;

  clients?: Client[];
  drivers?: Driver[];
  vehicles?: Vehicle[];

  clientIds?: number[];
  driverIds?: number[];
  vehicleIds?: number[];

  expenses?: Expense[];
  clientReimbursables?: ClientReimbursable[];

  serviceGroupId?: number;
  serviceGroup?: any; // Add typing later if needed

  invoiceId?: number;
  invoice?: { id: number; invoiceNumber: string; status?: string };
  invoiceNumber?: string; // Flattened for display/filtering

  clientNames?: string;
  driverNames?: string;

  // WhatsApp Notifications
  whatsappEnabled?: boolean;
  whatsappReminders?: { minutesBefore: number }[];
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

    async createBulkServices(services: any[]): Promise<any> {
        return await firstValueFrom(this.http.post<any>(`${this.apiUrl}/bulk`, { services }));
    }

    async updateService(id: number, service: any): Promise<Service> {
        return await firstValueFrom(this.http.put<Service>(`${this.apiUrl}/${id}`, service));
    }

    async deleteService(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    }

    async createGroup(serviceIds: number[], clientId: number, notes?: string) {
        return firstValueFrom(this.http.post<any>(environment.apiUrl + 'groups', { serviceIds, clientId, notes }));
    }

    async getGroups(params?: any) {
        return firstValueFrom(this.http.get<any[]>(environment.apiUrl + 'groups', { params }));
    }

    async updateGroupStatus(id: number, status: string) {
        return firstValueFrom(this.http.patch(environment.apiUrl + 'groups/' + id + '/status', { status }));
    }

    async updateGroupNotes(id: number, notes: string) {
        return firstValueFrom(this.http.patch(environment.apiUrl + 'groups/' + id, { notes }));
    }
}

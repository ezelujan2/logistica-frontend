import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface PassengerModel {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  clients?: { id: number; name: string }[];
}

export interface ServiceTemplateModel {
  id: number;
  name: string;
  origin: string;
  destination: string;
  serviceType: string;
  deadlineType: 'NONE' | 'WEEKLY' | 'MONTHLY';
  deadlineDay?: number;
  deadlineHour: number;
  deadlineMinute: number;
  isActive: boolean;
  clientId: number;
  client?: { id: number; name: string };
  configurationId?: number;
  configuration?: { id: number; name: string; kmPrice?: number; hourPrice?: number };
}

export interface ServiceRequestItemModel {
  id?: number;
  date: string;
  origin: string;
  destination: string;
  notes?: string;
  passengerId?: number;
  passenger?: { id: number; name: string; phone?: string };
  serviceId?: number;
  service?: { id: number; status: string };
}

export interface ServiceRequestModel {
  id: number;
  type: 'WEEKLY_BATCH' | 'ON_DEMAND';
  status: 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';
  isLate: boolean;
  adminPrice?: number;
  adminNotes?: string;
  clientId: number;
  client?: { id: number; name: string; email?: string };
  templateId?: number;
  template?: ServiceTemplateModel;
  items: ServiceRequestItemModel[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ServiceRequestService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Passengers
  getPassengers(clientId?: number) {
    const params = clientId ? `?clientId=${clientId}` : '';
    return this.http.get<PassengerModel[]>(`${this.api}passengers${params}`);
  }
  createPassenger(data: Partial<PassengerModel> & { clientIds?: number[] }) {
    return this.http.post<PassengerModel>(`${this.api}passengers`, data);
  }
  updatePassenger(id: number, data: Partial<PassengerModel> & { clientIds?: number[] }) {
    return this.http.put<PassengerModel>(`${this.api}passengers/${id}`, data);
  }
  deletePassenger(id: number) {
    return this.http.delete(`${this.api}passengers/${id}`);
  }

  // Templates
  getTemplates(clientId?: number) {
    const params = clientId ? `?clientId=${clientId}` : '';
    return this.http.get<ServiceTemplateModel[]>(`${this.api}service-templates${params}`);
  }
  createTemplate(data: Partial<ServiceTemplateModel>) {
    return this.http.post<ServiceTemplateModel>(`${this.api}service-templates`, data);
  }
  updateTemplate(id: number, data: Partial<ServiceTemplateModel>) {
    return this.http.put<ServiceTemplateModel>(`${this.api}service-templates/${id}`, data);
  }
  deleteTemplate(id: number) {
    return this.http.delete(`${this.api}service-templates/${id}`);
  }

  // Requests
  getRequests(params?: { clientId?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.clientId) q.set('clientId', String(params.clientId));
    if (params?.status)   q.set('status', params.status);
    return this.http.get<ServiceRequestModel[]>(`${this.api}service-requests?${q}`);
  }
  getRequest(id: number) {
    return this.http.get<ServiceRequestModel>(`${this.api}service-requests/${id}`);
  }
  createRequest(data: {
    type: string;
    clientId?: number;
    templateId?: number;
    items: Partial<ServiceRequestItemModel>[];
  }) {
    return this.http.post<ServiceRequestModel>(`${this.api}service-requests`, data);
  }
  confirmRequest(id: number, adminPrice?: number, adminNotes?: string) {
    return this.http.post<ServiceRequestModel>(`${this.api}service-requests/${id}/confirm`, { adminPrice, adminNotes });
  }
  rejectRequest(id: number, adminNotes?: string) {
    return this.http.post<ServiceRequestModel>(`${this.api}service-requests/${id}/reject`, { adminNotes });
  }

  // Users
  getUsers() {
    return this.http.get<any[]>(`${this.api}users`);
  }
  createUser(data: any) {
    return this.http.post<any>(`${this.api}users`, data);
  }
  updateUser(id: number, data: any) {
    return this.http.put<any>(`${this.api}users/${id}`, data);
  }
  deleteUser(id: number) {
    return this.http.delete(`${this.api}users/${id}`);
  }
  resetPassword(id: number, password: string) {
    return this.http.post(`${this.api}users/${id}/reset-password`, { password });
  }
}

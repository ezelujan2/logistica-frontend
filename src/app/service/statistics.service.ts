import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface ClientDetailStats {
  client: { id: number; name: string; createdAt: string };
  totalServices: number;
  totalRevenue: number;
  totalProfit: number;
  totalFuelCost: number;
  revenueSharePercentage: number;
  avgTicket: number;
  totalKm: number;
  avgTripsPerMonth: number;
  firstServiceDate: string | null;
  lastServiceDate: string | null;
  serviceTypeBreakdown: { type: string; count: number; percentage: number }[];
  topDrivers: { name: string; trips: number; revenue: number }[];
  topVehicles: { label: string; trips: number; revenue: number }[];
  monthlyEvolution: { month: string; revenue: number }[];
  pendingAmount: number;
  pendingCount: number;
  administrativePendingAmount: number;
  administrativePendingCount: number;
  satisfaction: {
    responsesCount: number;
    avgOverall: number | null;
    avgDriver: number | null;
    nps: number | null;
  };
}

export interface VehicleDetailStats {
  vehicle: {
    id: number;
    plate: string;
    model: string;
    ownership: string;
    purchasePrice: number | null;
    purchaseDate: string | null;
  };
  totalServices: number;
  totalRevenue: number;
  totalDriverCost: number;
  totalVehicleExpenses: number;
  netResult: number;
  netResultPerMonth: number;
  totalKm: number;
  costPerKm: number;
  revenuePerKm: number;
  expenseBreakdown: { type: string; amount: number }[];
  monthsActive: number;
  firstServiceDate: string | null;
  lastServiceDate: string | null;
  roiPercentage: number | null;
  investmentRecoveredPercentage: number | null;
  monthsToBreakEven: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}statistics`;

  constructor(private http: HttpClient) {}

  private buildParams(year?: number, month?: number, serviceTypes?: string[], vehicleIds?: number[]) {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    if (serviceTypes && serviceTypes.length > 0) params.serviceTypes = serviceTypes.join(',');
    if (vehicleIds && vehicleIds.length > 0) params.vehicleIds = vehicleIds.join(',');
    return params;
  }

  getGeneralStats(year?: number, month?: number, serviceTypes?: string[], vehicleIds?: number[]) {
    const params = this.buildParams(year, month, serviceTypes, vehicleIds);
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/general`, { params }));
  }

  getDriverStats(year?: number, month?: number, serviceTypes?: string[], vehicleIds?: number[]) {
    const params = this.buildParams(year, month, serviceTypes, vehicleIds);
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/drivers`, { params }));
  }

  getClientStats(year?: number, month?: number, serviceTypes?: string[], vehicleIds?: number[]) {
    const params = this.buildParams(year, month, serviceTypes, vehicleIds);
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/clients`, { params }));
  }

  getMonthlyStats(year?: number, serviceTypes?: string[], vehicleIds?: number[]) {
    const params = this.buildParams(year, undefined, serviceTypes, vehicleIds);
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/monthly`, { params }));
  }

  getExpenseStats(year?: number, month?: number, serviceTypes?: string[], vehicleIds?: number[]) {
    const params = this.buildParams(year, month, serviceTypes, vehicleIds);
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/expenses`, { params }));
  }

  getVehicleStats(year?: number, month?: number, serviceTypes?: string[], vehicleIds?: number[]) {
    const params = this.buildParams(year, month, serviceTypes, vehicleIds);
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/vehicles`, { params }));
  }

  getReceivablesStats() {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/receivables`));
  }

  getVehicleDetailStats(vehicleId: number) {
    return firstValueFrom(this.http.get<VehicleDetailStats>(`${this.apiUrl}/vehicles/${vehicleId}`));
  }

  getClientDetailStats(clientId: number, year?: number, month?: number) {
    const params = this.buildParams(year, month);
    return firstValueFrom(this.http.get<ClientDetailStats>(`${this.apiUrl}/clients/${clientId}`, { params }));
  }
}

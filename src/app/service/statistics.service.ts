import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}statistics`;

  constructor(private http: HttpClient) {}

  getGeneralStats(year?: number, month?: number) {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/general`, { params }));
  }

  getDriverStats(year?: number, month?: number) {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/drivers`, { params }));
  }

  getClientStats(year?: number, month?: number) {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/clients`, { params }));
  }

  getMonthlyStats(year?: number) {
    const params: any = {};
    if (year) params.year = year;
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/monthly`, { params }));
  }
}

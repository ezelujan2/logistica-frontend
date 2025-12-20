import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SettlementService {
    private apiUrl = environment.apiUrl + 'settlements';

    constructor(private http: HttpClient) {}

    getSettlements(driverId?: number): Observable<any[]> {
        let params = new HttpParams();
        if (driverId) params = params.append('driverId', driverId);
        return this.http.get<any[]>(this.apiUrl, { params });
    }

    getPendingItems(driverId: number): Observable<any> {
        let params = new HttpParams().append('driverId', driverId);
        return this.http.get<any>(`${this.apiUrl}/pending`, { params });
    }

    createSettlement(payload: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, payload);
    }

    getSettlementById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }
}

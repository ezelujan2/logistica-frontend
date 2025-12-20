import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Advance {
    id?: number;
    driverId: number;
    driver?: any;
    amount: number;
    date: Date;
    description?: string;
    isDeducted?: boolean;
    settlementId?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AdvanceService {
    private apiUrl = environment.apiUrl + 'advances';

    constructor(private http: HttpClient) {}

    getAdvances(driverId?: number, isDeducted?: boolean): Observable<Advance[]> {
        let params = new HttpParams();
        if (driverId) params = params.append('driverId', driverId);
        if (isDeducted !== undefined) params = params.append('isDeducted', isDeducted);

        return this.http.get<Advance[]>(this.apiUrl, { params });
    }

    createAdvance(advance: any): Observable<Advance> {
        return this.http.post<Advance>(this.apiUrl, advance);
    }

    updateAdvance(id: number, advance: any): Observable<Advance> {
        return this.http.put<Advance>(`${this.apiUrl}/${id}`, advance);
    }

    deleteAdvance(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}

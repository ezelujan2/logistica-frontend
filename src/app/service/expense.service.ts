import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface Expense {
    id?: number;
    type: string;
    amount: number;
    description?: string;
    date?: Date;
    serviceId?: number;
    driverId?: number;
    vehicleId?: number;
    isDriverExpense?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {

    apiUrl = environment.apiUrl + 'expenses';

    constructor(private http: HttpClient) { }

    getExpenses(params?: any) {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.append(key, params[key]);
                }
            });
        }
        return this.http.get<any[]>(this.apiUrl, { params: httpParams });
    }

    createExpense(expense: any) {
        return this.http.post<any>(this.apiUrl, expense);
    }

    updateExpense(id: number, expense: any) {
        return this.http.put<any>(`${this.apiUrl}/${id}`, expense);
    }

    deleteExpense(id: number) {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MonthlyPoint {
    period: string; // "2026-11"
    value: number;
}

export interface Indicator {
    key: string;
    label: string;
    unit: 'price' | 'index';
    source: string;
    series: MonthlyPoint[];
    changes: { last: MonthlyPoint | null; month: number | null; yearToDate: number | null; twelveMonths: number | null };
    samples: number | null;
    scope: string | null;
    updatedAt: string | null;
}

export interface NewsItem {
    id: number;
    url: string;
    title: string;
    source: string | null;
    publishedAt: string;
    summary: string;
    category: string;
}

export interface NewsPage {
    market: Indicator[];
    news: NewsItem[];
    status: { lastRun: string | null; costMonthUsd: number; model: string; dailyLimitUsd: number };
    categories: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class NewsService {
    private apiUrl = environment.apiUrl + 'news';

    constructor(private http: HttpClient) {}

    getPage(days = 30) {
        return firstValueFrom(this.http.get<NewsPage>(this.apiUrl, { params: { days } }));
    }

    /** Sólo administradores: busca noticias (usa la IA) y actualiza los indicadores. */
    refresh() {
        return firstValueFrom(this.http.post<any>(`${this.apiUrl}/refresh`, {}));
    }
}

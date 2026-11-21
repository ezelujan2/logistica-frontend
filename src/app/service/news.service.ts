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
    /** Sólo en TARIFF_KM: si la tarifa mostrada es la favorita. */
    tariffIsFavorite?: boolean;
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
    /** `updating`: el servidor está buscando lo del día (primera visita del día). */
    status: { lastRun: string | null; costMonthUsd: number; model: string; dailyLimitUsd: number; updating?: boolean };
    categories: Record<string, string>;
    /** Tarifas para elegir cuál comparar; la favorita primero. */
    tariffs?: { id: number; name: string; isFavorite: boolean; kmPrice: number }[];
}

@Injectable({ providedIn: 'root' })
export class NewsService {
    private apiUrl = environment.apiUrl + 'news';

    constructor(private http: HttpClient) {}

    getPage(days = 30) {
        return firstValueFrom(this.http.get<NewsPage>(this.apiUrl, { params: { days } }));
    }

    /** Evolución del precio por km de una tarifa (el mismo formato que TARIFF_KM). */
    getTariff(id: number) {
        return firstValueFrom(this.http.get<Indicator>(`${this.apiUrl}/tariff/${id}`));
    }

    /** Sólo administradores: busca noticias (usa la IA) y actualiza los indicadores. */
    refresh() {
        return firstValueFrom(this.http.post<any>(`${this.apiUrl}/refresh`, {}));
    }
}

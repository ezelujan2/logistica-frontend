import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchResult {
    type: 'client' | 'driver' | 'vehicle' | 'service';
    id: number;
    title: string;
    subtitle: string;
    link: string;
    queryParams?: Record<string, string | number>;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
    private apiUrl = environment.apiUrl + 'search';

    constructor(private http: HttpClient) {}

    async search(query: string): Promise<SearchResult[]> {
        if (!query.trim()) return [];
        return await firstValueFrom(this.http.get<SearchResult[]>(this.apiUrl, { params: { q: query } }));
    }
}

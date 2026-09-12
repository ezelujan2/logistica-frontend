import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SurveyServiceContext {
  origin: string;
  destination: string;
  startDate: string;
}

export interface SurveyContext {
  services: SurveyServiceContext[];
  alreadyResponded: boolean;
}

export interface SurveySubmission {
  driverRating?: number | null;
  vehicleRating?: number | null;
  punctualityRating?: number | null;
  overallRating?: number | null;
  recommendScore?: number | null;
  comments?: string;
  suggestions?: string;
}

export interface SurveyResult {
  id: number;
  driverRating: number | null;
  vehicleRating: number | null;
  punctualityRating: number | null;
  overallRating: number | null;
  recommendScore: number | null;
  comments: string | null;
  suggestions: string | null;
  respondedAt: string;
  services: {
    id: number;
    origin: string;
    destination: string;
    startDate: string;
    clients: { id: number; name: string }[];
    drivers: { id: number; name: string }[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Authenticated — generates a new survey link for one or more services
  async generateSurvey(serviceIds: number[]): Promise<{ token: string }> {
    return await firstValueFrom(this.http.post<{ token: string }>(`${this.apiUrl}services/surveys/generate`, { serviceIds }));
  }

  async listSurveys(clientId?: number): Promise<SurveyResult[]> {
    const params: any = clientId ? { clientId } : {};
    return await firstValueFrom(this.http.get<SurveyResult[]>(`${this.apiUrl}services/surveys`, { params }));
  }

  // Authenticated — restricted to ADMIN (manageSurveys permission) on the backend
  async deleteSurvey(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}services/surveys/${id}`));
  }

  // Public — no auth needed, used from the client-facing survey page
  async getSurveyContext(token: string): Promise<SurveyContext> {
    return await firstValueFrom(this.http.get<SurveyContext>(`${this.apiUrl}surveys/${token}`));
  }

  async submitSurvey(token: string, data: SurveySubmission): Promise<{ ok: boolean }> {
    return await firstValueFrom(this.http.post<{ ok: boolean }>(`${this.apiUrl}surveys/${token}`, data));
  }
}

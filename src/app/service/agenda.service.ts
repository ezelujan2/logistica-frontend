import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type AgendaKind = 'VEHICLE' | 'DRIVER' | 'EVENT';

/** Un día (o varios) en que un auto o un chofer no está disponible, o un evento suelto. */
export interface AgendaEntry {
    id?: number;
    kind: AgendaKind;
    reason?: string | null;
    title?: string | null;
    startDate: string | Date;
    endDate: string | Date;
    allDay: boolean;
    notes?: string | null;
    vehicleId?: number | null;
    driverId?: number | null;
    serviceKm?: number | null;
    nextServiceKm?: number | null;
    vehicle?: { id: number; plate: string } | null;
    driver?: { id: number; name: string } | null;
    createdBy?: { name: string | null; email: string } | null;
}

/** Servicio que cae en los días que se cargaron en la agenda. */
export interface AffectedService {
    id: number;
    inicio: string;
    trayecto: string;
    cliente: string | null;
    reporte: string | null;
}

export interface AvailabilityWarning {
    type: 'agenda' | 'document';
    id: number;
    text: string;
    startDate: string;
    endDate: string;
    allDay: boolean;
    createdBy: string | null;
}

export interface UpcomingService {
    vehicleId: number;
    plate: string;
    lastServiceDate: string;
    lastServiceKm: number;
    nextServiceKm: number;
    estimatedKm: number;
    remainingKm: number;
}

export const VEHICLE_REASONS = ['Taller', 'Service', 'VTV', 'Otro'];

/** "AB123 · Taller", "Vivi · Trámite", o el título del evento. */
export function agendaLabel(e: AgendaEntry): string {
    if (e.kind === 'VEHICLE') return `${e.vehicle?.plate ?? 'Auto'} · ${e.reason || 'No disponible'}`;
    if (e.kind === 'DRIVER') return `${e.driver?.name ?? 'Chofer'} · ${e.reason || 'No disponible'}`;
    return e.title || 'Evento';
}

export function agendaIcon(kind: AgendaKind): string {
    return kind === 'VEHICLE' ? 'pi pi-wrench' : kind === 'DRIVER' ? 'pi pi-user-minus' : 'pi pi-bookmark';
}

@Injectable({ providedIn: 'root' })
export class AgendaService {
    private apiUrl = environment.apiUrl + 'agenda';

    constructor(private http: HttpClient) {}

    async list(from?: Date, to?: Date): Promise<AgendaEntry[]> {
        let params = new HttpParams();
        if (from) params = params.set('from', from.toISOString());
        if (to) params = params.set('to', to.toISOString());
        return await firstValueFrom(this.http.get<AgendaEntry[]>(this.apiUrl, { params }));
    }

    async create(entry: AgendaEntry): Promise<{ entry: AgendaEntry; affectedServices: AffectedService[] }> {
        return await firstValueFrom(this.http.post<{ entry: AgendaEntry; affectedServices: AffectedService[] }>(this.apiUrl, entry));
    }

    async update(id: number, entry: AgendaEntry): Promise<{ entry: AgendaEntry; affectedServices: AffectedService[] }> {
        return await firstValueFrom(this.http.put<{ entry: AgendaEntry; affectedServices: AffectedService[] }>(`${this.apiUrl}/${id}`, entry));
    }

    async remove(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    }

    async availability(start: Date, end: Date | null, driverIds: number[], vehicleIds: number[]): Promise<AvailabilityWarning[]> {
        let params = new HttpParams().set('start', start.toISOString());
        if (end) params = params.set('end', end.toISOString());
        if (driverIds.length) params = params.set('driverIds', driverIds.join(','));
        if (vehicleIds.length) params = params.set('vehicleIds', vehicleIds.join(','));
        return await firstValueFrom(this.http.get<AvailabilityWarning[]>(`${this.apiUrl}/availability`, { params }));
    }

    async upcomingServices(): Promise<UpcomingService[]> {
        return await firstValueFrom(this.http.get<UpcomingService[]>(`${this.apiUrl}/upcoming-services`));
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role } from './permissions';

export interface ManagedUser {
    id: number;
    email: string;
    name: string | null;
    role: Role;
    isBlocked: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface CreateUserPayload {
    email: string;
    password: string;
    name?: string;
    role: Role;
}

export interface UpdateUserPayload {
    name?: string;
    email?: string;
    role?: Role;
    isBlocked?: boolean;
    password?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private apiUrl = environment.apiUrl + 'users';

    constructor(private http: HttpClient) {}

    getUsers(): Observable<ManagedUser[]> {
        return this.http.get<ManagedUser[]>(this.apiUrl);
    }

    createUser(payload: CreateUserPayload): Observable<ManagedUser> {
        return this.http.post<ManagedUser>(this.apiUrl, payload);
    }

    updateUser(id: number, payload: UpdateUserPayload): Observable<ManagedUser> {
        return this.http.put<ManagedUser>(`${this.apiUrl}/${id}`, payload);
    }
}

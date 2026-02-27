import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactPayload {
  nom: string;
  prenom: string;
  email: string;
  sujet: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private apiUrl = '/api/contact'; // à adapter selon votre backend

  constructor(private http: HttpClient) {}

  send(payload: ContactPayload): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(this.apiUrl, payload);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Promotion,
  CreatePromotionDto,
  ValidateCodeDto,
  ValidateCodeResponse,
} from '../models/promotion.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PromotionService {
  private readonly baseUrl = `${environment.apiUrl}/promotions`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getActivePromotions(): Observable<{ success: boolean; promotions: Promotion[] }> {
    return this.http.get<{ success: boolean; promotions: Promotion[] }>(
      `${this.baseUrl}/active`
    );
  }

  createPromotion(
    dto: CreatePromotionDto
  ): Observable<{ success: boolean; promotion: Promotion }> {
    return this.http.post<{ success: boolean; promotion: Promotion }>(
      this.baseUrl,
      dto,
      { headers: this.getAuthHeaders() }
    );
  }

  validateCode(dto: ValidateCodeDto): Observable<ValidateCodeResponse> {
    return this.http.post<ValidateCodeResponse>(
      `${this.baseUrl}/validate`,
      dto,
      { headers: this.getAuthHeaders() }
    );
  }

  deletePromotion(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
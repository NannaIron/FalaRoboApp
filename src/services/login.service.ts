import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    email: string;
    username: string;
  };
  message?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private readonly MOCK_USER = {
    email: 'teste@teste.com',
    password: '123',
    id: 1,
    username: 'Teste'
  };

  private currentUser: User | null = null;
  private authToken: string | null = null;

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        if (credentials.email === this.MOCK_USER.email && 
            credentials.password === this.MOCK_USER.password) {
          
          const token = this.generateMockToken();
          const user: User = {
            id: this.MOCK_USER.id,
            email: this.MOCK_USER.email,
            username: this.MOCK_USER.username
          };

          this.currentUser = user;
          this.authToken = token;

          if (credentials.rememberMe) {
            this.saveUserToStorage(user, token);
          }

          const response: LoginResponse = {
            success: true,
            token: token,
            user: user,
            message: 'Login realizado com sucesso!'
          };

          observer.next(response);
          observer.complete();
        } else {
          const response: LoginResponse = {
            success: false,
            message: 'Email ou senha incorretos!'
          };

          observer.next(response);
          observer.complete();
        }
      }, 1000);
    });
  }

  logout(): void {
    this.currentUser = null;
    this.authToken = null;
    this.clearUserFromStorage();
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  private generateMockToken(): string {
    return 'dfhdhgjjkjhk867thuku76565e54sjkiuo76ytftr543';
  }

  private saveUserToStorage(user: User, token: string): void {
    localStorage.setItem('falarobo_user', JSON.stringify(user));
    localStorage.setItem('falarobo_token', token);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('falarobo_user');
    const token = localStorage.getItem('falarobo_token');

    if (userStr && token) {
      try {
        this.currentUser = JSON.parse(userStr);
        this.authToken = token;
      } catch (error) {
        this.clearUserFromStorage();
      }
    }
  }

  private clearUserFromStorage(): void {
    localStorage.removeItem('falarobo_user');
    localStorage.removeItem('falarobo_token');
  }
}

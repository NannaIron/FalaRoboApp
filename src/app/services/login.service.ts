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

  // Mock user data
  private readonly MOCK_USER = {
    email: 'teste@teste.com',
    password: '123',
    id: 1,
    username: 'Teste'
  };

  private currentUser: User | null = null;
  private authToken: string | null = null;

  constructor() {
    // Check if user is already logged in (from localStorage)
    this.loadUserFromStorage();
  }

  /**
   * Authenticate user with email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Simulate network delay
    return new Observable(observer => {
      setTimeout(() => {
        if (credentials.email === this.MOCK_USER.email && 
            credentials.password === this.MOCK_USER.password) {
          
          // Generate mock token
          const token = this.generateMockToken();
          const user: User = {
            id: this.MOCK_USER.id,
            email: this.MOCK_USER.email,
            username: this.MOCK_USER.username
          };

          // Store in service
          this.currentUser = user;
          this.authToken = token;

          // Store in localStorage if remember me is checked
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
      }, 1000); // Simulate 1 second delay
    });
  }

  /**
   * Logout user
   */
  logout(): void {
    this.currentUser = null;
    this.authToken = null;
    this.clearUserFromStorage();
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Generate a mock JWT token
   */
  private generateMockToken(): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      sub: this.MOCK_USER.id,
      email: this.MOCK_USER.email,
      username: this.MOCK_USER.username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa('mock-signature-' + Date.now());
    
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Save user data to localStorage
   */
  private saveUserToStorage(user: User, token: string): void {
    localStorage.setItem('falarobo_user', JSON.stringify(user));
    localStorage.setItem('falarobo_token', token);
  }

  /**
   * Load user data from localStorage
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('falarobo_user');
    const token = localStorage.getItem('falarobo_token');

    if (userStr && token) {
      try {
        this.currentUser = JSON.parse(userStr);
        this.authToken = token;
      } catch (error) {
        // Clear corrupted data
        this.clearUserFromStorage();
      }
    }
  }

  /**
   * Clear user data from localStorage
   */
  private clearUserFromStorage(): void {
    localStorage.removeItem('falarobo_user');
    localStorage.removeItem('falarobo_token');
  }
}

import { apiRequest } from "./queryClient";

const TOKEN_KEY = 'ic_pasta_admin_token';

export interface AdminUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

export class AuthService {
  private token: string | null = null;
  private user: AdminUser | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  async login(username: string, password: string): Promise<{ user: AdminUser; token: string }> {
    const response = await apiRequest('POST', '/api/auth/login', {
      username,
      password
    });

    // Handle direct response format { user, token }
    this.token = response.token;
    this.user = response.user;
    
    localStorage.setItem(TOKEN_KEY, this.token);
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await apiRequest('POST', '/api/auth/logout', {}, {
          'Authorization': `Bearer ${this.token}`
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.token = null;
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async verifyToken(): Promise<AdminUser | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await apiRequest('GET', '/api/auth/verify', undefined, {
        'Authorization': `Bearer ${this.token}`
      });
      
      this.user = response.user;
      return this.user;
    } catch (error) {
      console.warn('Token verification failed:', error);
      this.logout();
      return null;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AdminUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

export const authService = new AuthService();
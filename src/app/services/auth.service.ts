import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  username: string;
  nome: string;
  cognome: string;
  squadra_preferita: string;
  squadra_crest: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API = 'https://calciolive-backend.onrender.com/api';

  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);

  get user() { return this._user(); }
  get token() { return this._token(); }
  get isLoggedIn() { return !!this._token(); }

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('cl_token');
    const user = localStorage.getItem('cl_user');
    if (token && user) {
      this._token.set(token);
      this._user.set(JSON.parse(user));
    }
  }

  register(data: {
    email: string;
    password: string;
    username: string;
    nome: string;
    cognome: string;
    squadra_preferita: string;
  squadra_crest: string;
  }): Observable<any> {
    return this.http.post(`${this.API}/auth/register`, data).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.API}/auth/login`, { email, password }).pipe(
      tap((res: any) => { if (!res.requires_2fa) this.saveSession(res); })
    );
  }

  verifyOtp(email: string, code: string): Observable<any> {
    return this.http.post(`${this.API}/auth/verify-otp`, { email, code }).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  logout() {
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem('cl_token');
    localStorage.removeItem('cl_user');
  }

  updateProfile(nome: string, cognome: string, squadra_preferita: string, squadra_crest: string): Observable<any> {
    return this.http.put(`\${this.API}/auth/profile`,
      { nome, cognome, squadra_preferita, squadra_crest },
      { headers: { Authorization: `Bearer \${this._token()}` } }
    ).pipe(tap((res: any) => {
      this._user.set(res.user);
      localStorage.setItem('cl_user', JSON.stringify(res.user));
    }));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`\${this.API}/auth/password`,
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer \${this._token()}` } }
    );
  }

  private saveSession(res: any) {
    this._token.set(res.token);
    this._user.set(res.user);
    localStorage.setItem('cl_token', res.token);
    localStorage.setItem('cl_user', JSON.stringify(res.user));
  }
}
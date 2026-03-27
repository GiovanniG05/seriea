import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

type AuthTab = 'login' | 'register';

const LEAGUES = [
  { code: 'SA',  name: 'Serie A' },
  { code: 'PL',  name: 'Premier League' },
  { code: 'PD',  name: 'La Liga' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'FL1', name: 'Ligue 1' },
  { code: 'CL',  name: 'Champions League' },
];

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-overlay" (click)="close.emit()">
      <div class="auth-modal" (click)="$event.stopPropagation()">
        <button class="auth-close" (click)="close.emit()">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="auth-logo">Calcio<strong> Live</strong></div>

        <!-- TABS -->
        <div class="auth-tabs">
          <button class="auth-tab" [class.active]="tab==='login'" (click)="tab='login'; error=''">Accedi</button>
          <button class="auth-tab" [class.active]="tab==='register'" (click)="tab='register'; error=''">Registrati</button>
        </div>

        <!-- LOGIN -->
        <div class="auth-form" *ngIf="tab==='login' && !requires2fa">
          <div class="auth-field">
            <label>Email</label>
            <input type="email" [(ngModel)]="loginEmail" placeholder="la@tua.email" class="auth-input">
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input type="password" [(ngModel)]="loginPassword" placeholder="••••••••" class="auth-input" (keyup.enter)="doLogin()">
          </div>
          <div class="auth-error" *ngIf="error">{{ error }}</div>
          <button class="auth-submit" (click)="doLogin()" [disabled]="loading">
            <i class="fa-solid fa-circle-notch fa-spin" *ngIf="loading"></i>
            {{ loading ? 'Accesso…' : 'Accedi' }}
          </button>
          <div class="auth-switch">Non hai un account? <button (click)="tab='register'">Registrati</button></div>
        </div>

        <!-- OTP STEP -->
        <div class="auth-form" *ngIf="tab==='login' && requires2fa">
          <div class="auth-otp-info">
            <i class="fa-solid fa-envelope"></i>
            Abbiamo inviato un codice a <strong>{{ loginEmail }}</strong>
          </div>
          <div class="auth-field">
            <label>Codice di verifica</label>
            <input type="text" [(ngModel)]="otpCode" placeholder="000000" class="auth-input auth-otp-input" maxlength="6" (keyup.enter)="doVerifyOtp()">
          </div>
          <div class="auth-error" *ngIf="error">{{ error }}</div>
          <button class="auth-submit" (click)="doVerifyOtp()" [disabled]="loading">
            <i class="fa-solid fa-circle-notch fa-spin" *ngIf="loading"></i>
            {{ loading ? 'Verifica…' : 'Verifica codice' }}
          </button>
          <div class="auth-switch">
            Non hai ricevuto il codice? <button (click)="requires2fa=false; error=''">Riprova</button>
          </div>
        </div>

        <!-- REGISTER -->
        <div class="auth-form" *ngIf="tab==='register'">
          <div class="auth-row">
            <div class="auth-field">
              <label>Nome</label>
              <input type="text" [(ngModel)]="regNome" placeholder="Mario" class="auth-input">
            </div>
            <div class="auth-field">
              <label>Cognome</label>
              <input type="text" [(ngModel)]="regCognome" placeholder="Rossi" class="auth-input">
            </div>
          </div>
          <div class="auth-field">
            <label>Username</label>
            <input type="text" [(ngModel)]="regUsername" placeholder="mario_rossi" class="auth-input">
          </div>
          <div class="auth-field">
            <label>Email</label>
            <input type="email" [(ngModel)]="regEmail" placeholder="la@tua.email" class="auth-input">
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input type="password" [(ngModel)]="regPassword" placeholder="min. 6 caratteri" class="auth-input">
          </div>

          <!-- SQUADRA PREFERITA -->
          <div class="auth-field">
            <label>Campionato</label>
            <select class="auth-input auth-select" [(ngModel)]="selectedLeague" (ngModelChange)="onLeagueChange()">
              <option value="">Seleziona campionato…</option>
              <option *ngFor="let l of leagues" [value]="l.code">{{ l.name }}</option>
            </select>
          </div>
          <div class="auth-field" *ngIf="selectedLeague">
            <label>Squadra preferita</label>
            <div class="auth-teams-loading" *ngIf="teamsLoading">
              <i class="fa-solid fa-circle-notch fa-spin"></i> Caricamento squadre…
            </div>
            <select class="auth-input auth-select" [(ngModel)]="regSquadra" (ngModelChange)="onTeamChange($event)" *ngIf="!teamsLoading && teams.length">
              <option value="">Seleziona squadra…</option>
              <option *ngFor="let t of teams" [value]="t.name">
                {{ t.name }}
              </option>
            </select>
            <div class="auth-team-preview" *ngIf="regSquadra && regCrest">
              <img [src]="regCrest" class="auth-team-crest" (error)="onCrestError($event)">
              <span>{{ regSquadra }}</span>
            </div>
          </div>

          <div class="auth-error" *ngIf="error">{{ error }}</div>
          <button class="auth-submit" (click)="doRegister()" [disabled]="loading">
            <i class="fa-solid fa-circle-notch fa-spin" *ngIf="loading"></i>
            {{ loading ? 'Registrazione…' : 'Crea account' }}
          </button>
          <div class="auth-switch">Hai già un account? <button (click)="tab='login'">Accedi</button></div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .auth-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,.8); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn .2s ease; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .auth-modal { background:#0d1117; border:1px solid rgba(255,255,255,.1); border-radius:20px; padding:32px; width:100%; max-width:420px; position:relative; animation:slideUp .2s ease; box-shadow:0 24px 64px rgba(0,0,0,.6); font-family:'Barlow',sans-serif; max-height:90vh; overflow-y:auto; }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
    .auth-close { position:absolute; top:16px; right:16px; width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,.07); border:none; color:rgba(255,255,255,.5); cursor:pointer; font-size:.85rem; display:flex; align-items:center; justify-content:center; transition:all .15s; }
    .auth-close:hover { background:rgba(255,255,255,.12); color:white; }
    .auth-logo { font-size:1.3rem; font-weight:700; color:rgba(255,255,255,.7); text-align:center; margin-bottom:24px; }
    .auth-logo strong { color:#4ade80; font-weight:900; }
    .auth-tabs { display:flex; background:rgba(255,255,255,.04); border-radius:10px; padding:4px; margin-bottom:24px; }
    .auth-tab { flex:1; padding:8px; border:none; border-radius:7px; background:transparent; color:rgba(255,255,255,.4); font-size:.82rem; font-weight:700; cursor:pointer; transition:all .15s; font-family:'Barlow',sans-serif; }
    .auth-tab.active { background:rgba(255,255,255,.1); color:white; }
    .auth-form { display:flex; flex-direction:column; gap:14px; }
    .auth-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; min-width:0; }
    .auth-row .auth-field { min-width:0; }
    .auth-row .auth-input { width:100%; min-width:0; }
    .auth-field { display:flex; flex-direction:column; gap:5px; }
    .auth-field label { font-size:.68rem; font-weight:700; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.5px; }
    .auth-input { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:10px; padding:10px 14px; color:white; font-size:.88rem; font-family:'Barlow',sans-serif; outline:none; transition:all .15s; width:100%; }
    .auth-input:focus { border-color:rgba(74,222,128,.4); background:rgba(74,222,128,.04); }
    .auth-input::placeholder { color:rgba(255,255,255,.2); }
    .auth-select { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px; }
    .auth-select option { background:#0d1117; color:white; }
    .auth-teams-loading { font-size:.78rem; color:rgba(255,255,255,.4); display:flex; align-items:center; gap:8px; padding:10px 14px; background:rgba(255,255,255,.03); border-radius:10px; border:1px solid rgba(255,255,255,.08); }
    .auth-error { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); border-radius:8px; padding:10px 14px; color:#fca5a5; font-size:.78rem; font-weight:600; }
    .auth-submit { padding:13px; background:#4ade80; border:none; border-radius:10px; color:#070d1a; font-size:.9rem; font-weight:800; cursor:pointer; font-family:'Barlow',sans-serif; transition:all .15s; margin-top:4px; display:flex; align-items:center; justify-content:center; gap:8px; }
    .auth-submit:hover:not(:disabled) { background:#22c55e; }
    .auth-submit:disabled { opacity:.5; cursor:not-allowed; }
    .auth-switch { text-align:center; font-size:.75rem; color:rgba(255,255,255,.3); }
    .auth-switch button { background:none; border:none; color:#4ade80; font-weight:700; cursor:pointer; font-family:'Barlow',sans-serif; font-size:.75rem; }
    .auth-otp-info { background:rgba(74,222,128,.08); border:1px solid rgba(74,222,128,.2); border-radius:10px; padding:12px 16px; font-size:.82rem; color:rgba(255,255,255,.7); display:flex; align-items:center; gap:10px; }
    .auth-otp-info i { color:#4ade80; }
    .auth-otp-info strong { color:white; }
    .auth-otp-input { font-size:1.5rem; font-weight:900; letter-spacing:8px; text-align:center; font-family:'JetBrains Mono',monospace; }
    .auth-team-preview { display:flex; align-items:center; gap:10px; padding:8px 14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; }
    .auth-team-crest { width:28px; height:28px; object-fit:contain; filter:drop-shadow(0 1px 3px rgba(0,0,0,.5)); }
    .auth-team-preview span { font-size:.85rem; font-weight:700; color:white; }

    @media(max-width:480px) {
      .auth-overlay { padding:12px; align-items:center; }
      .auth-modal { border-radius:16px; padding:24px 20px; }
      .auth-row { grid-template-columns:1fr; gap:10px; }
      .auth-input { font-size:.85rem; padding:9px 12px; }
      .auth-submit { padding:12px; }
      .auth-logo { margin-bottom:16px; }
      .auth-tabs { margin-bottom:16px; }
    }
  `]
})
export class AuthModalComponent implements OnInit {
  @Input() initialTab: 'login' | 'register' = 'login';
  @Output() close = new EventEmitter<void>();

  private authService = inject(AuthService);
  private http = inject(HttpClient);

  readonly leagues = LEAGUES;
  tab: AuthTab = 'login';
  error = '';
  loading = false;

  // Login
  loginEmail = '';
  loginPassword = '';
  requires2fa = false;
  otpCode = '';

  // Register
  regNome = '';
  regCognome = '';
  regUsername = '';
  regEmail = '';
  regPassword = '';
  regSquadra = '';
  selectedLeague = '';
  teams: { name: string; crest: string }[] = [];
  regCrest = '';
  teamsLoading = false;

  ngOnInit() { this.tab = this.initialTab; }

  onLeagueChange() {
    this.regSquadra = '';
    this.regCrest = '';
    this.teams = [];
    if (!this.selectedLeague) return;
    this.teamsLoading = true;
    this.http.get<any>(
      `https://calciolive-backend.onrender.com/api/teams/${this.selectedLeague}`
    ).subscribe({
      next: (res) => {
        this.teams = (res.teams ?? [])
          .map((t: any) => ({ name: t.name, crest: t.crest ?? '' }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.teamsLoading = false;
      },
      error: () => { this.teamsLoading = false; }
    });
  }

  onTeamChange(teamName: string) {
    const found = this.teams.find(t => t.name === teamName);
    this.regCrest = found?.crest ?? '';
  }

  onCrestError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }

  doLogin() {
    if (!this.loginEmail || !this.loginPassword) { this.error = 'Inserisci email e password'; return; }
    this.loading = true; this.error = '';
    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.requires_2fa) {
          this.requires2fa = true;
        } else {
          this.close.emit();
        }
      },
      error: (err) => { this.loading = false; this.error = err.error?.error ?? 'Errore durante il login'; }
    });
  }

  doVerifyOtp() {
    if (!this.otpCode || this.otpCode.length < 6) { this.error = 'Inserisci il codice a 6 cifre'; return; }
    this.loading = true; this.error = '';
    this.authService.verifyOtp(this.loginEmail, this.otpCode).subscribe({
      next: () => { this.loading = false; this.close.emit(); },
      error: (err) => { this.loading = false; this.error = err.error?.error ?? 'Codice non valido'; }
    });
  }

  doRegister() {
    if (!this.regNome || !this.regCognome || !this.regUsername || !this.regEmail || !this.regPassword) {
      this.error = 'Tutti i campi sono obbligatori'; return;
    }
    if (this.regPassword.length < 6) { this.error = 'La password deve essere di almeno 6 caratteri'; return; }
    this.loading = true; this.error = '';
    this.authService.register({
      email: this.regEmail,
      password: this.regPassword,
      username: this.regUsername,
      nome: this.regNome,
      cognome: this.regCognome,
      squadra_preferita: this.regSquadra,
      squadra_crest: this.regCrest
    }).subscribe({
      next: () => { this.loading = false; this.close.emit(); },
      error: (err) => { this.loading = false; this.error = err.error?.error ?? 'Errore durante la registrazione'; }
    });
  }
}
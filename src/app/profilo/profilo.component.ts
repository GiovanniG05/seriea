import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

type ProfiloTab = 'info' | 'modifica' | 'password';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="prof-overlay" (click)="close.emit()">
      <div class="prof-modal" (click)="$event.stopPropagation()">
        <button class="prof-close" (click)="close.emit()">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <!-- HEADER -->
        <div class="prof-header">
          <div class="prof-avatar">{{ auth.user?.nome?.[0] }}{{ auth.user?.cognome?.[0] }}</div>
          <div class="prof-header-info">
            <div class="prof-fullname">{{ auth.user?.nome }} {{ auth.user?.cognome }}</div>
            <div class="prof-username">{{ '@' + auth.user?.username }}</div>
            <div class="prof-email">{{ auth.user?.email }}</div>
            <div class="prof-squadra" *ngIf="auth.user?.squadra_preferita">
              <img *ngIf="auth.user?.squadra_crest" [src]="auth.user?.squadra_crest" class="prof-squad-crest-sm" (error)="onImgError($event)">
              <i *ngIf="!auth.user?.squadra_crest" class="fa-solid fa-shield-halved"></i>
              {{ auth.user?.squadra_preferita }}
            </div>
          </div>
        </div>

        <!-- TABS -->
        <div class="prof-tabs">
          <button class="prof-tab" [class.active]="tab==='info'" (click)="tab='info'">
            <i class="fa-solid fa-circle-info"></i> Info
          </button>
          <button class="prof-tab" [class.active]="tab==='modifica'" (click)="tab='modifica'; initEdit()">
            <i class="fa-solid fa-pen"></i> Modifica
          </button>
          <button class="prof-tab" [class.active]="tab==='password'" (click)="tab='password'; resetPwd()">
            <i class="fa-solid fa-lock"></i> Password
          </button>
        </div>

        <!-- INFO -->
        <div class="prof-body" *ngIf="tab==='info'">
          <div class="prof-stat-grid">
            <div class="prof-stat">
              <div class="prof-stat-lbl">Nome completo</div>
              <div class="prof-stat-val">{{ auth.user?.nome }} {{ auth.user?.cognome }}</div>
            </div>
            <div class="prof-stat">
              <div class="prof-stat-lbl">Username</div>
              <div class="prof-stat-val">{{ '@' + auth.user?.username }}</div>
            </div>
            <div class="prof-stat">
              <div class="prof-stat-lbl">Email</div>
              <div class="prof-stat-val">{{ auth.user?.email }}</div>
            </div>
            <div class="prof-stat">
              <div class="prof-stat-lbl">Squadra preferita</div>
              <div class="prof-stat-val prof-stat-team">
                <img *ngIf="auth.user?.squadra_crest" [src]="auth.user?.squadra_crest" class="prof-squad-crest" (error)="onImgError($event)">
                {{ auth.user?.squadra_preferita || '—' }}
              </div>
            </div>
            <div class="prof-stat">
              <div class="prof-stat-lbl">Membro dal</div>
              <div class="prof-stat-val">{{ auth.user?.created_at | date:'dd MMM yyyy' }}</div>
            </div>
          </div>

          <button class="prof-logout-btn" (click)="doLogout()">
            <i class="fa-solid fa-right-from-bracket"></i> Esci dall'account
          </button>
        </div>

        <!-- MODIFICA -->
        <div class="prof-body" *ngIf="tab==='modifica'">
          <div class="prof-form">
            <div class="prof-row">
              <div class="prof-field">
                <label>Nome</label>
                <input type="text" [(ngModel)]="editNome" class="prof-input">
              </div>
              <div class="prof-field">
                <label>Cognome</label>
                <input type="text" [(ngModel)]="editCognome" class="prof-input">
              </div>
            </div>
            <div class="prof-field">
              <label>Campionato</label>
              <select class="prof-input prof-select" [(ngModel)]="editLeague" (ngModelChange)="onEditLeagueChange()">
                <option value="">Seleziona campionato…</option>
                <option *ngFor="let l of leagues" [value]="l.code">{{ l.name }}</option>
              </select>
            </div>
            <div class="prof-field" *ngIf="editLeague">
              <label>Squadra preferita</label>
              <div class="prof-teams-loading" *ngIf="editTeamsLoading">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Caricamento…
              </div>
              <select class="prof-input prof-select" [(ngModel)]="editSquadra" (ngModelChange)="onEditTeamChange($event)" *ngIf="!editTeamsLoading && editTeams.length">
                <option value="">Seleziona squadra…</option>
                <option *ngFor="let t of editTeams" [value]="t.name">{{ t.name }}</option>
              </select>
              <div class="prof-team-preview" *ngIf="editSquadra && editCrest">
                <img [src]="editCrest" class="prof-squad-crest" (error)="onImgError($event)">
                <span>{{ editSquadra }}</span>
              </div>
            </div>
            <div class="prof-error" *ngIf="editError">{{ editError }}</div>
            <div class="prof-success" *ngIf="editSuccess">Profilo aggiornato!</div>
            <button class="prof-submit" (click)="doUpdateProfile()" [disabled]="editLoading">
              <i class="fa-solid fa-circle-notch fa-spin" *ngIf="editLoading"></i>
              {{ editLoading ? 'Salvataggio…' : 'Salva modifiche' }}
            </button>
          </div>
        </div>

        <!-- PASSWORD -->
        <div class="prof-body" *ngIf="tab==='password'">
          <div class="prof-form">
            <div class="prof-field">
              <label>Password attuale</label>
              <input type="password" [(ngModel)]="pwdCurrent" placeholder="••••••••" class="prof-input">
            </div>
            <div class="prof-field">
              <label>Nuova password</label>
              <input type="password" [(ngModel)]="pwdNew" placeholder="min. 6 caratteri" class="prof-input">
            </div>
            <div class="prof-field">
              <label>Conferma nuova password</label>
              <input type="password" [(ngModel)]="pwdConfirm" placeholder="••••••••" class="prof-input">
            </div>
            <div class="prof-error" *ngIf="pwdError">{{ pwdError }}</div>
            <div class="prof-success" *ngIf="pwdSuccess">Password cambiata con successo!</div>
            <button class="prof-submit" (click)="doChangePassword()" [disabled]="pwdLoading">
              <i class="fa-solid fa-circle-notch fa-spin" *ngIf="pwdLoading"></i>
              {{ pwdLoading ? 'Aggiornamento…' : 'Cambia password' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; }

    .prof-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,.8); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn .2s ease; font-family:'Barlow',sans-serif; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }

    .prof-modal { background:#0d1117; border:1px solid rgba(255,255,255,.1); border-radius:20px; width:100%; max-width:480px; position:relative; animation:slideUp .2s ease; box-shadow:0 24px 64px rgba(0,0,0,.6); overflow:hidden; }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

    .prof-close { position:absolute; top:16px; right:16px; width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,.07); border:none; color:rgba(255,255,255,.5); cursor:pointer; font-size:.85rem; display:flex; align-items:center; justify-content:center; transition:all .15s; z-index:1; }
    .prof-close:hover { background:rgba(255,255,255,.12); color:white; }

    /* HEADER */
    .prof-header { background:linear-gradient(135deg,rgba(59,130,246,.15),rgba(74,222,128,.08)); border-bottom:1px solid rgba(255,255,255,.07); padding:28px 24px 20px; display:flex; gap:16px; align-items:center; }
    .prof-avatar { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#4ade80); color:white; display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight:900; flex-shrink:0; letter-spacing:-1px; }
    .prof-header-info { flex:1; min-width:0; padding-right:32px; }
    .prof-fullname { font-size:1.15rem; font-weight:900; color:white; margin-bottom:2px; }
    .prof-username { font-size:.78rem; font-weight:700; color:#4ade80; margin-bottom:2px; }
    .prof-email { font-size:.72rem; color:rgba(255,255,255,.4); margin-bottom:4px; }
    .prof-squadra { font-size:.72rem; color:rgba(255,255,255,.4); display:flex; align-items:center; gap:5px; }
    .prof-squadra i { font-size:.65rem; color:rgba(255,255,255,.25); }

    /* TABS */
    .prof-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,.07); padding:0 16px; }
    .prof-tab { padding:12px 16px; background:none; border:none; border-bottom:2px solid transparent; color:rgba(255,255,255,.4); font-size:.78rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; font-family:'Barlow',sans-serif; margin-bottom:-1px; }
    .prof-tab i { font-size:.72rem; }
    .prof-tab:hover { color:white; }
    .prof-tab.active { color:white; border-bottom-color:#4ade80; }

    /* BODY */
    .prof-body { padding:20px 24px; }

    /* INFO */
    .prof-stat-grid { display:flex; flex-direction:column; gap:12px; margin-bottom:24px; }
    .prof-stat { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:10px; padding:12px 16px; }
    .prof-stat-lbl { font-size:.62rem; font-weight:800; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:.8px; margin-bottom:4px; }
    .prof-stat-val { font-size:.88rem; font-weight:700; color:white; }

    .prof-logout-btn { width:100%; padding:12px; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); border-radius:10px; color:#f87171; font-size:.85rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all .15s; font-family:'Barlow',sans-serif; }
    .prof-logout-btn:hover { background:rgba(239,68,68,.15); border-color:rgba(239,68,68,.35); }

    /* FORM */
    .prof-form { display:flex; flex-direction:column; gap:14px; }
    .prof-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .prof-row .prof-field { min-width:0; }
    .prof-field { display:flex; flex-direction:column; gap:5px; }
    .prof-field label { font-size:.68rem; font-weight:700; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.5px; }
    .prof-input { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:10px; padding:10px 14px; color:white; font-size:.88rem; font-family:'Barlow',sans-serif; outline:none; transition:all .15s; width:100%; }
    .prof-input:focus { border-color:rgba(74,222,128,.4); background:rgba(74,222,128,.04); }
    .prof-error { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); border-radius:8px; padding:10px 14px; color:#fca5a5; font-size:.78rem; font-weight:600; }
    .prof-success { background:rgba(74,222,128,.1); border:1px solid rgba(74,222,128,.25); border-radius:8px; padding:10px 14px; color:#4ade80; font-size:.78rem; font-weight:600; }
    .prof-submit { padding:12px; background:#4ade80; border:none; border-radius:10px; color:#070d1a; font-size:.88rem; font-weight:800; cursor:pointer; font-family:'Barlow',sans-serif; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:4px; }
    .prof-submit:hover:not(:disabled) { background:#22c55e; }
    .prof-submit:disabled { opacity:.5; cursor:not-allowed; }
    .prof-squad-crest { width:24px; height:24px; object-fit:contain; filter:drop-shadow(0 1px 3px rgba(0,0,0,.5)); }
    .prof-squad-crest-sm { width:14px; height:14px; object-fit:contain; }
    .prof-stat-team { display:flex; align-items:center; gap:8px; }
    .prof-select { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px; }
    .prof-select option { background:#0d1117; color:white; }
    .prof-teams-loading { font-size:.78rem; color:rgba(255,255,255,.4); display:flex; align-items:center; gap:8px; padding:10px 14px; background:rgba(255,255,255,.03); border-radius:10px; border:1px solid rgba(255,255,255,.08); }
    .prof-team-preview { display:flex; align-items:center; gap:10px; padding:8px 14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; }
    .prof-team-preview span { font-size:.85rem; font-weight:700; color:white; }

    @media(max-width:480px) {
      .prof-overlay { padding:12px; }
      .prof-modal { max-height:92vh; overflow-y:auto; }
      .prof-header { padding:20px 16px 16px; }
      .prof-avatar { width:52px; height:52px; font-size:1.1rem; }
      .prof-body { padding:16px; }
      .prof-row { grid-template-columns:1fr; }
      .prof-tab { padding:10px 12px; font-size:.72rem; }
    }
  `]
})
export class ProfiloComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  auth = inject(AuthService);
  private http = inject(HttpClient);
  tab: ProfiloTab = 'info';

  readonly leagues = [
    { code: 'SA', name: 'Serie A' },
    { code: 'PL', name: 'Premier League' },
    { code: 'PD', name: 'La Liga' },
    { code: 'BL1', name: 'Bundesliga' },
    { code: 'FL1', name: 'Ligue 1' },
    { code: 'CL', name: 'Champions League' },
  ];

  // Edit
  editNome = '';
  editCognome = '';
  editSquadra = '';
  editCrest = '';
  editLeague = '';
  editTeams: { name: string; crest: string }[] = [];
  editTeamsLoading = false;
  editError = '';
  editSuccess = false;
  editLoading = false;

  // Password
  pwdCurrent = '';
  pwdNew = '';
  pwdConfirm = '';
  pwdError = '';
  pwdSuccess = false;
  pwdLoading = false;

  ngOnInit() { this.initEdit(); }

  initEdit() {
    this.editNome = this.auth.user?.nome ?? '';
    this.editCognome = this.auth.user?.cognome ?? '';
    this.editSquadra = this.auth.user?.squadra_preferita ?? '';
    this.editError = '';
    this.editSuccess = false;
  }

  resetPwd() {
    this.pwdCurrent = '';
    this.pwdNew = '';
    this.pwdConfirm = '';
    this.pwdError = '';
    this.pwdSuccess = false;
  }

  onEditLeagueChange() {
    this.editSquadra = '';
    this.editCrest = '';
    this.editTeams = [];
    if (!this.editLeague) return;
    this.editTeamsLoading = true;
    this.http.get<any>(
      `https://calciolive-backend.onrender.com/api/teams/${this.editLeague}`
    ).subscribe({
      next: (res) => {
        this.editTeams = (res.teams ?? [])
          .map((t: any) => ({ name: t.name, crest: t.crest ?? '' }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.editTeamsLoading = false;
      },
      error: () => { this.editTeamsLoading = false; }
    });
  }

  onEditTeamChange(teamName: string) {
    const found = this.editTeams.find(t => t.name === teamName);
    this.editCrest = found?.crest ?? '';
  }

  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }

  doUpdateProfile() {
    if (!this.editNome || !this.editCognome) { this.editError = 'Nome e cognome obbligatori'; return; }
    this.editLoading = true; this.editError = ''; this.editSuccess = false;
    this.auth.updateProfile(this.editNome, this.editCognome, this.editSquadra, this.editCrest || this.auth.user?.squadra_crest || '').subscribe({
      next: () => { this.editLoading = false; this.editSuccess = true; },
      error: (err) => { this.editLoading = false; this.editError = err.error?.error ?? 'Errore durante il salvataggio'; }
    });
  }

  doChangePassword() {
    if (!this.pwdCurrent || !this.pwdNew || !this.pwdConfirm) { this.pwdError = 'Tutti i campi sono obbligatori'; return; }
    if (this.pwdNew !== this.pwdConfirm) { this.pwdError = 'Le password non coincidono'; return; }
    if (this.pwdNew.length < 6) { this.pwdError = 'La nuova password deve essere di almeno 6 caratteri'; return; }
    this.pwdLoading = true; this.pwdError = ''; this.pwdSuccess = false;
    this.auth.changePassword(this.pwdCurrent, this.pwdNew).subscribe({
      next: () => { this.pwdLoading = false; this.pwdSuccess = true; this.resetPwd(); this.pwdSuccess = true; },
      error: (err) => { this.pwdLoading = false; this.pwdError = err.error?.error ?? 'Errore durante il cambio password'; }
    });
  }

  doLogout() { this.auth.logout(); this.close.emit(); }
}
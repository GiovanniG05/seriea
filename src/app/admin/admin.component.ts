import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="adm-page">
      <div class="adm-hero">
        <div class="adm-hero-bg"></div>
        <div class="adm-hero-inner">
          <div class="adm-eyebrow"><i class="fa-solid fa-shield-halved"></i> Pannello Admin</div>
          <h1 class="adm-title">Gestione <span>Utenti</span></h1>
          <div class="adm-sub">{{ users.length }} utenti registrati</div>
        </div>
      </div>

      <div class="adm-stats">
        <div class="adm-stat">
          <div class="adm-stat-val">{{ users.length }}</div>
          <div class="adm-stat-lbl">Utenti totali</div>
        </div>
        <div class="adm-stat">
          <div class="adm-stat-val">{{ adminCount }}</div>
          <div class="adm-stat-lbl">Amministratori</div>
        </div>
        <div class="adm-stat">
          <div class="adm-stat-val">{{ todayCount }}</div>
          <div class="adm-stat-lbl">Iscritti oggi</div>
        </div>
      </div>

      <div class="adm-loading" *ngIf="loading">
        <div class="adm-spinner"></div>
        <span>Caricamento utenti…</span>
      </div>

      <div class="adm-table-wrap" *ngIf="!loading">
        <div class="adm-thead">
          <div>Utente</div>
          <div>Email</div>
          <div>Squadra</div>
          <div>Ruolo</div>
          <div>Iscritto</div>
          <div>Azioni</div>
        </div>
        <div class="adm-tbody">
          <div class="adm-row" *ngFor="let u of users" [class.is-admin]="u.role === 'admin'">
            <div class="adm-user">
              <div class="adm-avatar" [class.admin]="u.role === 'admin'">
                {{ u.nome?.[0] }}{{ u.cognome?.[0] }}
              </div>
              <div>
                <div class="adm-name">{{ u.nome }} {{ u.cognome }}</div>
                <div class="adm-username">{{ '@' + u.username }}</div>
              </div>
            </div>
            <div class="adm-email">{{ u.email }}</div>
            <div class="adm-squadra">
              <img *ngIf="u.squadra_crest" [src]="u.squadra_crest" class="adm-crest" (error)="onImgError($event)">
              {{ u.squadra_preferita || '—' }}
            </div>
            <div>
              <span class="adm-role-badge" [class.admin]="u.role === 'admin'">
                {{ u.role === 'admin' ? 'Admin' : 'User' }}
              </span>
            </div>
            <div class="adm-date">{{ u.created_at | date:'dd MMM yy' }}</div>
            <div class="adm-actions">
              <button class="adm-btn" *ngIf="u.id !== auth.user?.id"
                (click)="toggleRole(u)"
                [title]="u.role === 'admin' ? 'Rimuovi admin' : 'Rendi admin'">
                <i class="fa-solid" [class.fa-shield-halved]="u.role !== 'admin'" [class.fa-user]="u.role === 'admin'"></i>
              </button>
              <button class="adm-btn danger" *ngIf="u.id !== auth.user?.id" (click)="deleteUser(u)" title="Elimina">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; }

    .adm-page { font-family:'Barlow',sans-serif; max-width:1060px; margin:0 auto; display:flex; flex-direction:column; gap:16px; }

    .adm-hero { position:relative; border-radius:16px; overflow:hidden; background:#0a0f1e; padding:28px 36px; }
    .adm-hero-bg { position:absolute; inset:0; background:radial-gradient(ellipse 40% 60% at 100% 20%,rgba(239,68,68,.2) 0%,transparent 55%); pointer-events:none; }
    .adm-hero-inner { position:relative; z-index:1; }
    .adm-eyebrow { font-size:.62rem; font-weight:700; color:rgba(255,255,255,.4); letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
    .adm-eyebrow i { color:#ef4444; margin-right:6px; }
    .adm-title { font-size:2rem; font-weight:900; color:white; margin:0; }
    .adm-title span { color:#ef4444; }
    .adm-sub { font-size:.78rem; color:rgba(255,255,255,.35); margin-top:4px; }

    .adm-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
    .adm-stat { background:#0f172a; border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:16px 20px; text-align:center; }
    .adm-stat-val { font-size:1.8rem; font-weight:900; color:white; font-family:'JetBrains Mono',monospace; }
    .adm-stat-lbl { font-size:.62rem; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.8px; margin-top:4px; }

    .adm-loading { display:flex; align-items:center; justify-content:center; gap:14px; padding:56px; color:#6b7280; background:#0f172a; border-radius:12px; }
    .adm-spinner { width:28px; height:28px; border:3px solid rgba(255,255,255,.06); border-top-color:#ef4444; border-radius:50%; animation:spin .75s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .adm-table-wrap { background:#0f172a; border:1px solid rgba(255,255,255,.06); border-radius:14px; overflow:hidden; }
    .adm-thead { display:grid; grid-template-columns:2fr 2fr 1.5fr 1fr 1fr 1fr; padding:10px 20px; background:#0a0f1e; font-size:.6rem; font-weight:800; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid rgba(255,255,255,.06); }
    .adm-tbody { display:flex; flex-direction:column; }
    .adm-row { display:grid; grid-template-columns:2fr 2fr 1.5fr 1fr 1fr 1fr; align-items:center; padding:12px 20px; border-bottom:1px solid rgba(255,255,255,.04); transition:background .12s; }
    .adm-row:last-child { border-bottom:none; }
    .adm-row:hover { background:rgba(255,255,255,.02); }
    .adm-row.is-admin { background:rgba(239,68,68,.03); }

    .adm-user { display:flex; align-items:center; gap:10px; }
    .adm-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#4ade80); color:white; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:900; flex-shrink:0; }
    .adm-avatar.admin { background:linear-gradient(135deg,#ef4444,#f97316); }
    .adm-name { font-size:.82rem; font-weight:700; color:white; }
    .adm-username { font-size:.65rem; color:#4ade80; font-weight:600; }
    .adm-email { font-size:.72rem; color:rgba(255,255,255,.5); }
    .adm-squadra { display:flex; align-items:center; gap:6px; font-size:.72rem; color:rgba(255,255,255,.5); }
    .adm-crest { width:18px; height:18px; object-fit:contain; }
    .adm-date { font-size:.68rem; color:rgba(255,255,255,.35); font-family:'JetBrains Mono',monospace; }

    .adm-role-badge { font-size:.6rem; font-weight:800; padding:3px 8px; border-radius:5px; background:rgba(255,255,255,.07); color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.5px; }
    .adm-role-badge.admin { background:rgba(239,68,68,.15); color:#f87171; }

    .adm-actions { display:flex; gap:6px; }
    .adm-btn { width:30px; height:30px; border-radius:7px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); color:rgba(255,255,255,.5); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.72rem; transition:all .15s; }
    .adm-btn:hover { background:rgba(255,255,255,.12); color:white; }
    .adm-btn.danger:hover { background:rgba(239,68,68,.15); border-color:rgba(239,68,68,.3); color:#f87171; }

    @media(max-width:700px) {
      .adm-hero { padding:20px 16px; }
      .adm-title { font-size:1.5rem; }
      .adm-thead { grid-template-columns:1fr 1fr 1fr; }
      .adm-thead div:nth-child(2), .adm-thead div:nth-child(3), .adm-thead div:nth-child(5) { display:none; }
      .adm-row { grid-template-columns:1fr 1fr 1fr; }
      .adm-row > div:nth-child(2), .adm-row > div:nth-child(3), .adm-row > div:nth-child(5) { display:none; }
    }
  `]
})
export class AdminComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);
  private API = 'https://calciolive-backend.onrender.com/api';

  users: any[] = [];
  loading = true;

  get adminCount() { return this.users.filter(u => u.role === 'admin').length; }
  get todayCount() {
    const today = new Date().toDateString();
    return this.users.filter(u => new Date(u.created_at).toDateString() === today).length;
  }

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.http.get<any>(`${this.API}/admin/users`, {
      headers: { Authorization: `Bearer ${this.auth.token}` }
    }).subscribe({
      next: (res) => { this.users = res.users ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  toggleRole(u: any) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Vuoi ${newRole === 'admin' ? 'rendere admin' : 'rimuovere i permessi admin da'} ${u.username}?`)) return;
    this.http.put(`${this.API}/admin/users/${u.id}/role`, { role: newRole }, {
      headers: { Authorization: `Bearer ${this.auth.token}` }
    }).subscribe({
      next: () => { u.role = newRole; }
    });
  }

  deleteUser(u: any) {
    if (!confirm(`Vuoi eliminare definitivamente ${u.username}?`)) return;
    this.http.delete(`${this.API}/admin/users/${u.id}`, {
      headers: { Authorization: `Bearer ${this.auth.token}` }
    }).subscribe({
      next: () => { this.users = this.users.filter(x => x.id !== u.id); }
    });
  }

  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
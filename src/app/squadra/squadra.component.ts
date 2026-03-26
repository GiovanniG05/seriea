import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { FootballService } from '../services/football.service';

@Component({
  selector: 'app-squadra',
  standalone: true,
  imports: [CommonModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="sq-overlay" (click)="onOverlayClick($event)">
      <div class="sq-panel" (click)="$event.stopPropagation()">

        <!-- Loading -->
        <div class="sq-loading" *ngIf="loading">
          <div class="sq-spinner"></div>
          <span>Caricamento squadra…</span>
        </div>

        <ng-container *ngIf="!loading && team">

          <!-- HEADER -->
          <div class="sq-header">
            <div class="sq-header-bg" [style.background]="teamGradient"></div>
            <button class="sq-close" (click)="close.emit()">
              <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="sq-header-inner">
              <img [src]="team.crest" class="sq-crest" (error)="onImgError($event)">
              <div class="sq-header-info">
                <div class="sq-team-name">{{ team.name }}</div>
                <div class="sq-team-meta">
                  <span *ngIf="team.founded"><i class="fa-solid fa-calendar"></i> {{ team.founded }}</span>
                  <span *ngIf="team.venue"><i class="fa-solid fa-location-dot"></i> {{ team.venue }}</span>
                  <span *ngIf="team.clubColors"><i class="fa-solid fa-palette"></i> {{ team.clubColors }}</span>
                </div>
                <div class="sq-competitions">
                  <span class="sq-comp-badge" *ngFor="let c of team.runningCompetitions?.slice(0,3)">
                    {{ c.name }}
                  </span>
                </div>
                <a *ngIf="team.website" [href]="team.website" target="_blank" class="sq-website">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Sito ufficiale
                </a>
                <button class="sq-fav-btn" (click)="toggleFav()" [class.active]="isFav">
                  <i class="fa-solid fa-heart"></i>
                  {{ isFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti' }}
                </button>
              </div>
            </div>
          </div>

          <!-- TABS -->
          <div class="sq-tabs">
            <button class="sq-tab" [class.active]="activeTab==='rosa'" (click)="activeTab='rosa'">
              <i class="fa-solid fa-users"></i> Rosa
            </button>
            <button class="sq-tab" [class.active]="activeTab==='staff'" (click)="activeTab='staff'">
              <i class="fa-solid fa-person-chalkboard"></i> Staff
            </button>
            <button class="sq-tab" [class.active]="activeTab==='partite'" (click)="loadMatches()">
              <i class="fa-solid fa-futbol"></i> Partite
            </button>
          </div>

          <!-- ROSA -->
          <div class="sq-content" *ngIf="activeTab==='rosa'">

            <div class="sq-position-group" *ngFor="let pos of positions">
              <div class="sq-pos-label">{{ pos.label }}</div>
              <div class="sq-players-grid">
                <div class="sq-player" *ngFor="let p of getByPosition(pos)">
                  <div class="sq-player-num">{{ p.shirtNumber ?? '–' }}</div>
                  <div class="sq-player-info">
                    <div class="sq-player-name">{{ p.name }}</div>
                    <div class="sq-player-nat">
                      {{ p.nationality }}
                      <span *ngIf="p.dateOfBirth"> · {{ getAge(p.dateOfBirth) }} anni</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- STAFF -->
          <div class="sq-content" *ngIf="activeTab==='staff'">
            <div class="sq-staff-card" *ngIf="team.coach">
              <div class="sq-staff-role">Allenatore</div>
              <div class="sq-staff-name">{{ team.coach.name }}</div>
              <div class="sq-staff-meta">
                <span *ngIf="team.coach.nationality"><i class="fa-solid fa-flag"></i> {{ team.coach.nationality }}</span>
                <span *ngIf="team.coach.dateOfBirth"><i class="fa-solid fa-cake-candles"></i> {{ getAge(team.coach.dateOfBirth) }} anni</span>
                <span *ngIf="team.coach.contract?.start"><i class="fa-solid fa-file-signature"></i> Dal {{ team.coach.contract.start }}</span>
              </div>
            </div>
            <div class="sq-staff-list">
              <div class="sq-staff-card" *ngFor="let s of team.staff">
                <div class="sq-staff-role">{{ s.role ?? 'Staff' }}</div>
                <div class="sq-staff-name">{{ s.name }}</div>
                <div class="sq-staff-meta" *ngIf="s.nationality">
                  <span><i class="fa-solid fa-flag"></i> {{ s.nationality }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- PARTITE -->
          <div class="sq-content" *ngIf="activeTab==='partite'">
            <!-- Selettore stagione -->
            <div class="sq-season-wrap">
              <select class="sq-season-select" (change)="onSeasonChange($event)">
                <option value="">In corso</option>
                <option *ngFor="let y of matchSeasons" [value]="y">{{ y }}/{{ (y+1).toString().slice(2) }}</option>
              </select>
            </div>
            <div class="sq-loading" *ngIf="loadingMatches">
              <div class="sq-spinner"></div>
              <span>Caricamento partite…</span>
            </div>
            <div class="sq-matches" *ngIf="!loadingMatches">
              <div class="sq-match-item" *ngFor="let m of recentMatches">
                <div class="sq-match-date">{{ m.utcDate | date:'dd MMM yy' }}</div>
                <div class="sq-match-teams">
                  <div class="sq-match-team" [class.bold]="m.homeTeam.id === teamId">
                    <img [src]="m.homeTeam.crest" class="sq-match-crest" (error)="onImgError($event)">
                    <span>{{ m.homeTeam.shortName }}</span>
                  </div>
                  <div class="sq-match-score" *ngIf="m.status === 'FINISHED'">
                    <span [class.win]="isWin(m,'home')" [class.loss]="isLoss(m,'home')">{{ m.score.fullTime.home }}</span>
                    <span class="sq-match-sep">–</span>
                    <span [class.win]="isWin(m,'away')" [class.loss]="isLoss(m,'away')">{{ m.score.fullTime.away }}</span>
                  </div>
                  <div class="sq-match-score tbd" *ngIf="m.status !== 'FINISHED'">
                    {{ m.utcDate | date:'HH:mm' }}
                  </div>
                  <div class="sq-match-team away" [class.bold]="m.awayTeam.id === teamId">
                    <span>{{ m.awayTeam.shortName }}</span>
                    <img [src]="m.awayTeam.crest" class="sq-match-crest" (error)="onImgError($event)">
                  </div>
                </div>
                <div class="sq-match-result" [class]="getMatchResult(m)">
                  {{ getMatchResultLabel(m) }}
                </div>
              </div>
              <div class="sq-no-matches" *ngIf="recentMatches.length === 0">
                <i class="fa-solid fa-calendar-xmark"></i>
                <span>Nessuna partita disponibile</span>
              </div>
            </div>
          </div>

        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; }

    /* OVERLAY */
    .sq-overlay {
      position:fixed; inset:0; z-index:600;
      background:rgba(0,0,0,.75);
      backdrop-filter:blur(8px);
      display:flex; align-items:flex-start; justify-content:flex-end;
      animation:sqFadeIn .2s ease;
    }
    @keyframes sqFadeIn { from{opacity:0} to{opacity:1} }

    /* PANEL (slide da destra) */
    .sq-panel {
      width:480px; max-width:100%;
      height:100vh; overflow-y:auto;
      background:#0d1117;
      display:flex; flex-direction:column;
      animation:sqSlideIn .25s ease;
      font-family:'Barlow',sans-serif;
    }
    @keyframes sqSlideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }

    /* LOADING */
    .sq-loading { display:flex; align-items:center; justify-content:center; gap:14px; padding:80px 24px; color:#6b7280; }
    .sq-spinner { width:28px; height:28px; border:3px solid rgba(255,255,255,.06); border-top-color:#4ade80; border-radius:50%; animation:spin .75s linear infinite; flex-shrink:0; }
    @keyframes spin { to{transform:rotate(360deg)} }

    /* HEADER */
    .sq-header { position:relative; padding:20px 20px 20px; }
    .sq-header-bg { position:absolute; inset:0; opacity:.15; pointer-events:none; }
    .sq-close {
      position:absolute; top:14px; right:14px; z-index:2;
      width:32px; height:32px; border-radius:8px;
      background:rgba(255,255,255,.08); border:none;
      color:rgba(255,255,255,.6); cursor:pointer; font-size:.85rem;
      display:flex; align-items:center; justify-content:center; transition:all .15s;
      flex-shrink:0;
    }
    .sq-close:hover { background:rgba(255,255,255,.15); color:white; }
    .sq-header-inner { position:relative; z-index:1; display:flex; align-items:flex-start; gap:14px; padding-right:40px; flex-wrap:wrap; }
    .sq-crest { width:64px; height:64px; object-fit:contain; filter:drop-shadow(0 4px 12px rgba(0,0,0,.5)); flex-shrink:0; }
    .sq-crest-fallback { width:64px; height:64px; border-radius:14px; background:rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:900; color:rgba(255,255,255,.6); flex-shrink:0; font-family:'JetBrains Mono',monospace; }
    .sq-header-info { flex:1; min-width:0; }
    .sq-team-name { font-size:1.3rem; font-weight:900; color:white; margin-bottom:6px; line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sq-team-meta { display:flex; flex-wrap:wrap; gap:8px; font-size:.65rem; color:rgba(255,255,255,.4); font-weight:600; margin-bottom:8px; }
    .sq-team-meta i { color:rgba(255,255,255,.3); margin-right:3px; }
    .sq-competitions { display:flex; gap:5px; flex-wrap:wrap; }
    .sq-comp-badge { font-size:.58rem; font-weight:700; background:rgba(255,255,255,.08); color:rgba(255,255,255,.5); padding:3px 8px; border-radius:5px; }
    .sq-website { font-size:.65rem; font-weight:700; color:rgba(255,255,255,.4); text-decoration:none; display:inline-flex; align-items:center; gap:5px; padding:5px 10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); border-radius:8px; transition:all .15s; margin-top:8px; }
    .sq-website:hover { color:white; background:rgba(255,255,255,.1); }
    .sq-fav-btn { display:inline-flex; align-items:center; gap:6px; font-size:.65rem; font-weight:700; color:rgba(255,255,255,.4); text-decoration:none; padding:5px 10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); border-radius:8px; transition:all .15s; margin-top:6px; cursor:pointer; font-family:'Barlow',sans-serif; }
    .sq-fav-btn:hover { color:white; background:rgba(255,255,255,.1); }
    .sq-fav-btn.active { color:#ef4444; background:rgba(239,68,68,.1); border-color:rgba(239,68,68,.3); }
    .sq-fav-btn i { font-size:.7rem; }

    /* TABS */
    .sq-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,.07); padding:0 16px; }
    .sq-tab { padding:12px 16px; background:none; border:none; border-bottom:2px solid transparent; color:rgba(255,255,255,.4); font-size:.8rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:7px; transition:all .15s; font-family:'Barlow',sans-serif; margin-bottom:-1px; }
    .sq-tab i { font-size:.75rem; }
    .sq-tab:hover { color:white; }
    .sq-tab.active { color:white; border-bottom-color:#4ade80; }

    /* CONTENT */
    .sq-content { padding:20px; display:flex; flex-direction:column; gap:20px; }

    /* POSIZIONI */
    .sq-position-group { display:flex; flex-direction:column; gap:8px; }
    .sq-pos-label { font-size:.6rem; font-weight:800; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:1.5px; }
    .sq-players-grid { display:flex; flex-direction:column; gap:3px; }
    .sq-player { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; transition:background .1s; }
    .sq-player:hover { background:rgba(255,255,255,.04); }
    .sq-player-num { font-family:'JetBrains Mono',monospace; font-size:.75rem; font-weight:700; color:rgba(255,255,255,.25); min-width:20px; text-align:center; }
    .sq-player-name { font-size:.82rem; font-weight:700; color:white; }
    .sq-player-nat { font-size:.65rem; color:rgba(255,255,255,.35); font-weight:600; margin-top:1px; }

    /* STAFF */
    .sq-staff-list { display:flex; flex-direction:column; gap:8px; }
    .sq-staff-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.06); border-radius:10px; padding:14px 16px; }
    .sq-staff-role { font-size:.6rem; font-weight:800; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
    .sq-staff-name { font-size:.92rem; font-weight:800; color:white; margin-bottom:6px; }
    .sq-staff-meta { display:flex; gap:12px; font-size:.68rem; color:rgba(255,255,255,.4); font-weight:600; }
    .sq-staff-meta i { color:rgba(255,255,255,.25); margin-right:3px; }

    .sq-season-wrap { margin-bottom:12px; }
    .sq-season-select { background:#111827; border:1px solid rgba(255,255,255,.1); border-radius:8px; padding:7px 12px; color:rgba(255,255,255,.7); font-size:.75rem; font-weight:700; font-family:'Barlow',sans-serif; cursor:pointer; outline:none; width:100%; }
    .sq-season-select option { background:#111827; color:white; }

    /* PARTITE */
    .sq-matches { display:flex; flex-direction:column; gap:8px; }
    .sq-match-item { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:10px; padding:10px 14px; display:flex; align-items:center; gap:10px; }
    .sq-match-date { font-size:.62rem; font-weight:700; color:rgba(255,255,255,.3); min-width:56px; flex-shrink:0; }
    .sq-match-teams { flex:1; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:8px; }
    .sq-match-team { display:flex; align-items:center; gap:6px; font-size:.75rem; font-weight:600; color:rgba(255,255,255,.5); }
    .sq-match-team.away { justify-content:flex-end; flex-direction:row-reverse; }
    .sq-match-team.bold { color:white; font-weight:800; }
    .sq-match-crest { width:18px; height:18px; object-fit:contain; flex-shrink:0; }
    .sq-match-score { font-family:'JetBrains Mono',monospace; font-size:1rem; font-weight:700; text-align:center; display:flex; align-items:center; gap:4px; }
    .sq-match-score .win { color:white; }
    .sq-match-score .loss { color:rgba(255,255,255,.3); }
    .sq-match-score.tbd { font-size:.8rem; color:rgba(255,255,255,.3); }
    .sq-match-sep { color:rgba(255,255,255,.2); font-size:.8rem; }
    .sq-match-result { font-size:.6rem; font-weight:800; padding:2px 7px; border-radius:5px; letter-spacing:.5px; flex-shrink:0; }
    .sq-match-result.win { background:rgba(74,222,128,.15); color:#4ade80; }
    .sq-match-result.loss { background:rgba(239,68,68,.12); color:#f87171; }
    .sq-match-result.draw { background:rgba(255,255,255,.07); color:rgba(255,255,255,.4); }
    .sq-match-result.upcoming { background:rgba(255,255,255,.05); color:rgba(255,255,255,.3); }
    .sq-no-matches { text-align:center; padding:32px; color:rgba(255,255,255,.2); display:flex; flex-direction:column; align-items:center; gap:8px; }
    .sq-no-matches i { font-size:1.8rem; opacity:.3; }

    @media(max-width:500px) {
      .sq-panel { width:100%; }
      .sq-header { padding:16px 16px 16px; }
      .sq-close { top:12px; right:12px; width:30px; height:30px; font-size:.8rem; }
      .sq-header-inner { gap:12px; padding-right:36px; }
      .sq-crest { width:52px; height:52px; }
      .sq-crest-fallback { width:52px; height:52px; font-size:1rem; }
      .sq-team-name { font-size:1.1rem; }
      .sq-team-meta { gap:6px; font-size:.6rem; }
      .sq-content { padding:14px 14px; gap:16px; }
      .sq-player { padding:6px 8px; }
      .sq-player-name { font-size:.78rem; }
      .sq-staff-card { padding:12px 14px; }
    }
  `]
})
export class SquadraComponent implements OnInit {
  @Input() teamId!: number;
  @Input() season?: number;
  @Output() close = new EventEmitter<void>();

  team: any = null;
  loading = true;
  activeTab: 'rosa' | 'staff' | 'partite' = 'rosa';
  recentMatches: any[] = [];
  loadingMatches = false;
  get matchSeasons() {
    const cur = new Date().getFullYear();
    return [cur - 1, cur - 2];
  }
  selectedMatchSeason: number | undefined = undefined;

  positions = [
    { key: 'Goalkeeper',  label: 'Portieri',        keys: ['Goalkeeper'] },
    { key: 'Defence',     label: 'Difensori',        keys: ['Defence','Centre-Back','Left-Back','Right-Back'] },
    { key: 'Midfield',    label: 'Centrocampisti',   keys: ['Midfield','Central Midfield','Defensive Midfield','Attacking Midfield'] },
    { key: 'Offence',     label: 'Attaccanti',       keys: ['Offence','Centre-Forward','Left Winger','Right Winger'] },
  ];

  get teamGradient(): string {
    return 'linear-gradient(135deg, rgba(59,130,246,.3), rgba(16,185,129,.15))';
  }

  private http = inject(HttpClient);
  private API = 'https://calciolive-backend.onrender.com/api';
  isFav = false;

  constructor(private footballService: FootballService) {}

  ngOnInit() {
    this.selectedMatchSeason = this.season;
    this.footballService.getTeam(this.teamId).subscribe({
      next: (data) => { this.team = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getByPosition(pos: any): any[] {
    return this.team?.squad?.filter((p: any) => pos.keys.includes(p.position)) ?? [];
  }

  getAge(dateStr: string): number {
    if (!dateStr) return 0;
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  }

  onSeasonChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedMatchSeason = val ? Number(val) : undefined;
    this.recentMatches = [];
    // Forza ricarica passando la stagione direttamente
    this.loadingMatches = true;
    this.footballService.getTeamMatchesFresh(this.teamId, this.selectedMatchSeason).subscribe({
      next: (res: any) => {
        const all = res.matches ?? [];
        this.recentMatches = all.sort((a: any, b: any) =>
          new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime()
        );
        this.loadingMatches = false;
      },
      error: () => { this.loadingMatches = false; }
    });
  }

  loadMatches(force = false) {
    this.activeTab = 'partite';
    if (this.recentMatches.length && !force) return;
    this.loadingMatches = true;
    const s = this.selectedMatchSeason ?? this.season;
    this.footballService.getTeamMatches(this.teamId, s).subscribe({
      next: (res: any) => {
        const all = res.matches ?? [];
        // Ordina per data decrescente (più recenti prima)
        this.recentMatches = all.sort((a: any, b: any) =>
          new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime()
        );
        this.loadingMatches = false;
      },
      error: () => { this.loadingMatches = false; }
    });
  }

  isWin(m: any, side: 'home' | 'away'): boolean {
    const h = m.score?.fullTime?.home ?? 0;
    const a = m.score?.fullTime?.away ?? 0;
    return side === 'home' ? h > a : a > h;
  }

  isLoss(m: any, side: 'home' | 'away'): boolean {
    const h = m.score?.fullTime?.home ?? 0;
    const a = m.score?.fullTime?.away ?? 0;
    return side === 'home' ? h < a : a < h;
  }

  getMatchResult(m: any): string {
    if (m.status !== 'FINISHED') return 'upcoming';
    const h = m.score?.fullTime?.home ?? 0;
    const a = m.score?.fullTime?.away ?? 0;
    const isHome = m.homeTeam.id === this.teamId;
    if (h === a) return 'draw';
    const won = isHome ? h > a : a > h;
    return won ? 'win' : 'loss';
  }

  getMatchResultLabel(m: any): string {
    if (m.status !== 'FINISHED') return 'PROSS';
    const r = this.getMatchResult(m);
    if (r === 'win') return 'V';
    if (r === 'loss') return 'S';
    return 'P';
  }

  loadFavStatus() {
    const token = localStorage.getItem('cl_token');
    if (!token) return;
    this.http.get<any>(`${this.API}/favorite-teams`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.isFav = (res.teams ?? []).some((t: any) => t.team_id === this.teamId);
      }
    });
  }

  toggleFav() {
    const token = localStorage.getItem('cl_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    if (this.isFav) {
      this.http.delete(`${this.API}/favorite-teams/${this.teamId}`, { headers }).subscribe({
        next: () => { this.isFav = false; }
      });
    } else {
      this.http.post(`${this.API}/favorite-teams`, {
        team_id: this.teamId,
        team_name: this.team?.name,
        team_crest: this.team?.crest
      }, { headers }).subscribe({
        next: () => { this.isFav = true; }
      });
    }
  }

  onOverlayClick(e: MouseEvent) { this.close.emit(); }
  onImgError(e: Event) {
    const img = e.target as HTMLImageElement;
    const parent = img.parentElement;
    if (parent) {
      img.style.display = 'none';
      // aggiungi placeholder con iniziali se non già presente
      if (!parent.querySelector('.sq-crest-fallback')) {
        const fb = document.createElement('div');
        fb.className = 'sq-crest-fallback';
        fb.textContent = this.team?.tla ?? '?';
        parent.insertBefore(fb, img.nextSibling);
      }
    }
  }
}
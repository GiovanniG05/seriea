import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation } from '@angular/core';
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
  @Output() close = new EventEmitter<void>();

  team: any = null;
  loading = true;
  activeTab: 'rosa' | 'staff' = 'rosa';

  positions = [
    { key: 'Goalkeeper',  label: 'Portieri',        keys: ['Goalkeeper'] },
    { key: 'Defence',     label: 'Difensori',        keys: ['Defence','Centre-Back','Left-Back','Right-Back'] },
    { key: 'Midfield',    label: 'Centrocampisti',   keys: ['Midfield','Central Midfield','Defensive Midfield','Attacking Midfield'] },
    { key: 'Offence',     label: 'Attaccanti',       keys: ['Offence','Centre-Forward','Left Winger','Right Winger'] },
  ];

  get teamGradient(): string {
    return 'linear-gradient(135deg, rgba(59,130,246,.3), rgba(16,185,129,.15))';
  }

  constructor(private footballService: FootballService) {}

  ngOnInit() {
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
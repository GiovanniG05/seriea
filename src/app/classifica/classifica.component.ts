import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SquadraComponent } from '../squadra/squadra.component';
import { FootballService, Standing } from '../services/football.service';
import { CompetitionService } from '../services/competition.service';

@Component({
  selector: 'app-classifica',
  standalone: true,
  imports: [CommonModule, SquadraComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cl-page">

      <div class="cl-hero">
        <div class="cl-hero-bg"></div>
        <div class="cl-hero-content">
          <div class="cl-hero-left">
            <div class="cl-eyebrow"><i class="fa-solid" [class]="comp.flag" [style.color]="comp.color"></i> {{ comp.name }}</div>
            <h1 class="cl-hero-title">Classifica <span>{{ comp.shortName }}</span></h1>
            <div class="cl-hero-sub" *ngIf="matchday">{{ matchday }}ª Giornata · {{ standings.length }} squadre</div>
          </div>
          <div class="cl-hero-kpis">
            <div class="cl-kpi">
              <div class="cl-kpi-val">{{ standings[0]?.points ?? '–' }}</div>
              <div class="cl-kpi-lbl">Punti 1°</div>
            </div>
            <div class="cl-kpi">
              <div class="cl-kpi-val">{{ standings[0]?.team?.shortName ?? '–' }}</div>
              <div class="cl-kpi-lbl">Leader</div>
            </div>
            <div class="cl-kpi">
              <div class="cl-kpi-val">{{ matchday ?? '–' }}</div>
              <div class="cl-kpi-lbl">Giornata</div>
            </div>
            <div class="cl-kpi">
              <div class="cl-kpi-val">{{ standings.length }}</div>
              <div class="cl-kpi-lbl">Squadre</div>
            </div>
          </div>
        </div>
      </div>

      <div class="cl-loading" *ngIf="loading">
        <div class="cl-spinner"></div>
        <span>Caricamento classifica…</span>
      </div>

      <div class="cl-error" *ngIf="error && !loading">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>{{ error }}</div>
      </div>

      <div class="cl-legenda" *ngIf="!loading && standings.length">
        <div class="cl-leg"><span class="cl-leg-bar champions"></span> Champions League</div>
        <div class="cl-leg"><span class="cl-leg-bar europa"></span> Europa League</div>
        <div class="cl-leg"><span class="cl-leg-bar conference"></span> Conference League</div>
        <div class="cl-leg"><span class="cl-leg-bar retro"></span> Retrocessione</div>
      </div>

      <div class="cl-table-wrap" *ngIf="!loading && standings.length">
        <div class="cl-thead">
          <div class="cl-th cl-th-pos">#</div>
          <div class="cl-th cl-th-team">Squadra</div>
          <div class="cl-th">PG</div>
          <div class="cl-th">V</div>
          <div class="cl-th">P</div>
          <div class="cl-th">S</div>
          <div class="cl-th">GF</div>
          <div class="cl-th">GS</div>
          <div class="cl-th">DR</div>
          <div class="cl-th cl-th-pts">PTS</div>
        </div>
        <div class="cl-tbody">
          <div class="cl-row" *ngFor="let s of standings" [class]="getZoneClass(s.position)" (click)="openTeam(s.team.id)" style="cursor:pointer">
            <div class="cl-zone-bar" [class]="getZoneBarClass(s.position)"></div>
            <div class="cl-td cl-td-pos">
              <span class="cl-pos" [class]="getPosClass(s.position)">{{ s.position }}</span>
            </div>
            <div class="cl-td cl-td-team">
              <img [src]="s.team.crest" [alt]="s.team.name" class="cl-crest" (error)="onImgError($event)">
              <div class="cl-team-info">
                <span class="cl-team-name">{{ s.team.name }}</span>
              </div>
            </div>
            <div class="cl-td cl-td-num">{{ s.playedGames }}</div>
            <div class="cl-td cl-td-num cl-won">{{ s.won }}</div>
            <div class="cl-td cl-td-num cl-draw">{{ s.draw }}</div>
            <div class="cl-td cl-td-num cl-lost">{{ s.lost }}</div>
            <div class="cl-td cl-td-num">{{ s.goalsFor }}</div>
            <div class="cl-td cl-td-num">{{ s.goalsAgainst }}</div>
            <div class="cl-td cl-td-num" [class]="getDRClass(s.goalDifference)">
              {{ s.goalDifference > 0 ? '+' : '' }}{{ s.goalDifference }}
            </div>
            <div class="cl-td cl-td-pts">
              <span class="cl-pts-badge" [class]="getPtsClass(s.position)">{{ s.points }}</span>
            </div>
          </div>
        </div>
      </div>

      <app-squadra
        *ngIf="selectedTeamId"
        [teamId]="selectedTeamId"
        (close)="selectedTeamId = null">
      </app-squadra>

      <div class="cl-footer" *ngIf="!loading && standings.length">
        <span>Dati aggiornati · football-data.org</span>
        <button class="cl-btn-refresh" (click)="load()">
          <i class="fa-solid fa-rotate-right" [class.spin]="loading"></i> Aggiorna
        </button>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,800;0,900&family=JetBrains+Mono:wght@500;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    .cl-page { font-family:'Barlow',sans-serif; display:flex; flex-direction:column; gap:12px; max-width:1060px; margin:0 auto; }

    .cl-hero { background:#0a0f1e; border-radius:16px; padding:24px 32px; position:relative; overflow:hidden; }
    .cl-hero-bg { position:absolute; inset:0; background:radial-gradient(ellipse 40% 60% at 100% 20%,rgba(15,52,120,.4) 0%,transparent 55%); pointer-events:none; }
    .cl-hero-content { position:relative; z-index:1; display:flex; flex-direction:row; justify-content:space-between; align-items:center; gap:32px; flex-wrap:wrap; }
    .cl-eyebrow { font-size:.62rem; font-weight:700; color:rgba(255,255,255,.45); letter-spacing:2.5px; text-transform:uppercase; margin-bottom:8px; }
    .cl-hero-title { font-size:1.9rem; font-weight:900; color:white; margin:0; letter-spacing:-.5px; line-height:1.15; white-space:nowrap; }
    .cl-hero-title span { color:#4ade80; }
    .cl-hero-sub { font-size:.72rem; color:rgba(255,255,255,.45); margin-top:5px; }
    .cl-hero-kpis { display:flex; gap:10px; flex-shrink:0; }
    .cl-kpi { background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px 18px; text-align:center; min-width:80px; }
    .cl-kpi-val { font-size:1.2rem; font-weight:800; font-family:'JetBrains Mono',monospace; color:white; line-height:1; }
    .cl-kpi-lbl { font-size:.58rem; color:rgba(255,255,255,.45); text-transform:uppercase; letter-spacing:.6px; margin-top:4px; }

    .cl-loading { display:flex; align-items:center; justify-content:center; gap:14px; padding:56px; color:#6b7280; background:#0f172a; border-radius:12px; }
    .cl-spinner { width:28px; height:28px; border:3px solid rgba(255,255,255,.06); border-top-color:#4ade80; border-radius:50%; animation:spin .75s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .cl-error { display:flex; align-items:center; gap:12px; padding:18px 24px; background:#1a0a0a; border:1px solid #7f1d1d; border-radius:12px; color:#fca5a5; font-size:.85rem; }

    .cl-legenda { display:flex; gap:16px; flex-wrap:wrap; padding:4px 0; }
    .cl-leg { display:flex; align-items:center; gap:6px; font-size:.72rem; color:rgba(255,255,255,.4); font-weight:600; }
    .cl-leg-bar { width:10px; height:10px; border-radius:2px; }
    .cl-leg-bar.champions  { background:#3b82f6; }
    .cl-leg-bar.europa     { background:#f97316; }
    .cl-leg-bar.conference { background:#16a34a; }
    .cl-leg-bar.retro      { background:#ef4444; }

    .cl-table-wrap { background:#0f172a; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.06); }
    .cl-thead { display:grid; grid-template-columns:4px 44px 1fr 44px 44px 44px 44px 44px 44px 52px 58px; background:#0a0f1e; border-bottom:1px solid rgba(255,255,255,.07); padding:0 8px; }
    .cl-th { padding:10px 6px; text-align:center; font-size:.58rem; font-weight:800; letter-spacing:1px; color:rgba(255,255,255,.3); text-transform:uppercase; }
    .cl-th-team { text-align:left; padding-left:12px; }
    .cl-th-pts { color:#4ade80 !important; }
    .cl-th-pos { }

    .cl-tbody { display:flex; flex-direction:column; }
    .cl-row { display:grid; grid-template-columns:4px 44px 1fr 44px 44px 44px 44px 44px 44px 52px 58px; align-items:center; border-bottom:1px solid rgba(255,255,255,.04); transition:background .12s; padding-right:8px; }
    .cl-row:last-child { border-bottom:none; }
    .cl-row:hover { background:rgba(255,255,255,.03); }

    .cl-zone-bar { height:100%; width:4px; align-self:stretch; }
    .bar-champions  { background:#3b82f6; }
    .bar-europa     { background:#f97316; }
    .bar-conference { background:#16a34a; }
    .bar-retro      { background:#ef4444; }
    .bar-none       { background:transparent; }

    .zone-champions  { background:rgba(59,130,246,.04); }
    .zone-europa     { background:rgba(249,115,22,.03); }
    .zone-conference { background:rgba(22,163,74,.04); }
    .zone-retro      { background:rgba(239,68,68,.04); }

    .cl-td { padding:12px 6px; text-align:center; color:rgba(255,255,255,.75); }
    .cl-td-pos { width:44px; }
    .cl-pos { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:6px; font-size:.72rem; font-weight:800; font-family:'JetBrains Mono',monospace; background:rgba(255,255,255,.07); color:rgba(255,255,255,.5); }
    .pos-1    { background:linear-gradient(135deg,#f59e0b,#d97706); color:white; box-shadow:0 2px 8px rgba(245,158,11,.45); }
    .pos-cl   { background:rgba(59,130,246,.25); color:#93c5fd; }
    .pos-el   { background:rgba(249,115,22,.25); color:#fdba74; }
    .pos-conf { background:rgba(22,163,74,.2); color:#86efac; }
    .pos-retro{ background:rgba(239,68,68,.2); color:#fca5a5; }

    .cl-td-team { text-align:left; padding-left:12px; display:flex; align-items:center; gap:10px; }
    .cl-crest { width:24px; height:24px; object-fit:contain; flex-shrink:0; filter:drop-shadow(0 1px 3px rgba(0,0,0,.5)); }
    .cl-team-name { font-weight:700; color:white; font-size:.85rem; white-space:nowrap; }

    .cl-td-num { font-family:'JetBrains Mono',monospace; font-size:.8rem; color:rgba(255,255,255,.55); }
    .cl-won  { color:#4ade80 !important; font-weight:700; }
    .cl-draw { color:rgba(255,255,255,.5) !important; }
    .cl-lost { color:#f87171 !important; font-weight:700; }
    .dr-pos  { color:#4ade80 !important; font-weight:700; }
    .dr-neg  { color:#f87171 !important; }
    .dr-zero { color:rgba(255,255,255,.3) !important; }

    .cl-td-pts { }
    .cl-pts-badge { display:inline-flex; align-items:center; justify-content:center; width:36px; height:28px; border-radius:7px; font-family:'JetBrains Mono',monospace; font-size:.85rem; font-weight:700; background:rgba(255,255,255,.08); color:white; }
    .pts-top3  { background:linear-gradient(135deg,#f59e0b,#d97706); color:white; box-shadow:0 2px 8px rgba(245,158,11,.35); }
    .pts-cl    { background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:white; box-shadow:0 2px 6px rgba(59,130,246,.3); }
    .pts-retro { background:rgba(239,68,68,.15); color:#fca5a5; }

    .cl-footer { display:flex; justify-content:space-between; align-items:center; padding:6px 4px; font-size:.68rem; color:rgba(255,255,255,.25); font-weight:600; }
    .cl-btn-refresh { padding:7px 16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; font-size:.72rem; font-weight:700; color:rgba(255,255,255,.5); cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; font-family:'Barlow',sans-serif; }
    .cl-btn-refresh:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.2); color:white; }
    .spin { animation:spin .75s linear infinite; }

    @media(max-width:700px) {
      .cl-thead { grid-template-columns:4px 44px 1fr 44px 44px 58px; }
      .cl-row   { grid-template-columns:4px 44px 1fr 44px 44px 58px; }
      .cl-th:nth-child(n+6):not(:last-child):not(:nth-child(10)),
      .cl-td:nth-child(n+6):not(:last-child):not(:nth-child(10)) { display:none; }
    }
  `]
})
export class ClassificaComponent implements OnInit {
  private footballService = inject(FootballService);
  private competitionService = inject(CompetitionService);

  standings: Standing[] = [];
  matchday: number | null = null;
  loading = false;
  error = '';

  get comp() { return this.competitionService.selected; }

  selectedTeamId: number | null = null;

  openTeam(id: number) { this.selectedTeamId = id; }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';

    if (this.competitionService.resultsOnly) {
      this.error = `La classifica per ${this.comp.name} non è disponibile nel piano gratuito.`;
      this.loading = false;
      return;
    }
    this.footballService.getStandings(this.comp.code).subscribe({
      next: (res) => {
        const total = res.standings.find(s => s.type === 'TOTAL');
        this.standings = total?.table ?? [];
        if (!this.standings.length) {
          const any = res.standings[0];
          this.standings = any?.table ?? [];
        }
        this.matchday = res.season?.currentMatchday ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.status === 403
          ? `La classifica per ${this.comp.name} non è disponibile nel piano gratuito.`
          : err.status === 404
          ? `Classifica non disponibile per ${this.comp.name} in questa fase della competizione.`
          : 'Errore nel caricamento.';
        this.loading = false;
      }
    });
  }

  getZoneClass(pos: number): string {
    if (pos <= 4)  return 'zone-champions';
    if (pos === 5) return 'zone-europa';
    if (pos === 6) return 'zone-conference';
    if (pos >= 18) return 'zone-retro';
    return '';
  }

  getZoneBarClass(pos: number): string {
    if (pos <= 4)  return 'cl-zone-bar bar-champions';
    if (pos === 5) return 'cl-zone-bar bar-europa';
    if (pos === 6) return 'cl-zone-bar bar-conference';
    if (pos >= 18) return 'cl-zone-bar bar-retro';
    return 'cl-zone-bar bar-none';
  }

  getPosClass(pos: number): string {
    if (pos === 1) return 'cl-pos pos-1';
    if (pos <= 4)  return 'cl-pos pos-cl';
    if (pos === 5) return 'cl-pos pos-el';
    if (pos === 6) return 'cl-pos pos-conf';
    if (pos >= 18) return 'cl-pos pos-retro';
    return 'cl-pos';
  }

  getPtsClass(pos: number): string {
    if (pos === 1)  return 'cl-pts-badge pts-top3';
    if (pos <= 4)   return 'cl-pts-badge pts-cl';
    if (pos >= 18)  return 'cl-pts-badge pts-retro';
    return 'cl-pts-badge';
  }

  getDRClass(dr: number): string {
    if (dr > 0) return 'cl-td cl-td-num dr-pos';
    if (dr < 0) return 'cl-td cl-td-num dr-neg';
    return 'cl-td cl-td-num dr-zero';
  }

  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
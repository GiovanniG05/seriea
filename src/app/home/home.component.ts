import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FootballService } from '../services/football.service';
import { CompetitionService, Competition, COMPETITIONS } from '../services/competition.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="h-page">

      <!-- ══ HERO ══ -->
      <div class="h-hero">
        <div class="h-hero-bg"></div>
        <div class="h-hero-inner">
          <div class="h-hero-text">
            <div class="h-eyebrow"><i class="fa-solid fa-signal"></i> Live · <img *ngIf="selected.emblem" [src]="selected.emblem" class="h-eyebrow-emblem" (error)="onImgError($event)"> {{ selected.name }}</div>
            <h1 class="h-title">Football<br><span>Dashboard</span></h1>
            <p class="h-desc">Classifica, risultati, marcatori e quote aggiornati in tempo reale.</p>
          </div>
          <div class="h-hero-kpis" *ngIf="standings.length && !selected.resultsOnly">
            <div class="h-kpi">
              <img [src]="standings[0]?.team?.crest" class="h-kpi-crest" (error)="onImgError($event)">
              <div>
                <div class="h-kpi-val">{{ standings[0]?.team?.shortName }}</div>
                <div class="h-kpi-lbl">1° in classifica</div>
              </div>
            </div>
            <div class="h-kpi-sep"></div>
            <div class="h-kpi">
              <div class="h-kpi-num">{{ standings[0]?.points }}</div>
              <div class="h-kpi-lbl">Punti</div>
            </div>
            <div class="h-kpi-sep"></div>
            <div class="h-kpi">
              <div class="h-kpi-num">{{ matchday }}ª</div>
              <div class="h-kpi-lbl">Giornata</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ SELETTORE DIVISO ══ -->
      <div class="h-selector">

        <!-- Coppe -->
        <div class="h-sel-group">
          <div class="h-sel-label">
            <i class="fa-solid fa-star"></i> Coppe Europee
          </div>
          <div class="h-sel-btns">
            <button class="h-sel-btn"
              *ngFor="let c of cups"
              [class.active]="selected.code === c.code"
              [class.disabled]="c.disabled"
              (click)="!c.disabled && selectCompetition(c)"
              [title]="c.disabled ? 'Richiede piano premium' : c.name"
              [style.--tc]="c.color">
              <img *ngIf="c.emblem" [src]="c.emblem" class="h-sel-emblem" (error)="onImgError($event)">
              <i *ngIf="!c.emblem" class="fa-solid" [class]="c.flag"></i>
              <span>{{ c.shortName }}</span>
              <i class="fa-solid fa-lock h-lock-icon" *ngIf="c.disabled"></i>
            </button>
          </div>
        </div>

        <div class="h-sel-divider"></div>

        <!-- Campionati -->
        <div class="h-sel-group">
          <div class="h-sel-label">
            <i class="fa-solid fa-shield-halved"></i> Campionati
          </div>
          <div class="h-sel-btns">
            <button class="h-sel-btn"
              *ngFor="let c of leagues"
              [class.active]="selected.code === c.code"
              (click)="selectCompetition(c)"
              [style.--tc]="c.color">
              <img *ngIf="c.emblem" [src]="c.emblem" class="h-sel-emblem" (error)="onImgError($event)">
              <i *ngIf="!c.emblem" class="fa-solid" [class]="c.flag"></i>
              <span>{{ c.shortName }}</span>
            </button>
          </div>
        </div>

        <div class="h-sel-divider"></div>

        <!-- Nazionali -->
        <div class="h-sel-group">
          <div class="h-sel-label">
            <i class="fa-solid fa-earth-americas"></i> Nazionali
          </div>
          <div class="h-sel-btns">
            <button class="h-sel-btn"
              *ngFor="let c of nationals"
              [class.active]="selected.code === c.code"
              (click)="selectCompetition(c)"
              [style.--tc]="c.color">
              <img *ngIf="c.emblem" [src]="c.emblem" class="h-sel-emblem" (error)="onImgError($event)">
              <i *ngIf="!c.emblem" class="fa-solid" [class]="c.flag"></i>
              <span>{{ c.shortName }}</span>
            </button>
          </div>
        </div>

      </div>

      <!-- ══ LOADING ══ -->
      <div class="h-loading" *ngIf="loading">
        <div class="h-spinner"></div>
        <span>Caricamento {{ selected.name }}…</span>
      </div>

      <ng-container *ngIf="!loading">

        <!-- ══ GRID ══ -->
        <div class="h-grid" *ngIf="standings.length || nextMatches.length">

          <div class="h-card" *ngIf="standings.length && !selected.resultsOnly">
            <div class="h-card-head">
              <span><i class="fa-solid fa-list-ol"></i> Classifica</span>
              <button class="h-card-link" (click)="goTo('classifica')">Vedi tutto →</button>
            </div>
            <div class="h-standing-list">
              <div class="h-standing-row" *ngFor="let s of standings.slice(0,6); let i=index">
                <span class="h-s-pos" [class]="getPosClass(i+1)">{{ i+1 }}</span>
                <img [src]="s.team.crest" class="h-s-crest" (error)="onImgError($event)">
                <span class="h-s-name">{{ s.team.name }}</span>
                <span class="h-s-pg">{{ s.playedGames }}G</span>
                <span class="h-s-pts">{{ s.points }}</span>
              </div>
            </div>
          </div>

          <div class="h-card" *ngIf="nextMatches.length">
            <div class="h-card-head">
              <span><i class="fa-solid fa-calendar-days"></i> Prossime Partite</span>
              <button class="h-card-link" (click)="goTo('risultati')">Calendario →</button>
            </div>
            <div class="h-match-list">
              <div class="h-match" *ngFor="let m of nextMatches">
                <span class="h-match-date">{{ m.utcDate | date:'dd/MM HH:mm' }}</span>
                <div class="h-match-teams">
                  <img [src]="m.homeTeam.crest" class="h-match-crest" (error)="onImgError($event)">
                  <span class="h-match-name">{{ m.homeTeam.shortName }}</span>
                  <span class="h-match-vs">–</span>
                  <span class="h-match-name">{{ m.awayTeam.shortName }}</span>
                  <img [src]="m.awayTeam.crest" class="h-match-crest" (error)="onImgError($event)">
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ══ ESPLORA ══ -->
        <div class="h-explore-wrap">
          <div class="h-sel-label">Esplora</div>
          <div class="h-explore-grid">

            <div class="h-explore-card" (click)="goTo('classifica')" *ngIf="!selected.resultsOnly">
              <div class="h-exp-icon" style="background:rgba(29,78,216,.15);color:#93c5fd">
                <i class="fa-solid fa-list-ol"></i>
              </div>
              <div class="h-exp-body">
                <div class="h-exp-name">Classifica</div>
                <div class="h-exp-desc">Punti, gol, zone europee</div>
              </div>
              <i class="fa-solid fa-chevron-right h-exp-arr"></i>
            </div>

            <div class="h-explore-card" (click)="goTo('risultati')">
              <div class="h-exp-icon" style="background:rgba(22,163,74,.15);color:#86efac">
                <i class="fa-solid fa-calendar-days"></i>
              </div>
              <div class="h-exp-body">
                <div class="h-exp-name">Risultati & Calendario</div>
                <div class="h-exp-desc">Partite con quote integrate</div>
              </div>
              <i class="fa-solid fa-chevron-right h-exp-arr"></i>
            </div>

            <div class="h-explore-card" (click)="goTo('marcatori')" *ngIf="!selected.resultsOnly">
              <div class="h-exp-icon" style="background:rgba(217,119,6,.15);color:#fcd34d">
                <i class="fa-solid fa-shoe-prints"></i>
              </div>
              <div class="h-exp-body">
                <div class="h-exp-name">Marcatori</div>
                <div class="h-exp-desc">Cannonieri e assist</div>
              </div>
              <i class="fa-solid fa-chevron-right h-exp-arr"></i>
            </div>

            <div class="h-explore-card" (click)="goTo('quote')">
              <div class="h-exp-icon" style="background:rgba(124,58,237,.15);color:#c4b5fd">
                <i class="fa-solid fa-percent"></i>
              </div>
              <div class="h-exp-body">
                <div class="h-exp-name">Quote</div>
                <div class="h-exp-desc">1X2, O/U, schedina</div>
              </div>
              <i class="fa-solid fa-chevron-right h-exp-arr"></i>
            </div>

          </div>
        </div>

      </ng-container>

      <div class="h-footer">
        <span><i class="fa-solid fa-circle-info"></i> football-data.org · the-odds-api.com</span>
        <span>Dati live</span>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800&family=JetBrains+Mono:wght@500;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    .h-page { font-family:'Barlow',sans-serif; display:flex; flex-direction:column; gap:16px; }

    /* HERO */
    .h-hero { position:relative; border-radius:18px; overflow:hidden; background:#060d18; }
    .h-hero-bg { position:absolute; inset:0; background:radial-gradient(ellipse 80% 100% at -10% 60%,rgba(15,52,120,.6) 0%,transparent 55%),radial-gradient(ellipse 40% 50% at 110% 10%,rgba(10,60,30,.35) 0%,transparent 50%); pointer-events:none; }
    .h-hero-inner { position:relative; z-index:1; display:flex; justify-content:space-between; align-items:center; padding:32px 40px; gap:32px; flex-wrap:wrap; }
    .h-eyebrow { font-size:.62rem; font-weight:700; letter-spacing:2px; color:#4ade80; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
    .h-eyebrow i { animation:pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    .h-title { font-size:2.4rem; font-weight:900; color:white; line-height:1.05; letter-spacing:-1.5px; margin:0 0 8px; }
    .h-title span { color:#4ade80; font-style:italic; }
    .h-desc { font-size:.8rem; color:rgba(255,255,255,.4); line-height:1.5; }
    .h-hero-kpis { display:flex; align-items:center; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px 20px; flex-shrink:0; }
    .h-kpi { display:flex; align-items:center; gap:10px; padding:0 18px; }
    .h-kpi-crest { width:30px; height:30px; object-fit:contain; }
    .h-kpi-val { font-size:.95rem; font-weight:800; color:white; }
    .h-kpi-num { font-family:'JetBrains Mono',monospace; font-size:1.5rem; font-weight:900; color:white; line-height:1; }
    .h-kpi-lbl { font-size:.55rem; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.8px; margin-top:2px; }
    .h-kpi-sep { width:1px; height:32px; background:rgba(255,255,255,.1); }

    /* SELETTORE */
    .h-selector { background:#0a0f1e; border-radius:14px; padding:16px 20px; display:flex; align-items:flex-start; gap:20px; flex-wrap:wrap; }
    .h-sel-group { display:flex; flex-direction:column; gap:8px; }
    .h-sel-label { font-size:.6rem; font-weight:800; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:1.5px; display:flex; align-items:center; gap:6px; }
    .h-sel-label i { font-size:.6rem; }
    .h-sel-btns { display:flex; gap:6px; flex-wrap:wrap; }
    .h-sel-btn {
      display:flex; align-items:center; gap:7px;
      padding:8px 14px; background:rgba(255,255,255,.04);
      border:1px solid rgba(255,255,255,.07); border-radius:9px;
      cursor:pointer; transition:all .15s;
      font-family:'Barlow',sans-serif; color:rgba(255,255,255,.45);
      font-size:.8rem; font-weight:700;
    }
    .h-sel-btn i { font-size:.8rem; }
.h-sel-emblem { width:18px; height:18px; object-fit:contain; flex-shrink:0; filter:brightness(.8); }
    .h-eyebrow-emblem { width:14px; height:14px; object-fit:contain; vertical-align:middle; margin:0 2px; filter:brightness(0) invert(1); }
    .h-sel-btn.active .h-sel-emblem { opacity:1; }
    .h-sel-btn:hover .h-sel-emblem { opacity:.8; }
    .h-sel-btn:hover { background:rgba(255,255,255,.08); color:white; }
    .h-sel-btn.active { background:rgba(255,255,255,.1); color:white; border-color:rgba(255,255,255,.2); }
    .h-sel-btn.disabled { opacity:.35; cursor:not-allowed; }
    .h-lock-icon { font-size:.6rem; color:rgba(255,255,255,.3); margin-left:2px; }
    .h-sel-btn.active i { color:var(--tc); }
    .h-sel-divider { width:1px; background:rgba(255,255,255,.07); align-self:stretch; margin:0 4px; }

    /* LOADING */
    .h-loading { display:flex; align-items:center; justify-content:center; gap:14px; padding:48px; color:#6b7280; background:#0f172a; border-radius:12px; }
    .h-spinner { width:26px; height:26px; border:3px solid rgba(255,255,255,.06); border-top-color:#4ade80; border-radius:50%; animation:spin .75s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* GRID */
    .h-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

    /* CARD */
    .h-card { background:#0f172a; border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:18px 20px; }
    .h-card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
    .h-card-head > span { font-size:.78rem; font-weight:800; color:white; display:flex; align-items:center; gap:7px; }
    .h-card-head i { color:rgba(255,255,255,.3); font-size:.7rem; }
    .h-card-link { background:none; border:none; color:rgba(255,255,255,.3); font-size:.65rem; font-weight:700; cursor:pointer; font-family:'Barlow',sans-serif; transition:color .15s; }
    .h-card-link:hover { color:#4ade80; }

    /* standing */
    .h-standing-list { display:flex; flex-direction:column; gap:5px; }
    .h-standing-row { display:flex; align-items:center; gap:8px; padding:5px 7px; border-radius:7px; transition:background .1s; }
    .h-standing-row:hover { background:rgba(255,255,255,.03); }
    .h-s-pos { width:22px; height:22px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:.62rem; font-weight:800; font-family:'JetBrains Mono',monospace; flex-shrink:0; }
    .pos-s-gold { background:linear-gradient(135deg,#f59e0b,#d97706); color:white; }
    .pos-s-blue { background:rgba(59,130,246,.25); color:#93c5fd; }
    .pos-s-def  { background:rgba(255,255,255,.07); color:rgba(255,255,255,.4); }
    .h-s-crest { width:20px; height:20px; object-fit:contain; flex-shrink:0; }
    .h-s-name { flex:1; font-size:.78rem; font-weight:700; color:rgba(255,255,255,.75); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .h-s-pg { font-size:.62rem; color:rgba(255,255,255,.2); font-weight:600; }
    .h-s-pts { font-family:'JetBrains Mono',monospace; font-size:.85rem; font-weight:800; color:white; min-width:24px; text-align:right; }

    /* matches */
    .h-match-list { display:flex; flex-direction:column; gap:9px; }
    .h-match { display:flex; align-items:center; gap:10px; padding-bottom:9px; border-bottom:1px solid rgba(255,255,255,.04); }
    .h-match:last-child { border-bottom:none; padding-bottom:0; }
    .h-match-date { font-size:.62rem; font-weight:700; color:rgba(255,255,255,.3); white-space:nowrap; min-width:70px; }
    .h-match-teams { display:flex; align-items:center; gap:6px; flex:1; }
    .h-match-crest { width:18px; height:18px; object-fit:contain; flex-shrink:0; }
    .h-match-name { font-size:.75rem; font-weight:700; color:rgba(255,255,255,.7); }
    .h-match-vs { font-size:.6rem; color:rgba(255,255,255,.2); font-weight:900; }

    /* esplora */
    .h-explore-wrap { display:flex; flex-direction:column; gap:8px; }
    .h-explore-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
    .h-explore-card { background:#0f172a; border:1px solid rgba(255,255,255,.06); border-radius:13px; padding:16px 18px; display:flex; align-items:center; gap:14px; cursor:pointer; transition:all .15s; }
    .h-explore-card:hover { background:#111827; border-color:rgba(255,255,255,.1); transform:translateY(-2px); }
    .h-exp-icon { width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; }
    .h-exp-body { flex:1; }
    .h-exp-name { font-size:.88rem; font-weight:800; color:white; margin-bottom:2px; }
    .h-exp-desc { font-size:.68rem; color:rgba(255,255,255,.35); }
    .h-exp-arr { color:rgba(255,255,255,.2); font-size:.7rem; }

    /* footer */
    .h-footer { display:flex; justify-content:space-between; font-size:.62rem; color:rgba(255,255,255,.2); font-weight:600; padding:4px 0; }

    @media(max-width:900px) {
      .h-grid { grid-template-columns:1fr; }
      .h-explore-grid { grid-template-columns:1fr 1fr; }
      .h-selector { flex-wrap:wrap; gap:14px; }
      .h-sel-divider { display:none; }
    }
    @media(max-width:600px) {
      .h-explore-grid { grid-template-columns:1fr; }
      .h-hero-inner { flex-direction:column; align-items:flex-start; gap:16px; padding:24px 20px; }
      .h-hero-kpis { width:100%; justify-content:space-between; padding:12px 16px; }
      .h-kpi { padding:0 10px; }
      .h-kpi-num { font-size:1.2rem; }
      .h-title { font-size:1.7rem; }
      .h-desc { font-size:.75rem; }
      .h-selector { flex-direction:column; gap:12px; padding:14px 16px; }
      .h-sel-divider { width:100%; height:1px; margin:2px 0; }
      .h-sel-btns { gap:5px; }
      .h-sel-btn { padding:7px 10px; font-size:.72rem; }
      .h-card { padding:14px 16px; }
      .h-s-name { font-size:.72rem; }
      .h-match-name { font-size:.68rem; }
      .h-explore-card { padding:12px 14px; }
      .h-exp-name { font-size:.8rem; }
      .h-exp-desc { font-size:.62rem; }
      .h-exp-icon { width:36px; height:36px; font-size:.85rem; }
    }
  `]
})
export class HomeComponent implements OnInit {
  @Output() navigateTo = new EventEmitter<string>();

  get cups()      { return COMPETITIONS.filter(c => c.type === 'cup'); }
  get nationals()  { return COMPETITIONS.filter(c => c.type === 'national'); }
  get leagues()    { return COMPETITIONS.filter(c => c.type === 'league'); }
  get selected() { return this.competitionService.selected; }

  standings:   any[] = [];
  nextMatches: any[] = [];
  matchday = 0;
  loading = false;

  constructor(
    private footballService: FootballService,
    private competitionService: CompetitionService
  ) {}

  ngOnInit() { this.loadData(); }

  selectCompetition(c: Competition) {
    this.competitionService.select(c);
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.standings = [];
    this.nextMatches = [];

    if (!this.selected.resultsOnly && this.selected.type !== 'cup' || this.selected.code === 'CL') {
      this.footballService.getStandings(this.selected.code).subscribe({
        next: (res) => {
          const total = res.standings.find((s: any) => s.type === 'TOTAL');
          this.standings = total?.table ?? [];
          this.matchday = res.season?.currentMatchday ?? 0;
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    } else {
      this.loading = false;
    }

    this.footballService.getMatches(this.selected.code).subscribe({
      next: (res) => {
        this.nextMatches = res.matches
          .filter((m: any) => m.status === 'SCHEDULED' || m.status === 'TIMED')
          .slice(0, 6);
      },
      error: () => {}
    });
  }

  goTo(section: string) {
    this.navigateTo.emit(section);
  }

  getPosClass(pos: number): string {
    if (pos === 1) return 'h-s-pos pos-s-gold';
    if (pos <= 4)  return 'h-s-pos pos-s-blue';
    return 'h-s-pos pos-s-def';
  }

  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
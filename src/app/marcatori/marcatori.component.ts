import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FootballService } from '../services/football.service';
import { CompetitionService } from '../services/competition.service';

interface Scorer {
  player: { id: number; name: string; nationality: string; };
  team: { id: number; name: string; shortName: string; crest: string; };
  goals: number;
  assists: number | null;
  penalties: number | null;
}

@Component({
  selector: 'app-marcatori',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mar-page">

      <div class="mar-hero">
        <div class="mar-hero-bg"></div>
        <div class="mar-hero-inner">
          <div class="mar-hero-left">
            <div class="mar-eyebrow"><i class="fa-solid" [class]="comp.flag" [style.color]="comp.color"></i> {{ comp.name }}</div>
            <h1 class="mar-hero-title">Classifica <span>Marcatori</span></h1>
            <div class="mar-hero-sub" *ngIf="scorers.length">
              Capocannoniere: <strong>{{ scorers[0]?.player?.name }}</strong> — {{ scorers[0]?.goals }} gol
            </div>
          </div>
          <div class="mar-hero-stats" *ngIf="scorers.length">
            <div class="mar-hstat">
              <div class="mar-hstat-val">{{ scorers[0]?.goals }}</div>
              <div class="mar-hstat-lbl">Gol leader</div>
            </div>
            <div class="mar-hstat-divider"></div>
            <div class="mar-hstat">
              <div class="mar-hstat-val">{{ totalGoals }}</div>
              <div class="mar-hstat-lbl">Gol totali top 10</div>
            </div>
          </div>
        </div>
      </div>

      <div class="mar-loading" *ngIf="loading">
        <div class="mar-spinner"></div>
        <span>Caricamento marcatori…</span>
      </div>

      <div class="mar-error" *ngIf="error && !loading">
        <i class="fa-solid fa-lock"></i>
        <span>{{ error }}</span>
      </div>

      <div class="mar-podio" *ngIf="!loading && scorers.length >= 3">
        <div class="mar-pod-card second">
          <div class="mar-pod-pos">2°</div>
          <img [src]="scorers[1].team.crest" class="mar-pod-crest" (error)="onImgError($event)">
          <div class="mar-pod-name">{{ scorers[1].player.name }}</div>
          <div class="mar-pod-team">{{ scorers[1].team.shortName }}</div>
          <div class="mar-pod-goals">{{ scorers[1].goals }} <span>gol</span></div>
        </div>
        <div class="mar-pod-card first">
          <div class="mar-pod-crown"><i class="fa-solid fa-crown"></i></div>
          <div class="mar-pod-pos">1°</div>
          <img [src]="scorers[0].team.crest" class="mar-pod-crest" (error)="onImgError($event)">
          <div class="mar-pod-name">{{ scorers[0].player.name }}</div>
          <div class="mar-pod-team">{{ scorers[0].team.shortName }}</div>
          <div class="mar-pod-goals">{{ scorers[0].goals }} <span>gol</span></div>
        </div>
        <div class="mar-pod-card third">
          <div class="mar-pod-pos">3°</div>
          <img [src]="scorers[2].team.crest" class="mar-pod-crest" (error)="onImgError($event)">
          <div class="mar-pod-name">{{ scorers[2].player.name }}</div>
          <div class="mar-pod-team">{{ scorers[2].team.shortName }}</div>
          <div class="mar-pod-goals">{{ scorers[2].goals }} <span>gol</span></div>
        </div>
      </div>

      <div class="mar-table-wrap" *ngIf="!loading && scorers.length">
        <div class="mar-thead">
          <div class="mar-th mar-th-pos">#</div>
          <div class="mar-th mar-th-player">Giocatore</div>
          <div class="mar-th">Squadra</div>
          <div class="mar-th mar-th-goals">Gol</div>
          <div class="mar-th">Assist</div>
          <div class="mar-th">Rigori</div>
          <div class="mar-th mar-th-bar">Rendimento</div>
        </div>
        <div class="mar-tbody">
          <div class="mar-row" *ngFor="let s of scorers; let i = index" [class.top3]="i < 3">
            <div class="mar-td mar-td-pos">
              <span class="mar-pos" [class]="getPosClass(i+1)">{{ i+1 }}</span>
            </div>
            <div class="mar-td mar-td-player">
              <div class="mar-player-info">
                <span class="mar-player-name">{{ s.player.name }}</span>
                <span class="mar-player-nat">{{ s.player.nationality }}</span>
              </div>
            </div>
            <div class="mar-td mar-td-team">
              <img [src]="s.team.crest" class="mar-crest" (error)="onImgError($event)">
              <span class="mar-team-name">{{ s.team.shortName }}</span>
            </div>
            <div class="mar-td mar-td-goals">
              <span class="mar-goals-badge" [class]="getPosClass(i+1)">{{ s.goals }}</span>
            </div>
            <div class="mar-td">{{ s.assists ?? '–' }}</div>
            <div class="mar-td">{{ s.penalties ?? '–' }}</div>
            <div class="mar-td mar-td-bar">
              <div class="mar-bar-wrap">
                <div class="mar-bar-fill" [style.width]="getBarPct(s.goals) + '%'" [class]="getPosClass(i+1)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mar-footer" *ngIf="!loading">
        <span><i class="fa-solid fa-circle-info"></i> Dati football-data.org</span>
        <button class="mar-refresh-btn" (click)="load()">
          <i class="fa-solid fa-rotate-right" [class.spin]="loading"></i> Aggiorna
        </button>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; }

    .mar-page { font-family:'Barlow',sans-serif; max-width:1060px; margin:0 auto; display:flex; flex-direction:column; gap:14px; }

    .mar-hero { position:relative; border-radius:16px; overflow:hidden; background:#0a0f1e; }
    .mar-hero-bg { position:absolute; inset:0; background:radial-gradient(ellipse 40% 60% at 100% 20%,rgba(15,52,120,.4) 0%,transparent 55%); pointer-events:none; }
    .mar-hero-inner { position:relative; z-index:1; padding:28px 36px; display:flex; justify-content:space-between; align-items:center; gap:24px; flex-wrap:wrap; }
    .mar-eyebrow { font-size:.6rem; font-weight:700; letter-spacing:3px; color:rgba(255,255,255,.4); text-transform:uppercase; margin-bottom:4px; }
    .mar-hero-title { font-size:2.2rem; font-weight:900; color:white; letter-spacing:-1px; line-height:1; text-transform:uppercase; }
    .mar-hero-title span { color:#4ade80; }
    .mar-hero-sub { font-size:.78rem; color:rgba(255,255,255,.35); margin-top:4px; font-weight:600; }
    .mar-hero-sub strong { color:#4ade80; }
    .mar-hero-stats { display:flex; align-items:center; }
    .mar-hstat { text-align:center; padding:0 28px; }
    .mar-hstat-val { font-size:1.8rem; font-weight:900; color:white; font-family:'JetBrains Mono',monospace; letter-spacing:-1px; line-height:1; }
    .mar-hstat-lbl { font-size:.6rem; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:1px; margin-top:5px; }
    .mar-hstat-divider { width:1px; height:40px; background:rgba(255,255,255,.1); }

    .mar-loading { display:flex; align-items:center; justify-content:center; gap:14px; padding:56px; color:#6b7280; background:#0f172a; border-radius:12px; }
    .mar-spinner { width:28px; height:28px; border:3px solid rgba(255,255,255,.06); border-top-color:#4ade80; border-radius:50%; animation:spin .75s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .mar-error { display:flex; align-items:center; gap:12px; padding:18px 24px; background:#1a0a0a; border:1px solid #7f1d1d; border-radius:12px; color:#fca5a5; font-size:.85rem; font-weight:600; }

    .mar-podio { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
    .mar-pod-card {
      background:#0f172a; border:1px solid rgba(255,255,255,.06);
      border-radius:14px; padding:20px 16px; text-align:center;
      position:relative; transition:all .2s;
    }
    .mar-pod-card:hover { transform:translateY(-3px); }
    .mar-pod-card.first { background:linear-gradient(180deg,rgba(59,130,246,.08) 0%,#0f172a 100%); border-color:rgba(59,130,246,.3); }
    .mar-pod-card.second { background:linear-gradient(180deg,rgba(148,163,184,.06) 0%,#0f172a 100%); }
    .mar-pod-card.third { background:linear-gradient(180deg,rgba(205,127,50,.06) 0%,#0f172a 100%); }
    .mar-pod-crown { position:absolute; top:-10px; left:50%; transform:translateX(-50%); font-size:.9rem; color:#f59e0b; }
    .mar-pod-pos { font-size:.65rem; font-weight:800; color:rgba(255,255,255,.3); letter-spacing:1px; margin-bottom:10px; }
    .mar-pod-crest { width:40px; height:40px; object-fit:contain; margin-bottom:8px; filter:drop-shadow(0 2px 4px rgba(0,0,0,.5)); }
    .mar-pod-name { font-size:.88rem; font-weight:800; color:white; margin-bottom:3px; line-height:1.2; }
    .mar-pod-team { font-size:.65rem; font-weight:600; color:rgba(255,255,255,.3); margin-bottom:10px; }
    .mar-pod-goals { font-size:1.6rem; font-weight:900; color:white; font-family:'JetBrains Mono',monospace; }
    .mar-pod-goals span { font-size:.7rem; font-weight:700; color:rgba(255,255,255,.4); }
    .mar-pod-card.first .mar-pod-goals { color:#93c5fd; }

    .mar-table-wrap { background:#0f172a; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.06); }
    .mar-thead { display:grid; grid-template-columns:44px 1fr 140px 60px 60px 60px 1fr; background:#0a0f1e; border-bottom:1px solid rgba(255,255,255,.07); padding:0 8px; }
    .mar-th { padding:10px 8px; text-align:center; font-size:.58rem; font-weight:800; letter-spacing:1px; color:rgba(255,255,255,.3); text-transform:uppercase; }
    .mar-th-player { text-align:left; padding-left:12px; }
    .mar-th-goals { color:#4ade80 !important; }

    .mar-tbody { display:flex; flex-direction:column; }
    .mar-row { display:grid; grid-template-columns:44px 1fr 140px 60px 60px 60px 1fr; align-items:center; border-bottom:1px solid rgba(255,255,255,.04); padding:12px 8px; transition:background .12s; }
    .mar-row:last-child { border-bottom:none; }
    .mar-row:hover { background:rgba(255,255,255,.02); }
    .mar-row.top3 { background:rgba(59,130,246,.03); }

    .mar-td { text-align:center; font-size:.82rem; font-weight:600; color:rgba(255,255,255,.5); padding:0 4px; }
    .mar-td-pos { }
    .mar-pos { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:6px; font-size:.75rem; font-weight:800; font-family:'JetBrains Mono',monospace; background:rgba(255,255,255,.07); color:rgba(255,255,255,.5); }
    .pos-1 { background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:white; box-shadow:0 2px 8px rgba(59,130,246,.4); }
    .pos-2 { background:linear-gradient(135deg,#94a3b8,#64748b); color:white; }
    .pos-3 { background:linear-gradient(135deg,#cd7f32,#a0522d); color:white; }

    .mar-td-player { text-align:left; padding-left:12px; }
    .mar-player-info { display:flex; flex-direction:column; }
    .mar-player-name { font-size:.88rem; font-weight:800; color:white; }
    .mar-player-nat { font-size:.62rem; color:rgba(255,255,255,.3); font-weight:600; }

    .mar-td-team { display:flex; align-items:center; gap:8px; justify-content:center; }
    .mar-crest { width:22px; height:22px; object-fit:contain; }
    .mar-team-name { font-size:.75rem; font-weight:700; color:rgba(255,255,255,.5); }

    .mar-td-goals { }
    .mar-goals-badge { display:inline-flex; align-items:center; justify-content:center; width:34px; height:28px; border-radius:7px; font-family:'JetBrains Mono',monospace; font-size:.88rem; font-weight:700; background:rgba(255,255,255,.07); color:white; }
    .mar-goals-badge.pos-1 { background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:white; box-shadow:0 2px 6px rgba(59,130,246,.3); }
    .mar-goals-badge.pos-2 { background:rgba(148,163,184,.15); color:#cbd5e1; }
    .mar-goals-badge.pos-3 { background:rgba(205,127,50,.15); color:#d4a76a; }

    .mar-td-bar { padding:0 12px; }
    .mar-bar-wrap { height:5px; background:rgba(255,255,255,.06); border-radius:3px; overflow:hidden; }
    .mar-bar-fill { height:100%; border-radius:3px; background:rgba(255,255,255,.2); transition:width .6s; }
    .mar-bar-fill.pos-1 { background:linear-gradient(90deg,#3b82f6,#60a5fa); }
    .mar-bar-fill.pos-2 { background:#64748b; }
    .mar-bar-fill.pos-3 { background:#cd7f32; }

    .mar-footer { display:flex; justify-content:space-between; align-items:center; padding:6px 4px; font-size:.68rem; color:rgba(255,255,255,.25); font-weight:600; }
    .mar-footer i { margin-right:4px; }
    .mar-refresh-btn { padding:7px 16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; font-size:.72rem; font-weight:700; color:rgba(255,255,255,.5); cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; font-family:'Barlow',sans-serif; }
    .mar-refresh-btn:hover { background:rgba(59,130,246,.1); border-color:#3b82f6; color:#93c5fd; }
    .spin { animation:spin .75s linear infinite; }

    @media(max-width:700px) {
      .mar-podio { grid-template-columns:1fr; }
      .mar-thead { grid-template-columns:44px 1fr 100px 50px 1fr; }
      .mar-row   { grid-template-columns:44px 1fr 100px 50px 1fr; }
      .mar-th:nth-child(5), .mar-th:nth-child(6),
      .mar-td:nth-child(5), .mar-td:nth-child(6) { display:none; }
    }
  `]
})
export class MarcatoriComponent implements OnInit {
  scorers: Scorer[] = [];
  loading = false;
  error = '';

  get totalGoals(): number { return this.scorers.reduce((s, sc) => s + sc.goals, 0); }

  constructor(private footballService: FootballService, private competitionService: CompetitionService) {}
  get comp() { return this.competitionService.selected; }
  ngOnInit() { this.load(); }

  private readonly NO_SCORERS = ['EL', 'ECL'];

  load() {
    this.loading = true;
    this.error = '';
    this.scorers = [];

    if (this.competitionService.resultsOnly || this.NO_SCORERS.includes(this.comp.code)) {
      this.error = `I marcatori per ${this.comp.name} non sono disponibili nel piano gratuito.`;
      this.loading = false;
      return;
    }

    this.footballService.getScorers(this.comp.code).subscribe({
      next: (res: any) => {
        this.scorers = res.scorers ?? [];
        if (!this.scorers.length) {
          this.error = 'Nessun marcatore disponibile per questa competizione.';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.status === 403
          ? `I marcatori per ${this.comp.name} non sono disponibili nel piano gratuito.`
          : 'Errore nel caricamento marcatori.';
        this.loading = false;
      }
    });
  }

  getBarPct(goals: number): number {
    const max = this.scorers[0]?.goals ?? 1;
    return Math.round((goals / max) * 100);
  }

  getPosClass(pos: number): string {
    if (pos === 1) return 'pos-1';
    if (pos === 2) return 'pos-2';
    if (pos === 3) return 'pos-3';
    return '';
  }

  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FootballService } from '../services/football.service';
import { CompetitionService } from '../services/competition.service';
import { OddsService } from '../services/odds.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-risultati',
  standalone: true,
  imports: [CommonModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="res-page">

      <div class="res-hero">
        <div class="res-hero-bg"></div>
        <div class="res-hero-inner">
          <div class="res-hero-left">
            <div class="res-eyebrow"><i class="fa-solid" [class]="comp.flag" [style.color]="comp.color"></i> {{ comp.name }}</div>
            <h1 class="res-hero-title">Risultati <span>& Calendario</span></h1>
            <div class="res-hero-sub">{{ finishedCount }} terminati · {{ scheduledCount }} in programma</div>
          </div>
          <div class="res-nav" *ngIf="!isCup">
            <button class="res-nav-btn" (click)="changeMatchday(-1)" [disabled]="currentMatchday <= 1 || loading">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <div class="res-nav-mid">
              <span class="res-nav-lbl">Giornata</span>
              <span class="res-nav-num">{{ currentMatchday }}</span>
            </div>
            <button class="res-nav-btn" (click)="changeMatchday(1)" [disabled]="currentMatchday >= 38 || loading">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="res-loading" *ngIf="loading">
        <div class="res-spinner"></div>
        <span>Caricamento partite…</span>
      </div>

      <div class="res-bracket-wrap" *ngIf="isCup && !loading && bracketRounds.length && selectedStage !== 'LEAGUE_STAGE'">
        <div class="res-bracket-header">
          <i class="fa-solid fa-diagram-project"></i> Fase ad Eliminazione Diretta
          <span class="res-bracket-hint">Clicca su una sfida per i dettagli</span>
        </div>
        <div class="res-bracket">
          <div class="res-br-round" *ngFor="let round of bracketRounds">
            <div class="res-br-label">{{ round.label }}</div>
            <div class="res-br-ties">
              <div class="res-br-tie"
                *ngFor="let tie of round.ties"
                (click)="openTie(tie)">
                <div class="res-br-team" [class.winner]="tieWinner(tie)==='home'" [class.tbd]="!tie.home">
                  <img *ngIf="tie.home" [src]="tie.homeCrest" class="res-br-crest" (error)="onImgError($event)">
                  <div *ngIf="!tie.home" class="res-br-crest-placeholder"></div>
                  <span class="res-br-name">{{ tie.home ?? 'TBD' }}</span>
                  <span class="res-br-agg" *ngIf="tie.homeAgg !== null">{{ tie.homeAgg }}</span>
                </div>
                <div class="res-br-sep"></div>
                <div class="res-br-team" [class.winner]="tieWinner(tie)==='away'" [class.tbd]="!tie.away">
                  <img *ngIf="tie.away" [src]="tie.awayCrest" class="res-br-crest" (error)="onImgError($event)">
                  <div *ngIf="!tie.away" class="res-br-crest-placeholder"></div>
                  <span class="res-br-name">{{ tie.away ?? 'TBD' }}</span>
                  <span class="res-br-agg" *ngIf="tie.awayAgg !== null">{{ tie.awayAgg }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="res-modal-overlay" *ngIf="selectedTie" (click)="closeTie()">
        <div class="res-modal" (click)="$event.stopPropagation()">
          <button class="res-modal-close" (click)="closeTie()">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div class="res-modal-title">{{ selectedTie.home }} vs {{ selectedTie.away }}</div>
          <div class="res-modal-stage">{{ selectedTie.stageLabel }}</div>

          <div class="res-modal-legs">
            <div class="res-modal-leg" *ngFor="let m of selectedTie.matches; let i=index">
              <div class="res-modal-leg-label">{{ i === 0 ? 'Andata' : 'Ritorno' }}</div>
              <div class="res-modal-leg-date">{{ m.utcDate | date:'dd MMM yyyy · HH:mm' }}</div>
              <div class="res-modal-leg-teams">
                <div class="res-modal-team" [class.winner]="isWinner(m,'home')">
                  <img [src]="m.homeTeam?.crest" class="res-modal-crest" (error)="onImgError($event)">
                  <span>{{ m.homeTeam?.shortName }}</span>
                </div>
                <div class="res-modal-score" *ngIf="isPlayed(m.status)">
                  {{ m.score?.fullTime?.home }} – {{ m.score?.fullTime?.away }}
                </div>
                <div class="res-modal-score tbd" *ngIf="!isPlayed(m.status)">
                  {{ m.utcDate | date:'HH:mm' }}
                </div>
                <div class="res-modal-team away" [class.winner]="isWinner(m,'away')">
                  <span>{{ m.awayTeam?.shortName }}</span>
                  <img [src]="m.awayTeam?.crest" class="res-modal-crest" (error)="onImgError($event)">
                </div>
              </div>
            </div>
          </div>

          <div class="res-modal-agg" *ngIf="selectedTie.homeAgg !== null">
            <span>Aggregato</span>
            <span class="res-modal-agg-score">
              {{ selectedTie.home }} <strong>{{ selectedTie.homeAgg }} – {{ selectedTie.awayAgg }}</strong> {{ selectedTie.away }}
            </span>
          </div>
        </div>
      </div>

      <div class="res-nav" *ngIf="isCup && !loading && selectedStage === 'LEAGUE_STAGE'">
        <button class="res-nav-btn" (click)="prevGroupMatchday()" [disabled]="groupMatchday <= 1">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <div class="res-nav-mid">
          <span class="res-nav-lbl">Giornata</span>
          <span class="res-nav-num">{{ groupMatchday }}</span>
        </div>
        <button class="res-nav-btn" (click)="nextGroupMatchday()" [disabled]="groupMatchday >= maxGroupMatchday">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <div class="res-stage-filter" *ngIf="isCup && !loading && allMatches.length">
        <button class="res-stage-btn"
          *ngFor="let s of availableStages"
          [class.active]="selectedStage === s.key"
          (click)="selectStage(s.key)">
          {{ s.label }}
        </button>
      </div>

      <div class="res-list">
        <div class="res-match" *ngFor="let m of filteredMatches" [class]="getRowClass(m.status)">

          <div class="res-meta">
            <span class="res-status-badge" [class]="'sbadge-' + getStatusClass(m.status)">
              {{ getStatusLabel(m.status) }}
            </span>
            <span class="res-date">{{ m.utcDate | date:'dd MMM' }}</span>
            <span class="res-hour">{{ m.utcDate | date:'HH:mm' }}</span>
          </div>

          <div class="res-teams">
            <div class="res-team home">
              <span class="res-team-name" [class.winner]="isWinner(m,'home')">{{ m.homeTeam.name }}</span>
              <img [src]="m.homeTeam.crest" class="res-crest" (error)="onImgError($event)">
            </div>
            <div class="res-score-wrap">
              <div class="res-score" *ngIf="isPlayed(m.status)">
                <span [class.winner]="isWinner(m,'home')">{{ m.score.fullTime.home }}</span>
                <span class="res-score-sep">–</span>
                <span [class.winner]="isWinner(m,'away')">{{ m.score.fullTime.away }}</span>
              </div>
              <div class="res-score-tbd" *ngIf="!isPlayed(m.status)">
                {{ m.utcDate | date:'HH:mm' }}
              </div>
            </div>
            <div class="res-team away">
              <img [src]="m.awayTeam.crest" class="res-crest" (error)="onImgError($event)">
              <span class="res-team-name" [class.winner]="isWinner(m,'away')">{{ m.awayTeam.name }}</span>
            </div>
          </div>

          <div class="res-odds" *ngIf="!isPlayed(m.status)">
            <ng-container *ngIf="m.odds; else noOdds">
              <div class="res-odd-box">
                <span class="res-odd-lbl">1</span>
                <span class="res-odd-val">{{ m.odds.home }}</span>
              </div>
              <div class="res-odd-box">
                <span class="res-odd-lbl">X</span>
                <span class="res-odd-val">{{ m.odds.draw }}</span>
              </div>
              <div class="res-odd-box">
                <span class="res-odd-lbl">2</span>
                <span class="res-odd-val">{{ m.odds.away }}</span>
              </div>
              <a class="res-bet-link" href="https://www.snai.it/scommesse/calcio/italia/serie-a" target="_blank" title="Scommetti su SNAI">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </ng-container>
            <ng-template #noOdds>
              <span class="res-no-odds">Quote N.D.</span>
            </ng-template>
          </div>

          <div class="res-final-tag" *ngIf="isPlayed(m.status)">FINALE</div>

        </div>

        <div class="res-empty" *ngIf="filteredMatches.length === 0">
          <i class="fa-solid fa-calendar-xmark"></i>
          <span>Nessuna partita per questa giornata</span>
        </div>
      </div>

      <div class="res-footer" *ngIf="!loading">
        <span><i class="fa-solid fa-circle-info"></i> football-data.org · the-odds-api.com</span>
        <button class="res-refresh-btn" (click)="initData()">
          <i class="fa-solid fa-rotate-right" [class.spin]="loading"></i> Aggiorna
        </button>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; }

    .res-page { font-family:'Barlow',sans-serif; max-width:1060px; margin:0 auto; display:flex; flex-direction:column; gap:12px; }

    .res-hero { position:relative; border-radius:16px; overflow:hidden; background:#0a0f1e; }
    .res-hero-bg { position:absolute; inset:0; background:radial-gradient(ellipse 40% 60% at 100% 20%,rgba(15,52,120,.4) 0%,transparent 55%); pointer-events:none; }
    .res-hero-inner { position:relative; z-index:1; padding:28px 36px; display:flex; justify-content:space-between; align-items:center; gap:24px; flex-wrap:wrap; }
    .res-eyebrow { font-size:.6rem; font-weight:700; letter-spacing:3px; color:rgba(255,255,255,.4); text-transform:uppercase; margin-bottom:4px; }
    .res-hero-title { font-size:2.2rem; font-weight:900; color:white; letter-spacing:-1px; line-height:1; text-transform:uppercase; }
    .res-hero-title span { color:#4ade80; }
    .res-hero-sub { font-size:.78rem; font-weight:600; color:rgba(255,255,255,.35); margin-top:4px; }

    .res-nav { display:flex; align-items:center; gap:14px; }
    .res-nav-btn { width:40px; height:40px; border-radius:10px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.6); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; font-size:.85rem; }
    .res-nav-btn:hover:not(:disabled) { background:rgba(255,255,255,.12); border-color:rgba(255,255,255,.2); color:white; }
    .res-nav-btn:disabled { opacity:.3; cursor:default; }
    .res-nav-mid { text-align:center; }
    .res-nav-lbl { display:block; font-size:.55rem; font-weight:800; color:#4ade80; letter-spacing:2px; text-transform:uppercase; }
    .res-nav-num { font-size:1.8rem; font-weight:900; color:white; font-family:'JetBrains Mono',monospace; line-height:1.1; }

    .res-loading { display:flex; align-items:center; justify-content:center; gap:14px; padding:56px; color:#6b7280; background:#0f172a; border-radius:12px; }
    .res-spinner { width:28px; height:28px; border:3px solid rgba(255,255,255,.06); border-top-color:#4ade80; border-radius:50%; animation:spin .75s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .res-list { display:flex; flex-direction:column; gap:5px; }

    .res-match {
      display:grid;
      grid-template-columns: 110px 1fr 200px;
      align-items:center; gap:16px;
      background:#0f172a; border:1px solid rgba(255,255,255,.05);
      border-radius:11px; padding:14px 20px;
      transition:all .15s;
    }
    .res-match:hover { background:#111827; border-color:rgba(255,255,255,.09); }
    .res-match.row-live { background:rgba(74,222,128,.03); border-color:rgba(74,222,128,.12); }

    .res-meta { display:flex; flex-direction:column; gap:4px; }
    .res-status-badge { font-size:.55rem; font-weight:800; letter-spacing:.8px; text-transform:uppercase; padding:2px 7px; border-radius:4px; display:inline-block; width:fit-content; }
    .sbadge-finished  { background:rgba(255,255,255,.07); color:rgba(255,255,255,.3); }
    .sbadge-scheduled { background:rgba(255,255,255,.06); color:rgba(255,255,255,.35); }
    .sbadge-live      { background:rgba(74,222,128,.2); color:#4ade80; }
    .res-date { font-size:.72rem; font-weight:700; color:rgba(255,255,255,.4); }
    .res-hour { font-size:.72rem; font-weight:700; color:rgba(255,255,255,.25); }

    .res-teams { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; }
    .res-team { display:flex; align-items:center; gap:8px; }
    .res-team.home { justify-content:flex-end; }
    .res-team.away { justify-content:flex-start; }
    .res-crest { width:24px; height:24px; object-fit:contain; filter:drop-shadow(0 1px 3px rgba(0,0,0,.5)); flex-shrink:0; }
    .res-team-name { font-size:.85rem; font-weight:700; color:rgba(255,255,255,.6); }
    .res-team-name.winner { color:white; font-weight:800; }

    .res-score-wrap { text-align:center; }
    .res-score { display:flex; align-items:center; gap:8px; justify-content:center; }
    .res-score span { font-family:'JetBrains Mono',monospace; font-size:1.4rem; font-weight:700; color:rgba(255,255,255,.4); min-width:20px; text-align:center; }
    .res-score span.winner { color:white; }
    .res-score-sep { color:rgba(255,255,255,.2) !important; font-size:1.1rem !important; }
    .res-score-tbd { font-family:'JetBrains Mono',monospace; font-size:.95rem; font-weight:700; color:rgba(255,255,255,.25); }

    .res-odds { display:flex; gap:5px; align-items:center; justify-content:flex-end; }
    .res-odd-box {
      background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
      border-radius:8px; padding:6px 10px;
      display:flex; flex-direction:column; align-items:center; gap:2px;
      min-width:44px; cursor:default; transition:all .15s;
    }
    .res-odd-lbl { font-size:.55rem; font-weight:800; color:rgba(255,255,255,.3); letter-spacing:.5px; }
    .res-odd-val { font-family:'JetBrains Mono',monospace; font-size:.88rem; font-weight:700; color:rgba(255,255,255,.75); }

    .res-bet-link {
      width:30px; height:30px; border-radius:8px;
      background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
      color:rgba(255,255,255,.3); font-size:.7rem;
      display:inline-flex; align-items:center; justify-content:center;
      text-decoration:none; transition:all .15s; flex-shrink:0;
    }
    .res-bet-link:hover { background:rgba(74,222,128,.1); border-color:rgba(74,222,128,.3); color:#4ade80; }

    .res-no-odds { font-size:.65rem; color:rgba(255,255,255,.2); font-weight:600; }
    .res-final-tag { font-size:.62rem; font-weight:800; color:rgba(255,255,255,.2); text-align:right; letter-spacing:.5px; text-transform:uppercase; }

    .res-empty { text-align:center; padding:48px; color:rgba(255,255,255,.2); background:#0f172a; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:10px; }
    .res-empty i { font-size:2rem; opacity:.3; }

    .res-bracket-wrap { background:#0f172a; border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:18px 20px; }
    .res-bracket-header { font-size:.75rem; font-weight:800; color:white; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
    .res-bracket-header i { color:rgba(255,255,255,.4); }
    .res-bracket-hint { font-size:.62rem; font-weight:600; color:rgba(255,255,255,.25); margin-left:auto; }
    .res-bracket { display:flex; gap:12px; overflow-x:auto; padding-bottom:8px; }
    .res-br-round { display:flex; flex-direction:column; gap:6px; min-width:180px; flex-shrink:0; }
    .res-br-label { font-size:.58rem; font-weight:800; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; text-align:center; }
    .res-br-ties { display:flex; flex-direction:column; gap:8px; }

    .res-br-tie {
      background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
      border-radius:10px; padding:10px 12px;
      display:flex; flex-direction:column; gap:6px;
      cursor:pointer; transition:all .15s;
    }
    .res-br-tie:hover { background:rgba(59,130,246,.08); border-color:rgba(59,130,246,.25); transform:translateY(-1px); }
    .res-br-sep { height:1px; background:rgba(255,255,255,.06); margin:0 -4px; }
    .res-br-team { display:flex; align-items:center; gap:7px; font-size:.75rem; font-weight:700; color:rgba(255,255,255,.5); }
    .res-br-team.winner { color:white; }
    .res-br-team.tbd { color:rgba(255,255,255,.2); font-style:italic; }
    .res-br-crest { width:18px; height:18px; object-fit:contain; flex-shrink:0; }
    .res-br-crest-placeholder { width:18px; height:18px; border-radius:50%; background:rgba(255,255,255,.08); flex-shrink:0; }
    .res-br-name { flex:1; }
    .res-br-agg { font-family:'JetBrains Mono',monospace; font-size:.82rem; font-weight:800; color:white; background:rgba(255,255,255,.08); padding:1px 7px; border-radius:5px; min-width:22px; text-align:center; }
    .res-br-team.winner .res-br-agg { background:rgba(59,130,246,.25); color:#93c5fd; }

    .res-modal-overlay {
      position:fixed; inset:0; z-index:500;
      background:rgba(0,0,0,.7);
      backdrop-filter:blur(8px);
      display:flex; align-items:center; justify-content:center;
      padding:20px;
      animation:fadeIn .2s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .res-modal {
      background:#0d1117; border:1px solid rgba(255,255,255,.1);
      border-radius:18px; padding:28px 32px;
      max-width:500px; width:100%;
      position:relative;
      animation:slideUp .2s ease;
      box-shadow:0 24px 64px rgba(0,0,0,.6);
    }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
    .res-modal-close {
      position:absolute; top:16px; right:16px;
      width:32px; height:32px; border-radius:8px;
      background:rgba(255,255,255,.07); border:none;
      color:rgba(255,255,255,.5); cursor:pointer; font-size:.85rem;
      display:flex; align-items:center; justify-content:center;
      transition:all .15s;
    }
    .res-modal-close:hover { background:rgba(255,255,255,.12); color:white; }
    .res-modal-title { font-size:1.1rem; font-weight:900; color:white; margin-bottom:4px; }
    .res-modal-stage { font-size:.65rem; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:1px; margin-bottom:20px; }
    .res-modal-legs { display:flex; flex-direction:column; gap:12px; margin-bottom:16px; }
    .res-modal-leg { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:14px 16px; }
    .res-modal-leg-label { font-size:.6rem; font-weight:800; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.8px; margin-bottom:6px; }
    .res-modal-leg-date { font-size:.68rem; color:rgba(255,255,255,.3); margin-bottom:10px; }
    .res-modal-leg-teams { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:10px; }
    .res-modal-team { display:flex; align-items:center; gap:7px; font-size:.85rem; font-weight:700; color:rgba(255,255,255,.55); }
    .res-modal-team.winner { color:white; }
    .res-modal-team.away { justify-content:flex-end; flex-direction:row-reverse; }
    .res-modal-crest { width:22px; height:22px; object-fit:contain; flex-shrink:0; }
    .res-modal-score { font-family:'JetBrains Mono',monospace; font-size:1.2rem; font-weight:800; color:white; text-align:center; white-space:nowrap; }
    .res-modal-score.tbd { font-size:.85rem; color:rgba(255,255,255,.3); }
    .res-modal-agg { padding-top:14px; border-top:1px solid rgba(255,255,255,.07); display:flex; flex-direction:column; gap:4px; }
    .res-modal-agg span:first-child { font-size:.6rem; font-weight:800; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:1px; }
    .res-modal-agg-score { font-size:.9rem; font-weight:700; color:white; }
    .res-modal-agg-score strong { font-family:'JetBrains Mono',monospace; font-size:1.1rem; color:#4ade80; }

    .res-stage-filter { display:flex; gap:6px; flex-wrap:wrap; }
    .res-stage-btn { padding:7px 14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:8px; font-size:.72rem; font-weight:700; color:rgba(255,255,255,.4); cursor:pointer; transition:all .15s; font-family:'Barlow',sans-serif; }
    .res-stage-btn:hover { background:rgba(255,255,255,.08); color:white; }
    .res-stage-btn.active { background:rgba(59,130,246,.15); border-color:rgba(59,130,246,.3); color:#93c5fd; }

    .res-footer { display:flex; justify-content:space-between; align-items:center; padding:6px 4px; font-size:.68rem; color:rgba(255,255,255,.25); font-weight:600; }
    .res-footer i { margin-right:4px; }
    .res-refresh-btn { padding:7px 16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; font-size:.72rem; font-weight:700; color:rgba(255,255,255,.5); cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; font-family:'Barlow',sans-serif; }
    .res-refresh-btn:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.2); color:white; }
    .spin { animation:spin .75s linear infinite; }

    @media(max-width:700px) {
      .res-match { grid-template-columns:80px 1fr; }
      .res-odds, .res-final-tag { display:none; }
      .res-team-name { font-size:.75rem; }
    }
  `]
})
export class RisultatiComponent implements OnInit {
  allMatches: any[] = [];
  filteredMatches: any[] = [];
  currentMatchday = 1;
  loading = true;

  get finishedCount()  { return this.filteredMatches.filter(m => m.status === 'FINISHED').length; }
  get scheduledCount() { return this.filteredMatches.filter(m => m.status !== 'FINISHED').length; }

  constructor(
    private footballService: FootballService,
    private oddsService: OddsService,
    private competitionService: CompetitionService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  get comp() { return this.competitionService.selected; }

  get isCup() { return this.comp.type === 'cup'; }

  private readonly KNOCKOUT_STAGES = ['PLAYOFFS','LAST_16','QUARTER_FINALS','SEMI_FINALS','FINAL'];
  private readonly STAGE_ORDER = ['LEAGUE_STAGE','PLAYOFFS','LAST_16','QUARTER_FINALS','SEMI_FINALS','FINAL'];
  private readonly STAGE_LABELS: Record<string,string> = {
    LEAGUE_STAGE:   'Fase a gironi',
    PLAYOFFS:       'Playoff',
    LAST_16:        'Ottavi',
    QUARTER_FINALS: 'Quarti',
    SEMI_FINALS:    'Semifinali',
    FINAL:          'Finale',
  };

  selectedStage = '';
  selectedTie: any = null;

  get availableStages() {
    const stages = [...new Set(this.allMatches.map((m: any) => m.stage as string))];
    return stages
      .sort((a, b) => this.STAGE_ORDER.indexOf(a) - this.STAGE_ORDER.indexOf(b))
      .map(s => ({ key: s, label: this.STAGE_LABELS[s] ?? s }));
  }

  get bracketRounds() {
    return this.KNOCKOUT_STAGES
      .filter(s => this.allMatches.some((m: any) => m.stage === s))
      .map(s => ({
        label: this.STAGE_LABELS[s],
        stage: s,
        ties: this.buildTies(s)
      }));
  }

  private buildTies(stage: string): any[] {
    const matches = this.allMatches.filter((m: any) => m.stage === stage);
    const legs1 = matches.filter((m: any) => m.matchday === 1);
    const legs2 = matches.filter((m: any) => m.matchday === 2);

    if (!legs1.length) {
      return matches.map((m: any) => ({
        home: m.homeTeam?.shortName ?? null,
        away: m.awayTeam?.shortName ?? null,
        homeCrest: m.homeTeam?.crest,
        awayCrest: m.awayTeam?.crest,
        homeAgg: m.status === 'FINISHED' ? m.score?.fullTime?.home : null,
        awayAgg: m.status === 'FINISHED' ? m.score?.fullTime?.away : null,
        matches: [m],
        stageLabel: this.STAGE_LABELS[stage],
      }));
    }

    return legs1.map((leg1: any) => {
      const leg2 = legs2.find((r: any) =>
        r.homeTeam?.id === leg1.awayTeam?.id &&
        r.awayTeam?.id === leg1.homeTeam?.id
      );
      const legs = leg2 ? [leg1, leg2] : [leg1];

      let homeAgg: number | null = null;
      let awayAgg: number | null = null;

      if (legs.every((l: any) => l.status === 'FINISHED')) {
        homeAgg = (leg1.score?.fullTime?.home ?? 0) + (leg2?.score?.fullTime?.away ?? 0);
        awayAgg = (leg1.score?.fullTime?.away ?? 0) + (leg2?.score?.fullTime?.home ?? 0);
      }

      return {
        home: leg1.homeTeam?.shortName ?? null,
        away: leg1.awayTeam?.shortName ?? null,
        homeCrest: leg1.homeTeam?.crest,
        awayCrest: leg1.awayTeam?.crest,
        homeAgg,
        awayAgg,
        matches: legs,
        stageLabel: this.STAGE_LABELS[stage],
      };
    });
  }

  tieWinner(tie: any): 'home' | 'away' | null {
    if (tie.homeAgg === null || tie.awayAgg === null) return null;
    if (tie.homeAgg > tie.awayAgg) return 'home';
    if (tie.awayAgg > tie.homeAgg) return 'away';
    return null;
  }

  groupMatchday = 1;

  get maxGroupMatchday(): number {
    const days = this.allMatches
      .filter((m: any) => m.stage === 'LEAGUE_STAGE')
      .map((m: any) => m.matchday as number);
    return days.length ? Math.max(...days) : 1;
  }

  prevGroupMatchday() {
    if (this.groupMatchday > 1) {
      this.zone.run(() => {
        this.groupMatchday--;
        this.filterGroupMatchday();
      });
    }
  }

  nextGroupMatchday() {
    if (this.groupMatchday < this.maxGroupMatchday) {
      this.zone.run(() => {
        this.groupMatchday++;
        this.filterGroupMatchday();
      });
    }
  }

  private filterGroupMatchday() {
    this.filteredMatches = this.allMatches
      .filter((m: any) => m.stage === 'LEAGUE_STAGE' && m.matchday === this.groupMatchday)
      .map((m: any) => ({ ...m, odds: this.mapOdds(m, this.lastOdds) }));
  }

  hasCrest(team: any): boolean {
    return !!(team?.crest && team.crest !== '');
  }
  openTie(tie: any) { this.zone.run(() => { this.selectedTie = tie; }); }
  closeTie() { this.zone.run(() => { this.selectedTie = null; }); }

  selectStage(stage: string) {
    this.zone.run(() => {
      this.selectedStage = stage;
      if (stage === 'LEAGUE_STAGE') {
        const current = this.allMatches
          .filter((m: any) => m.stage === 'LEAGUE_STAGE' && (m.status === 'SCHEDULED' || m.status === 'TIMED'))
          .map((m: any) => m.matchday as number);
        this.groupMatchday = current.length ? Math.min(...current) : 1;
        this.filterGroupMatchday();
      } else {
        this.filteredMatches = this.allMatches
          .filter((m: any) => m.stage === stage)
          .map((m: any) => ({ ...m, odds: this.mapOdds(m, this.lastOdds) }));
      }
    });
  }

  private lastOdds: any[] = [];

  ngOnInit() { this.initData(); }

  initData() {
    this.loading = true;
    forkJoin({
      calendar: this.footballService.getMatches(this.comp.code),
      odds: this.oddsService.getOdds(this.comp.code)
    }).subscribe({
      next: (res) => {
        this.allMatches = res.calendar.matches;
        this.lastOdds = res.odds;
        if (this.isCup) {
          const activeStage = this.KNOCKOUT_STAGES
            .find(s => res.calendar.matches.some((m: any) => m.stage === s && (m.status === 'SCHEDULED' || m.status === 'TIMED' || m.status === 'IN_PLAY')))
            ?? this.KNOCKOUT_STAGES.slice().reverse()
              .find(s => res.calendar.matches.some((m: any) => m.stage === s && m.status === 'FINISHED'))
            ?? (res.calendar.matches.some((m: any) => m.stage === 'LEAGUE_STAGE') ? 'LEAGUE_STAGE' : this.KNOCKOUT_STAGES[0]);
          this.selectedStage = activeStage;
          this.filteredMatches = this.allMatches
            .filter((m: any) => m.stage === activeStage)
            .map((m: any) => ({ ...m, odds: this.mapOdds(m, res.odds) }));
          this.loading = false;
        } else {
          const first = res.calendar.matches.find((m: any) => m.status !== 'FINISHED');
          this.currentMatchday = first ? first.matchday : 1;
          this.updateView(res.odds);
          this.loading = false;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  changeMatchday(step: number) {
    const target = this.currentMatchday + step;
    if (target < 1 || target > 38) return;
    this.currentMatchday = target;
    this.loading = true;
    this.oddsService.getOdds(this.comp.code).subscribe({
      next: (odds) => { this.updateView(odds); this.loading = false; },
      error: () => { this.updateView([]); this.loading = false; }
    });
  }

  private updateView(odds: any[]) {
    this.filteredMatches = this.allMatches
      .filter(m => m.matchday === this.currentMatchday)
      .map(m => ({ ...m, odds: this.mapOdds(m, odds) }));
  }

  private mapOdds(m: any, oddsList: any[]) {
    if (!oddsList?.length) return null;
    if (!m?.homeTeam?.name) return null;
    const hName = m.homeTeam.name.toLowerCase();
    const hFirst = hName.split(' ')[0];
    const found = oddsList.find(o => {
      if (!o?.home_team) return false;
      const oName = o.home_team.toLowerCase();
      return oName.includes(hFirst) || hFirst.includes(oName.split(' ')[0]);
    });
    if (!found?.bookmakers?.[0]?.markets?.[0]) return null;
    const outcomes = found.bookmakers[0].markets[0].outcomes;
    return {
      home: outcomes.find((o: any) => o.name === found.home_team)?.price.toFixed(2) ?? 'N/A',
      draw: outcomes.find((o: any) => o.name === 'Draw')?.price.toFixed(2) ?? 'N/A',
      away: outcomes.find((o: any) => o.name === found.away_team)?.price.toFixed(2) ?? 'N/A',
    };
  }

  getRowClass(status: string): string {
    if (status === 'IN_PLAY' || status === 'PAUSED') return 'row-live';
    return '';
  }

  getStatusClass(status: string): string {
    if (status === 'FINISHED') return 'finished';
    if (status === 'IN_PLAY' || status === 'PAUSED') return 'live';
    return 'scheduled';
  }

  getStatusLabel(status: string): string {
    const map: any = { FINISHED:'Terminata', SCHEDULED:'Programmata', TIMED:'Programmata', IN_PLAY:'Live', PAUSED:'Intervallo', POSTPONED:'Rinviata' };
    return map[status] ?? status;
  }

  isPlayed(status: string): boolean { return status === 'FINISHED' || status === 'IN_PLAY' || status === 'PAUSED'; }
  isWinner(m: any, side: 'home' | 'away'): boolean {
    if (m.status !== 'FINISHED') return false;
    const h = m.score.fullTime.home ?? 0, a = m.score.fullTime.away ?? 0;
    return side === 'home' ? h > a : a > h;
  }
  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
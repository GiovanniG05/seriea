import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OddsService, MatchOdds, CartItem } from '../services/odds.service';
import { CompetitionService } from '../services/competition.service';

type MarketTab = 'h2h' | 'totals';

@Component({
  selector: 'app-quote',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="q-page">

      <!-- HERO -->
      <div class="q-hero">
        <div class="q-hero-bg"></div>
        <div class="q-hero-inner">
          <div class="q-hero-left">
            <div class="q-eyebrow">THE ODDS API · <i class="fa-solid" [class]="comp.flag" [style.color]="comp.color"></i> {{ comp.name }}</div>
            <h1 class="q-hero-title">Scommesse <span>Live</span></h1>
            <div class="q-hero-sub">Prossime partite · Quote aggiornate in tempo reale</div>
          </div>
          <div class="q-hero-stats" *ngIf="matches.length">
            <div class="q-hstat">
              <div class="q-hstat-val">{{ matches.length }}</div>
              <div class="q-hstat-lbl">Partite</div>
            </div>
            <div class="q-hstat-divider"></div>
            <div class="q-hstat">
              <div class="q-hstat-val">{{ cart.length }}</div>
              <div class="q-hstat-lbl">Nel carrello</div>
            </div>
            <div class="q-hstat-divider"></div>
            <div class="q-hstat">
              <div class="q-hstat-val">{{ totalOdd }}</div>
              <div class="q-hstat-lbl">Quota totale</div>
            </div>
          </div>
        </div>
      </div>

      <!-- MARKET TABS -->
      <div class="q-tabs">
        <button class="q-tab" [class.active]="activeTab==='h2h'" (click)="switchTab('h2h')">
          <i class="fa-solid fa-futbol"></i> Esito Finale 1X2
        </button>
        <button class="q-tab" [class.active]="activeTab==='totals'" (click)="switchTab('totals')">
          <i class="fa-solid fa-arrow-up-short-wide"></i> Over / Under
        </button>
      </div>

      <!-- LOADING -->
      <div class="q-loading" *ngIf="loading">
        <div class="q-spinner"></div>
        <span>Caricamento quote…</span>
      </div>

      <!-- ERROR -->
      <div class="q-error" *ngIf="error && !loading">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>{{ error }}</span>
      </div>

      <!-- PARTITE -->
      <div class="q-list" *ngIf="!loading && matches.length">
        <div class="q-match" *ngFor="let m of matches">

          <!-- header partita -->
          <div class="q-match-header">
            <div class="q-match-info">
              <span class="q-match-date">
                <i class="fa-regular fa-calendar"></i>
                {{ m.commence_time | date:'EEE dd MMM · HH:mm' }}
              </span>
              <span class="q-soon" *ngIf="isSoon(m.commence_time)">OGGI</span>
            </div>
            <span class="q-bookmaker-name">{{ m.bookmakers[0]?.title ?? '' }}</span>
          </div>

          <!-- squadre -->
          <div class="q-match-teams">
            <span class="q-team-name">{{ m.home_team }}</span>
            <span class="q-vs-sep">–</span>
            <span class="q-team-name">{{ m.away_team }}</span>
          </div>

          <!-- quote 1X2 -->
          <div class="q-outcomes" *ngIf="activeTab==='h2h'">
            <button class="q-odd-btn"
              [class.selected]="isInCart(m.id, m.home_team)"
              (click)="toggleCart(m, '1X2', m.home_team, getOdd(m,'home'), m.bookmakers[0]?.title ?? '')">
              <span class="q-odd-label">1</span>
              <span class="q-odd-desc">{{ m.home_team }}</span>
              <span class="q-odd-price">{{ getOdd(m,'home').toFixed(2) }}</span>
            </button>
            <button class="q-odd-btn"
              [class.selected]="isInCart(m.id, 'Draw')"
              (click)="toggleCart(m, '1X2', 'Draw', getOdd(m,'draw'), m.bookmakers[0]?.title ?? '')">
              <span class="q-odd-label">X</span>
              <span class="q-odd-desc">Pareggio</span>
              <span class="q-odd-price">{{ getOdd(m,'draw').toFixed(2) }}</span>
            </button>
            <button class="q-odd-btn"
              [class.selected]="isInCart(m.id, m.away_team)"
              (click)="toggleCart(m, '1X2', m.away_team, getOdd(m,'away'), m.bookmakers[0]?.title ?? '')">
              <span class="q-odd-label">2</span>
              <span class="q-odd-desc">{{ m.away_team }}</span>
              <span class="q-odd-price">{{ getOdd(m,'away').toFixed(2) }}</span>
            </button>
          </div>

          <!-- quote Over/Under -->
          <div class="q-outcomes" *ngIf="activeTab==='totals'">
            <button class="q-odd-btn"
              *ngFor="let o of getTotals(m)"
              [class.selected]="isInCart(m.id, o.name + (o.point ?? ''))"
              (click)="toggleCart(m, 'O/U', o.name + ' ' + (o.point ?? ''), o.price, m.bookmakers[0]?.title ?? '')">
              <span class="q-odd-label">{{ o.name === 'Over' ? 'OV' : 'UN' }}</span>
              <span class="q-odd-desc">{{ o.name }} {{ o.point }}</span>
              <span class="q-odd-price">{{ o.price.toFixed(2) }}</span>
            </button>
            <div class="q-no-market" *ngIf="getTotals(m).length === 0">N/D</div>
          </div>

        </div>
      </div>

      <!-- EMPTY -->
      <div class="q-empty" *ngIf="!loading && !error && matches.length === 0">
        <i class="fa-solid fa-calendar-xmark"></i>
        <div>Nessuna partita disponibile</div>
      </div>

      <!-- FOOTER -->
      <div class="q-footer" *ngIf="!loading">
        <span><i class="fa-solid fa-bolt"></i> The Odds API · dati in tempo reale</span>
        <button class="q-refresh-btn" (click)="load()">
          <i class="fa-solid fa-rotate-right" [class.spin]="loading"></i> Aggiorna
        </button>
      </div>

      <!-- CARRELLO -->
      <div class="q-cart" *ngIf="cart.length > 0">
        <div class="q-cart-header">
          <span><i class="fa-solid fa-cart-shopping"></i> Schedina ({{ cart.length }})</span>
          <button class="q-cart-clear" (click)="clearCart()">
            <i class="fa-solid fa-trash"></i> Svuota
          </button>
        </div>

        <div class="q-cart-items">
          <div class="q-cart-item" *ngFor="let item of cart">
            <div class="q-cart-item-left">
              <span class="q-cart-match">{{ item.home }} – {{ item.away }}</span>
              <span class="q-cart-market">{{ item.market }} · {{ item.label }}</span>
            </div>
            <div class="q-cart-item-right">
              <span class="q-cart-odd">{{ item.odd.toFixed(2) }}</span>
              <button class="q-cart-remove" (click)="removeFromCart(item)">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="q-cart-footer">
          <div class="q-cart-total">
            <span>Quota totale</span>
            <span class="q-cart-total-val">{{ totalOdd }}</span>
          </div>
          <div class="q-cart-stake">
            <span>Puntata (€)</span>
            <input class="q-stake-input" type="number" [(ngModel)]="stake" min="1" placeholder="10">
          </div>
          <div class="q-cart-win" *ngIf="stake > 0">
            <span>Vincita potenziale</span>
            <span class="q-win-val">€ {{ (stake * +totalOdd).toFixed(2) }}</span>
          </div>
          <a class="q-bet-cta" href="https://landing.sisal.it/invita-amici/?mppartner=3835263332262626302654524143&omtrcid=10399233_DIR" target="_blank" rel="noreferrer noopener">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Vai su Sisal
          </a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; }

    .q-page { font-family:'Barlow',sans-serif; max-width:1060px; margin:0 auto; display:flex; flex-direction:column; gap:14px; padding-bottom:20px; }

    /* HERO */
    .q-hero { position:relative; border-radius:16px; overflow:hidden; background:#0a0f1e; }
    .q-hero-bg { position:absolute; inset:0; background:radial-gradient(ellipse 40% 60% at 100% 20%,rgba(15,52,120,.4) 0%,transparent 55%); pointer-events:none; }
    .q-hero-inner { position:relative; z-index:1; padding:28px 36px; display:flex; justify-content:space-between; align-items:center; gap:24px; flex-wrap:wrap; }
    .q-eyebrow { font-size:.6rem; font-weight:700; letter-spacing:3px; color:rgba(255,255,255,.4); text-transform:uppercase; margin-bottom:4px; }
    .q-hero-title { font-size:2.2rem; font-weight:900; color:white; letter-spacing:-1px; line-height:1; text-transform:uppercase; }
    .q-hero-title span { color:#4ade80; }
    .q-hero-sub { font-size:.78rem; font-weight:600; color:rgba(255,255,255,.35); margin-top:4px; }
    .q-hero-stats { display:flex; align-items:center; }
    .q-hstat { text-align:center; padding:0 24px; }
    .q-hstat-val { font-size:1.8rem; font-weight:900; color:white; font-family:'JetBrains Mono',monospace; line-height:1; }
    .q-hstat-lbl { font-size:.6rem; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:1px; margin-top:4px; }
    .q-hstat-divider { width:1px; height:36px; background:rgba(255,255,255,.1); }

    /* TABS */
    .q-tabs { display:flex; gap:6px; background:#0a0f1e; border-radius:12px; padding:6px; }
    .q-tab { flex:1; padding:10px 16px; border:none; border-radius:8px; background:transparent; color:rgba(255,255,255,.4); font-size:.78rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:all .15s; font-family:'Barlow',sans-serif; text-transform:uppercase; letter-spacing:.3px; }
    .q-tab i { font-size:.72rem; }
    .q-tab:hover:not(.active) { background:rgba(255,255,255,.06); color:rgba(255,255,255,.7); }
    .q-tab.active { background:rgba(59,130,246,.2); color:#93c5fd; border:1px solid rgba(59,130,246,.3); }

    /* LOADING / ERROR / EMPTY */
    .q-loading { display:flex; align-items:center; justify-content:center; gap:14px; padding:56px; color:#6b7280; background:#0f172a; border-radius:12px; }
    .q-spinner { width:28px; height:28px; border:3px solid rgba(255,255,255,.06); border-top-color:#4ade80; border-radius:50%; animation:spin .75s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .q-error { display:flex; align-items:center; gap:12px; padding:18px 24px; background:#1a0a0a; border:1px solid #7f1d1d; border-radius:12px; color:#fca5a5; font-size:.85rem; font-weight:600; }
    .q-empty { text-align:center; padding:56px; color:rgba(255,255,255,.2); background:#0f172a; border-radius:12px; }
    .q-empty i { font-size:2.5rem; display:block; margin-bottom:12px; opacity:.3; }

    /* LISTA PARTITE */
    .q-list { display:flex; flex-direction:column; gap:8px; }
    .q-match { background:#0f172a; border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:18px 20px; transition:border-color .15s; }
    .q-match:hover { border-color:rgba(255,255,255,.1); }

    .q-match-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .q-match-info { display:flex; align-items:center; gap:10px; }
    .q-match-date { font-size:.68rem; font-weight:700; color:rgba(255,255,255,.35); display:flex; align-items:center; gap:5px; }
    .q-match-date i { color:rgba(255,255,255,.2); }
    .q-soon { background:rgba(74,222,128,.12); color:#4ade80; padding:2px 8px; border-radius:4px; font-size:.6rem; font-weight:800; }
    .q-bookmaker-name { font-size:.62rem; font-weight:700; color:rgba(255,255,255,.2); }

    .q-match-teams { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
    .q-team-name { font-size:.95rem; font-weight:800; color:white; }
    .q-vs-sep { font-size:.7rem; color:rgba(255,255,255,.2); font-weight:900; }

    /* QUOTE BUTTONS */
    .q-outcomes { display:flex; gap:8px; flex-wrap:wrap; }
    .q-odd-btn {
      flex:1; min-width:120px;
      background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
      border-radius:10px; padding:12px 10px;
      display:flex; flex-direction:column; align-items:center; gap:3px;
      cursor:pointer; transition:all .15s; font-family:'Barlow',sans-serif;
    }
    .q-odd-btn:hover { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.15); }
    .q-odd-btn.selected { background:rgba(74,222,128,.12); border-color:rgba(74,222,128,.4); }
    .q-odd-label { font-size:.7rem; font-weight:800; color:rgba(255,255,255,.35); letter-spacing:.5px; }
    .q-odd-desc { font-size:.72rem; font-weight:700; color:rgba(255,255,255,.6); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
    .q-odd-price { font-family:'JetBrains Mono',monospace; font-size:1.15rem; font-weight:700; color:white; margin-top:2px; }
    .q-odd-btn.selected .q-odd-price { color:#4ade80; }
    .q-no-market { font-size:.72rem; color:rgba(255,255,255,.2); padding:12px; }

    /* FOOTER */
    .q-footer { display:flex; justify-content:space-between; align-items:center; padding:6px 4px; font-size:.68rem; color:rgba(255,255,255,.25); font-weight:600; }
    .q-refresh-btn { padding:7px 16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; font-size:.72rem; font-weight:700; color:rgba(255,255,255,.5); cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; font-family:'Barlow',sans-serif; }
    .q-refresh-btn:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.2); color:white; }
    .spin { animation:spin .75s linear infinite; }

    /* CARRELLO */
    .q-cart {
      background:#0d1117; border:1px solid rgba(255,255,255,.1);
      border-radius:16px;
      padding:16px 24px 20px;
      margin-top:8px;
    }
    .q-cart-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:.85rem; font-weight:800; color:white; }
    .q-cart-header i { color:#4ade80; margin-right:6px; }
    .q-cart-clear { background:none; border:1px solid rgba(255,255,255,.1); border-radius:6px; color:rgba(255,255,255,.3); font-size:.68rem; font-weight:700; padding:4px 10px; cursor:pointer; display:flex; align-items:center; gap:5px; transition:all .15s; font-family:'Barlow',sans-serif; }
    .q-cart-clear:hover { border-color:#ef4444; color:#ef4444; }

    .q-cart-items { display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto; margin-bottom:12px; }
    .q-cart-item { display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,.04); border-radius:8px; padding:8px 12px; }
    .q-cart-item-left { display:flex; flex-direction:column; gap:2px; }
    .q-cart-match { font-size:.78rem; font-weight:700; color:white; }
    .q-cart-market { font-size:.62rem; font-weight:600; color:rgba(255,255,255,.35); }
    .q-cart-item-right { display:flex; align-items:center; gap:10px; }
    .q-cart-odd { font-family:'JetBrains Mono',monospace; font-size:.95rem; font-weight:700; color:#4ade80; }
    .q-cart-remove { background:none; border:none; color:rgba(255,255,255,.25); cursor:pointer; font-size:.75rem; padding:2px 4px; transition:color .15s; }
    .q-cart-remove:hover { color:#ef4444; }

    .q-cart-footer { display:grid; grid-template-columns:1fr 1fr 1fr auto; align-items:center; gap:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,.07); }
    .q-cart-total { display:flex; flex-direction:column; gap:2px; }
    .q-cart-total span:first-child { font-size:.6rem; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.5px; }
    .q-cart-total-val { font-family:'JetBrains Mono',monospace; font-size:1.3rem; font-weight:900; color:white; }
    .q-cart-stake { display:flex; flex-direction:column; gap:4px; }
    .q-cart-stake span { font-size:.6rem; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.5px; }
    .q-stake-input { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:7px; padding:6px 10px; color:white; font-size:.9rem; font-family:'JetBrains Mono',monospace; font-weight:700; width:80px; outline:none; }
    .q-stake-input:focus { border-color:rgba(74,222,128,.4); }
    .q-cart-win { display:flex; flex-direction:column; gap:2px; }
    .q-cart-win span:first-child { font-size:.6rem; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.5px; }
    .q-win-val { font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:900; color:#4ade80; }
    .q-bet-cta {
      padding:10px 20px; background:linear-gradient(135deg,#16a34a,#0d4b24);
      border:none; border-radius:10px; color:white; font-size:.82rem; font-weight:800;
      cursor:pointer; display:flex; align-items:center; gap:7px;
      text-decoration:none; transition:all .2s; font-family:'Barlow',sans-serif;
      text-transform:uppercase; letter-spacing:.3px;
      box-shadow:0 4px 12px rgba(22,163,74,.3);
    }
    .q-bet-cta:hover { background:linear-gradient(135deg,#15803d,#0a3d1c); box-shadow:0 6px 16px rgba(22,163,74,.4); }

    @media(max-width:700px) {
      .q-hero-inner { flex-direction:column; gap:12px; padding:20px 16px; }
      .q-hero-stats { display:none; }
      .q-match-header { flex-direction:column; align-items:flex-start; gap:4px; }
      .q-teams { font-size:.78rem; }
      .q-outcomes { flex-direction:row; flex-wrap:wrap; gap:6px; }
      .q-odd-btn { flex:1; min-width:80px; padding:8px 6px; }
      .q-odd-desc { font-size:.55rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70px; }
      .q-totals { flex-wrap:wrap; }
      .q-cart-footer { grid-template-columns:1fr 1fr; gap:10px; }
      .q-bet-cta { grid-column:1/-1; justify-content:center; }
      .q-cart-item { flex-direction:column; gap:4px; }
    }
  `]
})
export class QuoteComponent implements OnInit {
  matches: MatchOdds[] = [];
  loading = false;
  error = '';
  activeTab: MarketTab = 'h2h';
  cart: CartItem[] = [];
  stake = 10;

  get totalOdd(): string {
    if (!this.cart.length) return '0.00';
    return this.cart.reduce((acc, i) => acc * i.odd, 1).toFixed(2);
  }

  constructor(private oddsService: OddsService, private competitionService: CompetitionService) {}
  get comp() { return this.competitionService.selected; }
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.oddsService.getAllMarkets(this.comp.code).subscribe({
      next: (data) => {
        this.matches = data;
        this.loading = false;
      },
      error: () => { this.error = 'Impossibile recuperare le quote. Verifica la API Key.'; this.loading = false; }
    });
  }

  switchTab(tab: MarketTab) {
    this.activeTab = tab;
  }

  getH2H(m: MatchOdds) {
    return m.bookmakers[0]?.markets.find(mk => mk.key === 'h2h')?.outcomes ?? [];
  }

  getOdd(m: MatchOdds, side: 'home' | 'draw' | 'away'): number {
    const outcomes = m.bookmakers[0]?.markets.find(mk => mk.key === 'h2h')?.outcomes ?? [];
    if (side === 'home') return outcomes.find(o => o.name === m.home_team)?.price ?? 0;
    if (side === 'away') return outcomes.find(o => o.name === m.away_team)?.price ?? 0;
    return outcomes.find(o => o.name === 'Draw')?.price ?? 0;
  }

  getTotals(m: MatchOdds) {
    return m.bookmakers[0]?.markets.find(mk => mk.key === 'totals')?.outcomes ?? [];
  }

  toggleCart(m: MatchOdds, market: string, label: string, odd: number, bookmaker: string) {
    const existing = this.cart.findIndex(i => i.matchId === m.id && i.market === market && i.label === label);
    if (existing >= 0) {
      // deseleziona
      this.cart.splice(existing, 1);
    } else {
      // rimuovi selezione precedente per stessa partita + stesso mercato
      this.cart = this.cart.filter(i => !(i.matchId === m.id && i.market === market));
      this.cart.push({ matchId: m.id, home: m.home_team, away: m.away_team, market, label, odd, bookmaker });
    }
  }

  isInCart(matchId: string, label: string): boolean {
    return this.cart.some(i => i.matchId === matchId && i.label === label);
  }

  removeFromCart(item: CartItem) {
    this.cart = this.cart.filter(i => i !== item);
  }

  clearCart() { this.cart = []; }

  isSoon(dateStr: string): boolean {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return diff > 0 && diff < 86400000;
  }
}
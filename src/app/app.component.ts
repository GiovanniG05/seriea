import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { ClassificaComponent } from './classifica/classifica.component';
import { RisultatiComponent } from './risultati/risultati.component';
import { MarcatoriComponent } from './marcatori/marcatori.component';
import { QuoteComponent } from './quote/quote.component';
import { SeasonService } from './services/season.service';
import { CompetitionService } from './services/competition.service';

type View = 'home' | 'classifica' | 'risultati' | 'marcatori' | 'quote';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HomeComponent, ClassificaComponent, RisultatiComponent, MarcatoriComponent, QuoteComponent],
  template: `
    <div class="app-shell">

      <nav class="app-nav">
        <div class="app-nav-inner">
          <div class="app-brand" (click)="view='home'" style="cursor:pointer">
            <span class="app-brand-name">Calcio<strong> Live</strong></span>
          </div>
          <div class="app-nav-links">
            <button class="app-nav-btn" [class.active]="view==='home'" (click)="view='home'">
              <i class="fa-solid fa-house"></i><span>Home</span>
            </button>
            <button class="app-nav-btn" [class.active]="view==='classifica'" (click)="view='classifica'">
              <i class="fa-solid fa-list-ol"></i><span>Classifica</span>
            </button>
            <button class="app-nav-btn" [class.active]="view==='risultati'" (click)="view='risultati'">
              <i class="fa-solid fa-calendar-days"></i><span>Risultati & Quote</span>
            </button>
            <button class="app-nav-btn" [class.active]="view==='marcatori'" (click)="view='marcatori'">
              <i class="fa-solid fa-shoe-prints"></i><span>Marcatori</span>
            </button>
            <button class="app-nav-btn" [class.active]="view==='quote'" (click)="view='quote'">
              <i class="fa-solid fa-percent"></i><span>Quote</span>
            </button>
          </div>
          <!-- SELETTORE STAGIONE -->
          <div class="app-season-wrap" *ngIf="view !== 'home' && view !== 'quote' && !(view === 'classifica' && isCupWithNoHistoricalStandings())">
            <select class="app-season-select" (change)="onSeasonChange($event)">
              <option [value]="''" [selected]="!seasonService.season">In corso</option>
              <option
                *ngFor="let y of getSeasons()"
                [value]="y"
                [selected]="seasonService.season === y">
                {{ seasonService.getLabel(y) }}
              </option>
            </select>
          </div>
        </div>
      </nav>

      <main class="app-main">
        <app-home      *ngIf="view==='home'"       (navigateTo)="view=$any($event)" />
        <app-classifica *ngIf="view==='classifica'" />
        <app-risultati  *ngIf="view==='risultati'" />
        <app-marcatori  *ngIf="view==='marcatori'" />
        <app-quote      *ngIf="view==='quote'" />
      </main>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }

    .app-shell { min-height:100vh; background:#070d1a; font-family:'Barlow',sans-serif; }

    .app-nav { background:#0a0f1e; border-bottom:1px solid rgba(255,255,255,.07); position:sticky; top:0; z-index:100; }
    .app-nav-inner { max-width:1060px; margin:0 auto; padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:58px; gap:12px; }

    .app-brand { display:flex; align-items:center; flex-shrink:0; }
    .app-brand-name { font-size:1.05rem; font-weight:700; color:rgba(255,255,255,.7); letter-spacing:-.3px; }
    .app-brand-name strong { color:#4ade80; font-weight:900; }

    .app-nav-links { display:flex; gap:2px; flex:1; }
    .app-nav-btn { position:relative; padding:7px 14px; border:1px solid transparent; border-radius:8px; background:transparent; color:rgba(255,255,255,.4); font-size:.8rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:7px; transition:all .15s; font-family:'Barlow',sans-serif; text-transform:uppercase; letter-spacing:.3px; }
    .app-nav-btn i { font-size:.75rem; }
    .app-nav-btn:hover:not(.active) { background:rgba(255,255,255,.07); color:white; }
    .app-nav-btn.active { background:rgba(74,222,128,.12); color:#4ade80; border:1px solid rgba(74,222,128,.2); }

    /* SEASON SELECT */
    .app-season-wrap { flex-shrink:0; }
    .app-season-select {
      background:#111827; border:1px solid rgba(255,255,255,.1);
      border-radius:8px; padding:6px 10px;
      color:rgba(255,255,255,.7); font-size:.75rem; font-weight:700;
      font-family:'Barlow',sans-serif; cursor:pointer;
      outline:none; transition:all .15s;
      appearance:none; -webkit-appearance:none;
      padding-right:24px;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat:no-repeat; background-position:right 8px center;
    }
    .app-season-select:hover { border-color:rgba(255,255,255,.2); color:white; }
    .app-season-select option { background:#111827; color:white; }

    .app-main { max-width:1060px; margin:0 auto; padding:24px 20px 48px; }

    @media(max-width:700px) {
      .app-nav-inner { padding:0 12px; height:52px; }
      .app-nav-btn { padding:6px 10px; font-size:.7rem; gap:5px; }
      .app-nav-btn span { display:none; }
      .app-brand-name { font-size:.9rem; }
      .app-season-select { font-size:.68rem; padding:5px 22px 5px 8px; }
    }
    @media(max-width:400px) {
      .app-nav-links { gap:0; }
      .app-nav-btn { padding:6px 8px; }
    }
  `]
})
export class AppComponent {
  view: View = 'home';
  seasonService = inject(SeasonService);
  private competitionService = inject(CompetitionService);

  getSeasons(): number[] {
    const comp = this.competitionService.selected;
    return this.seasonService.getSeasons(comp.code, comp.type);
  }

  onSeasonChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.seasonService.select(val ? Number(val) : undefined);
  }

  isCupWithNoHistoricalStandings(): boolean {
    const comp = this.competitionService.selected;
    return comp.type === 'cup' && comp.code !== 'CL';
  }
}
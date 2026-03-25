import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { ClassificaComponent } from './classifica/classifica.component';
import { RisultatiComponent } from './risultati/risultati.component';
import { MarcatoriComponent } from './marcatori/marcatori.component';
import { QuoteComponent } from './quote/quote.component';
import { AuthModalComponent } from './auth/auth-modal.component';
import { SeasonService } from './services/season.service';
import { CompetitionService } from './services/competition.service';
import { AuthService } from './services/auth.service';
import { ProfiloComponent } from './profilo/profilo.component';

type View = 'home' | 'classifica' | 'risultati' | 'marcatori' | 'quote';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HomeComponent, ClassificaComponent, RisultatiComponent, MarcatoriComponent, QuoteComponent, AuthModalComponent, ProfiloComponent],
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

          <div class="app-nav-right">
            <!-- SELETTORE STAGIONE -->
            <div class="app-season-wrap" *ngIf="view !== 'home' && view !== 'quote'">
              <select class="app-season-select" (change)="onSeasonChange($event)">
                <option [value]="''" [selected]="!seasonService.season">In corso</option>
                <option *ngFor="let y of getSeasons()" [value]="y" [selected]="seasonService.season === y">
                  {{ seasonService.getLabel(y) }}
                </option>
              </select>
            </div>

            <!-- AUTH BUTTONS -->
            <div class="app-auth" *ngIf="!authService.isLoggedIn">
              <button class="app-auth-btn" (click)="authModalOpen=true; authTab='login'">Accedi</button>
              <button class="app-auth-btn primary" (click)="authModalOpen=true; authTab='register'">Registrati</button>
            </div>

            <!-- USER MENU -->
            <div class="app-user" *ngIf="authService.isLoggedIn">
              <button class="app-user-btn" (click)="userMenuOpen=!userMenuOpen">
                <div class="app-user-avatar">{{ authService.user?.username?.[0]?.toUpperCase() }}</div>
                <span class="app-user-name-text">{{ authService.user?.username }}</span>
                <i class="fa-solid fa-chevron-down" style="font-size:.6rem;color:rgba(255,255,255,.4)"></i>
              </button>
              <div class="app-user-dropdown" *ngIf="userMenuOpen" (click)="userMenuOpen=false">
                <div class="app-user-info">
                  <div class="app-user-fullname">{{ authService.user?.nome }} {{ authService.user?.cognome }}</div>
                  <div class="app-user-username">{{ '@' + authService.user?.username }}</div>
                  <div class="app-user-email">{{ authService.user?.email }}</div>
                  <div class="app-user-squadra" *ngIf="authService.user?.squadra_preferita">
                    <img *ngIf="authService.user?.squadra_crest" [src]="authService.user?.squadra_crest" class="app-user-squad-crest" (error)="onCrestError($event)">
                    <i *ngIf="!authService.user?.squadra_crest" class="fa-solid fa-shield-halved"></i>
                    {{ authService.user?.squadra_preferita }}
                  </div>
                </div>
                <button class="app-user-profile" (click)="profiloOpen=true; userMenuOpen=false">
                  <i class="fa-solid fa-user"></i> Il mio profilo
                </button>
                <button class="app-user-logout" (click)="authService.logout(); userMenuOpen=false">
                  <i class="fa-solid fa-right-from-bracket"></i> Esci
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main class="app-main">
        <app-home       *ngIf="view==='home'"       (navigateTo)="view=$any($event)" />
        <app-classifica *ngIf="view==='classifica'" />
        <app-risultati  *ngIf="view==='risultati'" />
        <app-marcatori  *ngIf="view==='marcatori'" />
        <app-quote      *ngIf="view==='quote'" />
      </main>

      <!-- PROFILO MODAL -->
      <app-profilo *ngIf="profiloOpen" (close)="profiloOpen=false"></app-profilo>

      <!-- AUTH MODAL -->
      <app-auth-modal
        *ngIf="authModalOpen"
        [initialTab]="authTab"
        (close)="authModalOpen=false">
      </app-auth-modal>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }

    .app-shell { min-height:100vh; background:#070d1a; font-family:'Barlow',sans-serif; }

    .app-nav { background:#0a0f1e; border-bottom:1px solid rgba(255,255,255,.07); position:sticky; top:0; z-index:100; }
    .app-nav-inner { max-width:1060px; margin:0 auto; padding:0 20px; display:flex; align-items:center; height:58px; gap:12px; }

    .app-brand { display:flex; align-items:center; flex-shrink:0; }
    .app-brand-name { font-size:1.05rem; font-weight:700; color:rgba(255,255,255,.7); letter-spacing:-.3px; }
    .app-brand-name strong { color:#4ade80; font-weight:900; }

    .app-nav-links { display:flex; gap:2px; flex:1; }
    .app-nav-btn { padding:7px 14px; border:1px solid transparent; border-radius:8px; background:transparent; color:rgba(255,255,255,.4); font-size:.8rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:7px; transition:all .15s; font-family:'Barlow',sans-serif; text-transform:uppercase; letter-spacing:.3px; }
    .app-nav-btn i { font-size:.75rem; }
    .app-nav-btn:hover:not(.active) { background:rgba(255,255,255,.07); color:white; }
    .app-nav-btn.active { background:rgba(74,222,128,.12); color:#4ade80; border:1px solid rgba(74,222,128,.2); }

    .app-nav-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }

    /* SEASON */
    .app-season-select { background:#111827; border:1px solid rgba(255,255,255,.1); border-radius:8px; padding:6px 24px 6px 10px; color:rgba(255,255,255,.7); font-size:.75rem; font-weight:700; font-family:'Barlow',sans-serif; cursor:pointer; outline:none; transition:all .15s; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 8px center; }
    .app-season-select option { background:#111827; color:white; }

    /* AUTH */
    .app-auth { display:flex; gap:8px; }
    .app-auth-btn { padding:7px 14px; border-radius:8px; font-size:.78rem; font-weight:700; cursor:pointer; font-family:'Barlow',sans-serif; transition:all .15s; border:1px solid rgba(255,255,255,.15); background:transparent; color:rgba(255,255,255,.6); }
    .app-auth-btn:hover { background:rgba(255,255,255,.07); color:white; }
    .app-auth-btn.primary { background:#4ade80; color:#070d1a; border-color:#4ade80; }
    .app-auth-btn.primary:hover { background:#22c55e; }

    /* USER */
    .app-user { position:relative; }
    .app-user-btn { display:flex; align-items:center; gap:8px; padding:6px 12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; cursor:pointer; font-family:'Barlow',sans-serif; font-size:.8rem; font-weight:700; color:white; transition:all .15s; }
    .app-user-btn:hover { background:rgba(255,255,255,.1); }
    .app-user-avatar { width:26px; height:26px; border-radius:50%; background:#4ade80; color:#070d1a; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:900; flex-shrink:0; }
    .app-user-name-text { max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .app-user-dropdown { position:absolute; top:calc(100% + 8px); right:0; background:#0d1117; border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:8px; min-width:200px; box-shadow:0 8px 32px rgba(0,0,0,.5); z-index:200; }
    .app-user-info { padding:10px 12px 12px; border-bottom:1px solid rgba(255,255,255,.07); margin-bottom:6px; display:flex; flex-direction:column; gap:3px; }
    .app-user-fullname { font-size:.88rem; font-weight:800; color:white; }
    .app-user-username { font-size:.72rem; color:#4ade80; font-weight:700; }
    .app-user-email { font-size:.68rem; color:rgba(255,255,255,.35); }
    .app-user-squadra { font-size:.68rem; color:rgba(255,255,255,.4); margin-top:4px; display:flex; align-items:center; gap:5px; }
    .app-user-squadra i { color:rgba(255,255,255,.25); font-size:.6rem; }
    .app-user-profile { width:100%; padding:8px 12px; background:transparent; border:none; border-radius:8px; color:rgba(255,255,255,.6); font-size:.78rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all .15s; font-family:'Barlow',sans-serif; margin-bottom:2px; }
    .app-user-profile:hover { background:rgba(255,255,255,.07); color:white; }
    .app-user-logout { width:100%; padding:8px 12px; background:transparent; border:none; border-radius:8px; color:rgba(255,255,255,.5); font-size:.78rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all .15s; font-family:'Barlow',sans-serif; }
    .app-user-logout:hover { background:rgba(239,68,68,.1); color:#f87171; }
    .app-user-squad-crest { width:14px; height:14px; object-fit:contain; flex-shrink:0; filter:drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
    
    .app-main { max-width:1060px; margin:0 auto; padding:24px 20px 48px; }

    @media(max-width:700px) {
      .app-nav-inner { padding:0 12px; height:52px; }
      .app-nav-btn { padding:6px 10px; font-size:.7rem; gap:5px; }
      .app-nav-btn span { display:none; }
      .app-brand-name { font-size:.9rem; }
      .app-season-select { font-size:.68rem; padding:5px 22px 5px 8px; }
      .app-auth-btn { padding:6px 10px; font-size:.7rem; }
      .app-user-name-text { display:none; }
    }
    @media(max-width:400px) {
      .app-nav-links { gap:0; }
      .app-nav-btn { padding:6px 8px; }
    }
  `]
})
export class AppComponent implements OnInit {
  view: View = 'home';
  authModalOpen = false;
  profiloOpen = false;
  authTab: 'login' | 'register' = 'login';
  userMenuOpen = false;

  seasonService = inject(SeasonService);
  authService = inject(AuthService);
  private competitionService = inject(CompetitionService);

  private http = inject(HttpClient);

  ngOnInit() {
    // Keep-alive: pinga il backend ogni 8 minuti per evitare il sleep su Render
    const ping = () => this.http.get('https://calciolive-backend.onrender.com/api/health').subscribe();
    ping();
    setInterval(ping, 8 * 60 * 1000);
  }

  onCrestError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }

  getSeasons(): number[] {
    const comp = this.competitionService.selected;
    return this.seasonService.getSeasons(comp.code, comp.type);
  }

  onSeasonChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.seasonService.select(val ? Number(val) : undefined);
  }
}
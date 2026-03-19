import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface MatchOdds {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface CartItem {
  matchId: string;
  home: string;
  away: string;
  market: string;
  label: string;
  odd: number;
  bookmaker: string;
}

// Chiavi sport verificate con l'API
const SPORT_KEYS: Record<string, string> = {
  SA:  'soccer_italy_serie_a',
  PL:  'soccer_epl',
  PD:  'soccer_spain_la_liga',
  BL1: 'soccer_germany_bundesliga',
  FL1: 'soccer_france_ligue_one',
  CL:  'soccer_uefa_champs_league',
  EL:  'soccer_uefa_europa_league',
  ECL: 'soccer_uefa_europa_conference_league',
};

@Injectable({ providedIn: 'root' })
export class OddsService {
  private apiKey = 'b90da377b9ca32a8b144d4acf48c1248';
  private baseUrl = 'https://api.the-odds-api.com/v4/sports';

  constructor(private http: HttpClient) {}

  private fetchMarket(competitionCode: string, market: string): Observable<MatchOdds[]> {
    const sportKey = SPORT_KEYS[competitionCode];
    if (!sportKey) return of([]);
    const url = `${this.baseUrl}/${sportKey}/odds/?apiKey=${this.apiKey}&regions=eu&markets=${market}&oddsFormat=decimal`;
    return this.http.get<MatchOdds[]>(url).pipe(
      map(matches => {
        if (!Array.isArray(matches)) return [];
        const now = new Date();
        const limit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 giorni
        return matches
          .filter(m => {
            const d = new Date(m.commence_time);
            return d > now && d <= limit;
          })
          .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());
      }),
      catchError(() => of([]))
    );
  }

  getOdds(competitionCode: string, market = 'h2h'): Observable<MatchOdds[]> {
    return this.fetchMarket(competitionCode, market);
  }

  // Carica h2h + totals e li unisce per id — senza duplicati
  getAllMarkets(competitionCode = 'SA'): Observable<MatchOdds[]> {
    return forkJoin({
      h2h:    this.fetchMarket(competitionCode, 'h2h'),
      totals: this.fetchMarket(competitionCode, 'totals'),
    }).pipe(
      map(({ h2h, totals }) => {
        // Deduplication per id
        const seen = new Set<string>();
        const unique = h2h.filter(m => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        // Merge totals market into h2h matches
        return unique.map(match => {
          const totalsMatch = totals.find(t => t.id === match.id);
          if (totalsMatch && match.bookmakers[0]) {
            const totalsMarket = totalsMatch.bookmakers[0]?.markets.find(mk => mk.key === 'totals');
            if (totalsMarket) {
              // Evita duplicati anche nei markets
              const alreadyHas = match.bookmakers[0].markets.some(mk => mk.key === 'totals');
              if (!alreadyHas) match.bookmakers[0].markets.push(totalsMarket);
            }
          }
          return match;
        });
      })
    );
  }

  // Alias per retrocompatibilità
  getSerieAOdds(market = 'h2h'): Observable<MatchOdds[]> {
    return this.fetchMarket('SA', market);
  }
}
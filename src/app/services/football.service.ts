import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Standing {
  position: number;
  team: { id: number; name: string; shortName: string; crest: string; };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string;
}

export interface StandingsResponse {
  competition: { name: string; emblem: string; };
  season: { currentMatchday: number; };
  standings: { type: string; table: Standing[] }[];
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage?: string;
  homeTeam: { id: number; name: string; shortName: string; crest: string; };
  awayTeam: { id: number; name: string; shortName: string; crest: string; };
  score: {
    fullTime: { home: number | null; away: number | null; };
    halfTime: { home: number | null; away: number | null; };
  };
}

export interface MatchesResponse {
  matches: Match[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class FootballService {
  private API_KEY = 'fabe55864dce4c9d8d3504cfb996887a';
  private BASE_URL = 'https://api.football-data.org/v4';
  private CACHE_TTL = 10 * 60 * 1000;
  private cache = new Map<string, CacheEntry<any>>();

  private get headers() {
    return new HttpHeaders({ 'X-Auth-Token': this.API_KEY });
  }

  constructor(private http: HttpClient) {}

  private isCacheValid(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  private getFromCache<T>(key: string): T | null {
    if (this.isCacheValid(key)) return this.cache.get(key)!.data as T;
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  getStandings(competition = 'SA'): Observable<StandingsResponse> {
    const key = `standings_${competition}`;
    const cached = this.getFromCache<StandingsResponse>(key);
    if (cached) return of(cached);
    return this.http.get<StandingsResponse>(
      `${this.BASE_URL}/competitions/${competition}/standings`,
      { headers: this.headers }
    ).pipe(tap(data => this.setCache(key, data)));
  }

  getMatches(competition = 'SA', matchday?: number): Observable<MatchesResponse> {
    const key = `matches_${competition}_${matchday ?? 'all'}`;
    const cached = this.getFromCache<MatchesResponse>(key);
    if (cached) return of(cached);
    const params: any = {};
    if (matchday) params['matchday'] = matchday;
    return this.http.get<MatchesResponse>(
      `${this.BASE_URL}/competitions/${competition}/matches`,
      { headers: this.headers, params }
    ).pipe(tap(data => this.setCache(key, data)));
  }

  getAllMatches(competition = 'SA'): Observable<MatchesResponse> {
    const key = `allmatches_${competition}`;
    const cached = this.getFromCache<MatchesResponse>(key);
    if (cached) return of(cached);
    return this.http.get<MatchesResponse>(
      `${this.BASE_URL}/competitions/${competition}/matches`,
      { headers: this.headers }
    ).pipe(tap(data => this.setCache(key, data)));
  }

  getTeam(id: number): Observable<any> {
    const key = `team_${id}`;
    const cached = this.getFromCache<any>(key);
    if (cached) return of(cached);
    return this.http.get<any>(
      `${this.BASE_URL}/teams/${id}`,
      { headers: this.headers }
    ).pipe(tap(data => this.setCache(key, data)));
  }

  getScorers(competition = 'SA'): Observable<any> {
    const key = `scorers_${competition}`;
    const cached = this.getFromCache<any>(key);
    if (cached) return of(cached);
    return this.http.get<any>(
      `${this.BASE_URL}/competitions/${competition}/scorers?limit=20`,
      { headers: this.headers }
    ).pipe(tap(data => this.setCache(key, data)));
  }
}
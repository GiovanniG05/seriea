import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SeasonService {
  readonly leagueSeasons = [2024, 2023];
  readonly cupSeasons: Record<string, number[]> = {
    CL:  [2024, 2023],
    EL:  [2024, 2023],
    ECL: [2024, 2023],
    WC:  [],
    EC:  [],
  };

  private _season$ = new BehaviorSubject<number | undefined>(undefined);
  season$ = this._season$.asObservable();

  get season() { return this._season$.value; }

  select(year: number | undefined) { this._season$.next(year); }

  getSeasons(code: string, type: string): number[] {
    if (this.cupSeasons[code] !== undefined) return this.cupSeasons[code];
    return this.leagueSeasons;
  }

  getLabel(year: number | undefined): string {
    if (!year) return 'In corso';
    return `${year}/${String(year + 1).slice(2)}`;
  }
}
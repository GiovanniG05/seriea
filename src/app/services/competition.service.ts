import { Injectable, signal } from '@angular/core';

export interface Competition {
  code: string;
  name: string;
  shortName: string;
  flag: string;
  color: string;
  type: 'league' | 'cup' | 'national';
  emblem?: string;
  resultsOnly?: boolean; // true = no classifica/marcatori
  disabled?: boolean;    // true = piano a pagamento richiesto
}

export const COMPETITIONS: Competition[] = [
  // Coppe Europee
  { code:'CL', emblem:'https://crests.football-data.org/CL.png',  name:'Champions League',   shortName:'Champions',  flag:'fa-star',            color:'#3b82f6', type:'cup'    },
  { code:'EL', emblem:'https://crests.football-data.org/EL.png',  name:'Europa League',       shortName:'Europa',     flag:'fa-circle-dot',      color:'#f97316', type:'cup',    resultsOnly:true, disabled:true },
  { code:'ECL', emblem:'https://crests.football-data.org/ECL.png', name:'Conference League',   shortName:'Conference', flag:'fa-earth-europe',    color:'#22c55e', type:'cup',    resultsOnly:true, disabled:true },
  // Campionati
  { code:'SA', emblem:'https://crests.football-data.org/SA.png',  name:'Serie A',             shortName:'Serie A',    flag:'fa-shield-halved',   color:'#3b82f6', type:'league' },
  { code:'PL', emblem:'https://crests.football-data.org/PL.png',  name:'Premier League',      shortName:'Premier',    flag:'fa-crown',           color:'#a855f7', type:'league' },
  { code:'PD', emblem:'https://crests.football-data.org/PD.png',  name:'La Liga',             shortName:'La Liga',    flag:'fa-sun',             color:'#ef4444', type:'league' },
  { code:'BL1', emblem:'https://crests.football-data.org/BL1.png', name:'Bundesliga',          shortName:'Bundesliga', flag:'fa-futbol',          color:'#f59e0b', type:'league' },
  { code:'FL1', emblem:'https://crests.football-data.org/FL1.png', name:'Ligue 1',             shortName:'Ligue 1',    flag:'fa-tower-broadcast', color:'#06b6d4', type:'league' },
  // Nazionali
  { code:'WC', emblem:'https://crests.football-data.org/wm26.png',  name:'Mondiali',            shortName:'Mondiali',   flag:'fa-earth-americas',  color:'#f59e0b', type:'national' },
  { code:'EC', emblem:'https://crests.football-data.org/ec.png',  name:'Europei',             shortName:'Europei',    flag:'fa-earth-europe',    color:'#3b82f6', type:'national' },
];

@Injectable({ providedIn: 'root' })
export class CompetitionService {
  private _selected = signal<Competition>(COMPETITIONS.find(c => c.code === 'SA')!);

  get selected()     { return this._selected(); }
  get code()         { return this._selected().code; }
  get resultsOnly()  { return this._selected().resultsOnly ?? false; }

  select(c: Competition)         { this._selected.set(c); }
  selectByCode(code: string)     {
    const found = COMPETITIONS.find(c => c.code === code);
    if (found) this._selected.set(found);
  }
}
import { Routes } from '@angular/router';
import { ClassificaComponent } from './classifica/classifica.component';
import { QuoteComponent } from './quote/quote.component';

export const routes: Routes = [
  { path: '', redirectTo: 'classifica', pathMatch: 'full' },
  { path: 'classifica', component: ClassificaComponent },
  { path: 'quote', component: QuoteComponent },
];
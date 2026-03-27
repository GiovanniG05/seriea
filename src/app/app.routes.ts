import { Routes } from '@angular/router';
import { ClassificaComponent } from './classifica/classifica.component';
import { QuoteComponent } from './quote/quote.component';
import { AdminComponent } from './admin/admin.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'classifica', component: ClassificaComponent },
  { path: 'quote', component: QuoteComponent },
  { path: 'admin', component: AdminComponent },
];
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { AddSzo } from './pages/add-szo/add-szo';
import { FindSzo } from './pages/find-szo/find-szo';
import { Map } from './pages/map/map';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'add-szo',
    component: AddSzo
  },
  {
    path: 'find-szo',
    component: FindSzo
  },
  {
    path: 'map',
    component: Map
  },
  {
    path: '**',
    redirectTo: ''
  }
];

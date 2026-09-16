import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },
  { path: 'catalog', loadComponent: () => import('./catalog/catalog').then((m) => m.Catalog) },
  { path: 'inventory', loadComponent: () => import('./inventory/inventory').then((m) => m.Inventory) },
  { path: 'purchase', loadComponent: () => import('./purchase/purchase').then((m) => m.Purchase) },
  { path: 'consumption', loadComponent: () => import('./consumption/consumption').then((m) => m.Consumption) },
  { path: 'auctions', loadComponent: () => import('./auctions/auctions').then((m) => m.Auctions) },
];

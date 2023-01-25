import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RequestPage } from './request.page';

const routes: Routes = [
  {
    path: '',
    component: RequestPage
  },
  {
    path: 'request-details',
    loadChildren: () => import('./request-details/request-details.module').then( m => m.RequestDetailsPageModule)
  },
  {
    path: 'add-request',
    loadChildren: () => import('./add-request/add-request.module').then( m => m.AddRequestPageModule)
  },
  {
    path: 'request-pending',
    loadChildren: () => import('./request-pending/request-pending.module').then( m => m.RequestPendingPageModule)
  },
  {
    path: 'request-history',
    loadChildren: () => import('./request-history/request-history.module').then( m => m.RequestHistoryPageModule)
  }


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RequestPageRoutingModule {}

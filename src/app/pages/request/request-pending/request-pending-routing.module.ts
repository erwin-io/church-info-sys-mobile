import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RequestPendingPage } from './request-pending.page';

const routes: Routes = [
  {
    path: '',
    component: RequestPendingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RequestPendingPageRoutingModule {}

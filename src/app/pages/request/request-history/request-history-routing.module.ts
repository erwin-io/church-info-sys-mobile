import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RequestHistoryPage } from './request-history.page';

const routes: Routes = [
  {
    path: '',
    component: RequestHistoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RequestHistoryPageRoutingModule {}

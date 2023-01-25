import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddRequestPage } from './add-request.page';

const routes: Routes = [
  {
    path: '',
    component: AddRequestPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddRequestPageRoutingModule {}

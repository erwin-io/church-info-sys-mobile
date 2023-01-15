import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScheduleDetailsPage } from './schedule-details.page';

const routes: Routes = [
  {
    path: '',
    component: ScheduleDetailsPage
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScheduleDetailsPageRoutingModule {}

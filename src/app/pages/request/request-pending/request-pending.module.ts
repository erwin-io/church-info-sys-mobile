import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RequestPendingPageRoutingModule } from './request-pending-routing.module';

import { RequestPendingPage } from './request-pending.page';
import { DirectiveModule } from 'src/app/core/directive/directive.module';
import { MaterialModule } from 'src/app/material/material.module';
import { PipeModule } from 'src/app/core/pipe/pipe.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RequestPendingPageRoutingModule,
    MaterialModule,
    DirectiveModule,
    PipeModule
  ],
  declarations: [RequestPendingPage]
})
export class RequestPendingPageModule {}

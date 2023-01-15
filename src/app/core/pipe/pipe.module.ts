import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from './time-ago.pipe';
import { NumberLeadZeroPipe } from './number-lead-zero.pipe';



@NgModule({
  declarations: [
    TimeAgoPipe,
    NumberLeadZeroPipe],
  exports: [
    TimeAgoPipe,
    NumberLeadZeroPipe]
})
export class PipeModule { }

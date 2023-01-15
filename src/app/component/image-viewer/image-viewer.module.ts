import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ImageViewerPageRoutingModule } from './image-viewer-routing.module';

import { ImageViewerPage } from './image-viewer.page';
import { MaterialModule } from 'src/app/material/material.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ImageViewerPageRoutingModule,
    MaterialModule
  ],
  declarations: [ImageViewerPage]
})
export class ImageViewerPageModule {}

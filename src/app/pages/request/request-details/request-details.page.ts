import { Component, OnInit } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { ModalController, AlertController, ActionSheetController, Platform } from '@ionic/angular';
import * as moment from 'moment';
import { Browser } from 'protractor';
import { ImageViewerPage } from 'src/app/component/image-viewer/image-viewer.page';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { Request } from 'src/app/core/model/request.model';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { RequestService } from 'src/app/core/services/request.service';
import { UserService } from 'src/app/core/services/user.service';
import { StorageService } from 'src/app/core/storage/storage.service';
import { PageLoaderService } from 'src/app/core/ui-service/page-loader.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-request-details',
  templateUrl: './request-details.page.html',
  styleUrls: ['./request-details.page.scss'],
})
export class RequestDetailsPage implements OnInit {
  hasChanges = false;
  currentUser: LoginResult;
  isLoading = false;
  details: Request = {} as any;

  constructor(private modalCtrl: ModalController,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private platform: Platform,
    private pageLoaderService: PageLoaderService,
    private storageService: StorageService,
    private userService: UserService,
    private appconfig: AppConfigService,
    private requestService: RequestService) {
      this.platform.backButton.subscribeWithPriority(-1, () => {
        this.cancel();
      });
  }

  get requestDate(){
    return moment(this.details.requestDate).format('dddd, MMM DD, YYYY');
  }

  ngOnInit() {
    this.getRequest(this.details.requestId);

  }

  async getRequest(requestId: string) {
    try{
      this.isLoading = true;
      this.requestService.getById(requestId)
      .subscribe(async res => {
        if(res.success){
          this.details = res.data;
          this.isLoading = false;
        }
        else{
          await this.presentAlert({
            header: 'Try again!',
            subHeader: '',
            message: Array.isArray(res.message) ? res.message[0] : res.message,
            buttons: ['OK']
          });
        }
      }, async (e) => {
        await this.presentAlert({
          header: 'Try again!',
          subHeader: '',
          message: Array.isArray(e.message) ? e.message[0] : e.message,
          buttons: ['OK']
        });
        this.isLoading = false;
      });
    }
    catch(e){
      await this.presentAlert({
        header: 'Try again!',
        subHeader: '',
        message: Array.isArray(e.message) ? e.message[0] : e.message,
        buttons: ['OK']
      });
    }
  }

  async onClosedRequest() {
    await this.presentAlert({
      header: 'Are you sure you want to closed?',
      buttons: [
        {
          text: 'BACK',
          role: 'cancel',
        },
        {
          text: 'YES',
          role: 'confirm',
          handler: async () => {
            this.closedRequest();
          },
        },
      ],
    });
  }

  async closedRequest(){
    try{
      await this.pageLoaderService.open('Processing please wait...');
      this.isLoading = true;
      this.requestService.updateRequestStatus({
        requestId: this.details.requestId,
        requestStatusId: '3'
      })
        .subscribe(async res => {
          if (res.success) {
            this.hasChanges = true;
            await this.pageLoaderService.close();
            await this.presentAlert({
              header: 'Request closed!',
              buttons: ['OK']
            });
            this.isLoading = false;
            return this.modalCtrl.dismiss(true, 'confirm');
          } else {
            await this.pageLoaderService.close();
            this.isLoading = false;
            await this.presentAlert({
              header: 'Try again!',
              message: Array.isArray(res.message) ? res.message[0] : res.message,
              buttons: ['OK']
            });
          }
        }, async (err) => {
          await this.pageLoaderService.close();
          this.isLoading = false;
          await this.presentAlert({
            header: 'Try again!',
            message: Array.isArray(err.message) ? err.message[0] : err.message,
            buttons: ['OK']
          });
        });
    } catch (e){
      await this.pageLoaderService.close();
      this.isLoading = false;
      await this.presentAlert({
        header: 'Try again!',
        message: Array.isArray(e.message) ? e.message[0] : e.message,
        buttons: ['OK']
      });
    }
  }

  cancel() {
    return this.modalCtrl.dismiss(this.hasChanges ? this.hasChanges : null, 'cancel');
  }

  async presentAlert(options: any) {
    const alert = await this.alertController.create(options);
    await alert.present();
  }

}

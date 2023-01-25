import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { Request } from 'src/app/core/model/request.model';
import { RequestService } from 'src/app/core/services/request.service';
import { RequestDetailsPage } from '../request-details/request-details.page';

@Component({
  selector: 'app-request-pending',
  templateUrl: './request-pending.page.html',
  styleUrls: ['./request-pending.page.scss']
})
export class RequestPendingPage implements OnInit {
  hasChanges = false;
  currentUser: LoginResult;
  isLoading = false;
  request: Request[] = [];
  message = '';
  refreshEvent: any;
  constructor(private actionSheetController: ActionSheetController,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private requestService: RequestService) {
  }

  ngOnInit() {
    this.getRequest(this.currentUser.clientId);
  }

  async getRequest(clientId: string) {
    try{
      this.isLoading = true;
      this.requestService.getByStatus({
        clientId,
        requestStatus: 'Pending'
      })
      .subscribe(async res => {
        if(res.success){
          this.request = res.data;
          if(this.refreshEvent) {
            this.refreshEvent.target.complete();
            this.refreshEvent = null;
          }
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

  async doRefresh(event){
    this.refreshEvent = event;
    await this.getRequest(this.currentUser.clientId);
  }

  async showMenu(details){
    const actionSheet = await this.actionSheetController.create({
      cssClass: 'req-card-action-sheet',
      buttons: [{
          text: 'Details',
          handler:async () => {
            this.onOpenDetails(details);
            actionSheet.dismiss();
          }
        },
        {
          text: 'Back',
          handler:async () => {
            actionSheet.dismiss();
          }
        }
      ]
    });
    await actionSheet.present();

    const result = await actionSheet.onDidDismiss();
  }

  async onOpenDetails(details) {
    const modal = await this.modalCtrl.create({
      component: RequestDetailsPage,
      cssClass: 'modal-fullscreen',
      componentProps: { details, currentUser: this.currentUser },
    });
    modal.onWillDismiss().then((res) => {
      if(res.data) {
        this.hasChanges = res.data;
        this.getRequest(this.currentUser.clientId);
      }
    });
    modal.present();
    await modal.onWillDismiss();
  }

  cancel() {
    return this.modalCtrl.dismiss(this.hasChanges ? this.hasChanges : null, 'cancel');
  }


  async presentAlert(options: any) {
    const alert = await this.alertController.create(options);
    await alert.present();
  }
}

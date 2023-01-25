import { Component, OnInit } from '@angular/core';
import { ActionSheetController, ModalController, AlertController } from '@ionic/angular';
import { Request } from 'src/app/core/model/request.model';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { RequestDetailsPage } from '../request-details/request-details.page';
import { RequestService } from 'src/app/core/services/request.service';

@Component({
  selector: 'app-request-history',
  templateUrl: './request-history.page.html',
  styleUrls: ['./request-history.page.scss'],
})
export class RequestHistoryPage implements OnInit {
  currentUser: LoginResult;
  isLoading = false;
  request: Request[] = [];
  message = '';
  refreshEvent: any;
  currentPage = 1;
  limit = 10;
  totalUnreadNotification = 0;
  constructor(private actionSheetController: ActionSheetController,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private requestService: RequestService) {
  }

  ngOnInit() {
    this.initHistory(this.currentUser.clientId);
  }

  async initHistory(clientId: string) {
    try{
      this.isLoading = true;
      this.requestService.getByStatus({
        clientId,
        requestStatus: 'Completed,Cancelled'
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

  async onOpenDetails(details) {
    const modal = await this.modalCtrl.create({
      component: RequestDetailsPage,
      cssClass: 'modal-fullscreen',
      componentProps: { details, currentUser: this.currentUser },
    });
    modal.present();
    await modal.onWillDismiss();
  }

  async loadMore() {
    this.currentPage = this.currentPage + 1;
    this.initHistory(this.currentUser.clientId);
  }

  async doRefresh(event: any){
    this.request = [];
    this.currentPage = 1;
    this.refreshEvent = event;
    this.initHistory(this.currentUser.clientId);
 }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }


  async presentAlert(options: any) {
    const alert = await this.alertController.create(options);
    await alert.present();
  }
}

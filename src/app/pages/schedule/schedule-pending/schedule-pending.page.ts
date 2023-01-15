import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { Reservation } from 'src/app/core/model/reservation.model';
import { ReservationService } from 'src/app/core/services/reservation.service';
import { ScheduleDetailsPage } from '../schedule-details/schedule-details.page';

@Component({
  selector: 'app-schedule-pending',
  templateUrl: './schedule-pending.page.html',
  styleUrls: ['./schedule-pending.page.scss']
})
export class SchedulePendingPage implements OnInit {
  hasChanges = false;
  currentUser: LoginResult;
  isLoading = false;
  reservation: Reservation[] = [];
  message = '';
  refreshEvent: any;
  constructor(private actionSheetController: ActionSheetController,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private reservationService: ReservationService) {
  }

  ngOnInit() {
    this.getReservation(this.currentUser.clientId);
  }

  async getReservation(clientId: string) {
    try{
      this.isLoading = true;
      this.reservationService.getByStatus({
        clientId,
        reservationStatus: 'Pending'
      })
      .subscribe(async res => {
        if(res.success){
          this.reservation = res.data;
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
    await this.getReservation(this.currentUser.clientId);
  }

  async showMenu(details){
    const actionSheet = await this.actionSheetController.create({
      cssClass: 'sched-card-action-sheet',
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
      component: ScheduleDetailsPage,
      cssClass: 'modal-fullscreen',
      componentProps: { details, currentUser: this.currentUser },
    });
    modal.onWillDismiss().then((res) => {
      if(res.data) {
        this.hasChanges = res.data;
        this.getReservation(this.currentUser.clientId);
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

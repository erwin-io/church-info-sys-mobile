import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActionSheetController, AlertController, ModalController, NavController, Platform } from '@ionic/angular';
import { AddSchedulePage } from './add-schedule/add-schedule.page';
import {map} from 'rxjs/operators';
import { LoaderService } from 'src/app/core/ui-service/loader.service';
import { StorageService } from 'src/app/core/storage/storage.service';
import { ReservationService } from 'src/app/core/services/reservation.service';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { SchedulePendingPage } from './schedule-pending/schedule-pending.page';
import { ScheduleDetailsPage } from './schedule-details/schedule-details.page';
import { forkJoin, Subscription } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';
import { Staff } from 'src/app/core/model/staff.model';
import { Router } from '@angular/router';
import { ScheduleHistoryPage } from './schedule-history/schedule-history.page';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { Reservation, ReservationType } from 'src/app/core/model/reservation.model';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SchedulePage implements OnInit {
  selectedStatus: string[] = ['Pending', 'Approved'];
  currentUser: LoginResult;
  isLoading = false;
  reservationData: Reservation[] = [];
  message = '';
  refreshEvent: any;
  subscription: Subscription;
  private serviceTypeData: ReservationType[] = [];
  constructor(private actionSheetController: ActionSheetController,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private loaderService: LoaderService,
    private authService: AuthService,
    private storageService: StorageService,
    private userService: UserService,
    private reservationService: ReservationService,
    private navController: NavController,
    private router: Router,
    private appconfig: AppConfigService,
    public platform: Platform) {
      this.currentUser = this.storageService.getLoginUser();
      if(this.isAuthenticated) {
        this.getReservation(this.currentUser.clientId);
      }
  }

  get isAuthenticated() {
    const currentUser = this.storageService.getLoginUser();
    return currentUser &&
    currentUser.clientId &&
    currentUser.userId &&
    currentUser.accessToken &&
    currentUser.clientId !== '' &&
    currentUser.userId !== '' &&
    currentUser.accessToken !== '';
  }

  get reservation() {
    return this.reservationData.filter(x=>x.reservationStatus.reservationStatusId === '2');
  }

  get totalPending() {
    return this.reservationData.filter(x=>x.reservationStatus.reservationStatusId === '1').length;
  }

  async ngOnInit() {
  }

  ionViewWillEnter(){
    console.log('visited');
  }

  ionViewDidEnter() {
    this.subscription = this.platform.backButton.subscribeWithPriority(9999, () => {
      document.addEventListener('backbutton', (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }, false);
    });
  }

  ionViewWillLeave() {
    this.subscription.unsubscribe();
  }

  async getReservation(clientId: string) {
    try{
      this.isLoading = true;
      this.reservationService.getByStatus({
        clientId,
        reservationStatus: this.selectedStatus.toString()
      })
      .subscribe(async res => {
        if(res.success){
          this.reservationData = res.data;
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

  segmentChanged(ev: any) {
  }

  async onOpenAdd() {
    let modal: any = null;
    modal = await this.modalCtrl.create({
      component: AddSchedulePage,
      cssClass: 'modal-fullscreen',
      backdropDismiss: false,
      canDismiss: false,
      componentProps: {
        modal,
        isNew: true,
        currentUser: this.currentUser,
        durationInHours: 1,
       },
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      await this.getReservation(this.currentUser.clientId);
    }
  }

  async onOpenPending() {
    let modal: any = null;
    modal = await this.modalCtrl.create({
      component: SchedulePendingPage,
      cssClass: 'modal-fullscreen',
      componentProps: { currentUser: this.currentUser },
    });
    modal.onWillDismiss().then((res) => {
      if(res.data) {
        this.getReservation(this.currentUser.clientId);
      }
    });
    modal.present();
    await modal.onWillDismiss();
  }

  async onOpenDetails(details) {
    const modal = await this.modalCtrl.create({
      component: ScheduleDetailsPage,
      cssClass: 'modal-fullscreen',
      componentProps: { details, currentUser: this.currentUser },
    });
    modal.present();
    await modal.onWillDismiss();
  }

  async history() {
    let modal: any = null;
    modal = await this.modalCtrl.create({
      component: ScheduleHistoryPage,
      cssClass: 'modal-fullscreen',
      componentProps: { currentUser: this.currentUser },
    });
    modal.present();
    await modal.onWillDismiss();
  }

  async presentAlert(options: any) {
    const alert = await this.alertController.create(options);
    await alert.present();
  }
  logout() {
    this.authService.logout();
  }
}

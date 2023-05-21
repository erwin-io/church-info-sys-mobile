import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, AlertController } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { Notifications } from 'src/app/core/model/notification.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { StorageService } from 'src/app/core/storage/storage.service';
import { SettingsPage } from '../settings/settings.page';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomePage implements OnInit {
  isLoading;
  hasChanges = false;
  constructor(
    private router: Router,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private storageService: StorageService,
    private alertController: AlertController,
  ) {
    const currentUser = this.storageService.getLoginUser();


    if(this.isAuthenticated) {
      this.initDashboard(currentUser.clientId);
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

  get user() {
    return this.storageService.getLoginUser();
  }

  async initDashboard(clientId){
    this.isLoading = true;
    forkJoin(
  ).subscribe(
      ([]) => {
      },
      (error) => console.error(error),
      () => {
        this.isLoading = false;
        this.hasChanges = false;
      }
  );
  }

  ngOnInit() {
  }

  async onShowSettings() {

    if(!this.isAuthenticated) {
      this.authService.logout();
    }
    let modal: any = null;
    modal = await this.modalCtrl.create({
      component: SettingsPage,
      cssClass: 'modal-fullscreen',
      backdropDismiss: false,
      canDismiss: true,
      componentProps: { modal },
    });
    modal.present();
    console.log('open settings');
  }

  ionViewWillEnter() {
    console.log('visited');
  }

  async doRefresh(event: any){
 }

  profilePicErrorHandler(event) {
    event.target.src = '../../../assets/img/profile-not-found.png';
  }

  contact(contact) {
    window.location.href = contact;
  }

  async presentAlert(options: any) {
    const alert = await this.alertController.create(options);
    await alert.present();
  }
}

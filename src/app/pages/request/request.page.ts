import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, ModalController, AlertController, NavController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { RequestType,Request } from 'src/app/core/model/request.model';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { RequestService } from 'src/app/core/services/request.service';
import { UserService } from 'src/app/core/services/user.service';
import { StorageService } from 'src/app/core/storage/storage.service';
import { LoaderService } from 'src/app/core/ui-service/loader.service';
import { AddRequestPage } from './add-request/add-request.page';
import { RequestDetailsPage } from './request-details/request-details.page';
import { RequestHistoryPage } from './request-history/request-history.page';
import { RequestPendingPage } from './request-pending/request-pending.page';

@Component({
  selector: 'app-request',
  templateUrl: './request.page.html',
  styleUrls: ['./request.page.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class RequestPage implements OnInit {
  selectedStatus: string[] = ['Pending', 'Ready for pickup'];
  currentUser: LoginResult;
  isLoading = false;
  requestData: Request[] = [];
  message = '';
  refreshEvent: any;
  subscription: Subscription;
  private serviceTypeData: RequestType[] = [];
  constructor(private actionSheetController: ActionSheetController,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private loaderService: LoaderService,
    private authService: AuthService,
    private storageService: StorageService,
    private userService: UserService,
    private requestService: RequestService,
    private navController: NavController,
    private router: Router,
    private appconfig: AppConfigService,
    public platform: Platform) {
      this.currentUser = this.storageService.getLoginUser();
      if(this.isAuthenticated) {
        this.getRequest(this.currentUser.clientId);
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

  get request() {
    return this.requestData.filter(x=>x.requestStatus.requestStatusId === '2');
  }

  get totalPending() {
    return this.requestData.filter(x=>x.requestStatus.requestStatusId === '1').length;
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

  async getRequest(clientId: string) {
    try{
      this.isLoading = true;
      this.requestService.getByStatus({
        clientId,
        requestStatus: this.selectedStatus.toString()
      })
      .subscribe(async res => {
        if(res.success){
          this.requestData = res.data;
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
      component: AddRequestPage,
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
      await this.getRequest(this.currentUser.clientId);
    }
  }

  async onOpenPending() {
    let modal: any = null;
    modal = await this.modalCtrl.create({
      component: RequestPendingPage,
      cssClass: 'modal-fullscreen',
      componentProps: { currentUser: this.currentUser },
    });
    modal.onWillDismiss().then((res) => {
      if(res.data) {
        this.getRequest(this.currentUser.clientId);
      }
    });
    modal.present();
    await modal.onWillDismiss();
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

  async history() {
    let modal: any = null;
    modal = await this.modalCtrl.create({
      component: RequestHistoryPage,
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


import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { StorageService } from '../../../core/storage/storage.service';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { LoaderService } from 'src/app/core/ui-service/loader.service';
import { UserService } from 'src/app/core/services/user.service';
import { PageLoaderService } from 'src/app/core/ui-service/page-loader.service';
import { AppConfigService } from 'src/app/core/services/app-config.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LoginPage implements OnInit {
  isSubmitting = false;
  loginForm: FormGroup;
  sessionTimeout;
  enableBackToHome = false;
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService,
    private alertController: AlertController,
    private storageService: StorageService,
    private loaderService: LoaderService,
    private appconfig: AppConfigService,
    private pageLoaderService: PageLoaderService,
    ) {
      // this.route.queryParams
      //   .subscribe(params => {
      //     console.log(params);
      //     this.enableBackToHome = params.ref.includes('home');
      //   }
      // );

      this.sessionTimeout = Number(
        this.appconfig.config.sessionConfig.sessionTimeout
      );
    }
  get formData() {
    return this.loginForm.value;
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username : [null, Validators.required],
      password : [null, Validators.required],
      rememberMe : [false]
    });
  }

  async onFormSubmit() {
    if(!this.loginForm.valid){
      return;
    }
    try{
      const params = this.formData;
      this.isSubmitting = true;
      await this.pageLoaderService.open('Signing in please wait...');
      this.authService.login(params)
        .subscribe(async res => {
          if (res.success) {
            if(this.appconfig.config.auth.requireOTP === true && !res.data.isVerified) {
              const navigationExtras: NavigationExtras = {
                state: {
                  data: {
                    userId: res.data.userId
                  }
                }
              };
              this.router.navigate(['/verify-otp'], navigationExtras);
            } else {
              this.storageService.saveRefreshToken(res.data.accessToken);
              this.storageService.saveAccessToken(res.data.refreshToken);
              this.storageService.saveTotalUnreadNotif(res.data.totalUnreadNotif);
              const today = new Date();
              today.setTime(today.getTime() + this.sessionTimeout * 1000);
              this.storageService.saveSessionExpiredDate(today);
              const userData: LoginResult = res.data;
              this.storageService.saveLoginUser(userData);
              this.router.navigate(['/'], { replaceUrl: true });
              this.isSubmitting = false;
              await this.pageLoaderService.close();
            }
          } else {
            this.isSubmitting = false;
            await this.presentAlert({
              header: 'Try again!',
              message: Array.isArray(res.message) ? res.message[0] : res.message,
              buttons: ['OK']
            });
          }
        }, async (err) => {
          console.log(err);
          this.isSubmitting = false;
          await this.pageLoaderService.close();
          await this.presentAlert({
            header: 'Try again!',
            subHeader: '',
            message: Array.isArray(err.message) ? err.message[0] : err.message,
            buttons: ['OK']
          });
        });
    } catch (e){
      console.log(e);
      await this.pageLoaderService.close();
      this.isSubmitting = false;
      await this.presentAlert({
        header: 'Try again!',
        subHeader: '',
        message: Array.isArray(e.message) ? e.message[0] : e.message,
        buttons: ['OK']
      });
    }
  }

  async presentAlert(options: any) {
    const alert = await this.alertController.create(options);
    await alert.present();
  }
}

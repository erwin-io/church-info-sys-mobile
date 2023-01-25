import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { DomSanitizer } from '@angular/platform-browser';
import { IonModal, IonDatetime, ModalController, AlertController, ActionSheetController, Platform } from '@ionic/angular';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { Request, RequestType } from 'src/app/core/model/request.model';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { RequestService } from 'src/app/core/services/request.service';
import { PageLoaderService } from 'src/app/core/ui-service/page-loader.service';



@Component({
  selector: 'app-add-request',
  templateUrl: './add-request.page.html',
  styleUrls: ['./add-request.page.scss'],
})
export class AddRequestPage implements OnInit {
  @ViewChild('requestStepper') requestStepper: MatStepper;
  @ViewChild(IonModal) timeSlotModal: IonModal;
  @ViewChild('selectReferenceDateCtrl', { static: true }) selectReferenceDateCtrl: ElementRef<IonDatetime>;
  durationInHours = 1;
  isNew = false;
  modal: HTMLIonModalElement;
  currentUser: LoginResult;
  name: string;
  details: Request = {} as any;
  selectRequestTypeForm: FormGroup;
  requestDetailsForm: FormGroup;
  remarksForm: FormGroup;
  isSubmitting = false;
  isLoading = false;
  requestTypeOption: RequestType[] = [];
  error: any;
  subscription: Subscription;
  allowToClose = false;
  availableTimeSlot = [];

  currentDate = new Date();
  minDate: string = new Date(new Date().setDate(this.currentDate.getDate() + 1)).toISOString();
  constructor(private modalCtrl: ModalController,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private requestService: RequestService,
    private actionSheetController: ActionSheetController,
    private pageLoaderService: PageLoaderService,
    private appconfig: AppConfigService,
    private platform: Platform,
    public sanitizer: DomSanitizer) {
      this.requestTypeOption = this.appconfig.config.lookup.requestType;
      console.log(this.requestTypeOption);
      this.platform.backButton.subscribeWithPriority(-1, () => {
        this.cancel();
      });
  }

  get formData(){
    return {
      dateBaptized: this.requestDetailsForm.value.dateBaptized ?
        moment(this.requestDetailsForm.value.dateBaptized).format('YYYY-MM-DD') : null,
      dateOfConfirmation: this.requestDetailsForm.value.dateOfConfirmation ?
        moment(this.requestDetailsForm.value.dateOfConfirmation).format('YYYY-MM-DD') : null,
      dateMarried: this.requestDetailsForm.value.dateMarried ?
        moment(this.requestDetailsForm.value.dateMarried).format('YYYY-MM-DD') : null,
      clientId: this.currentUser.clientId,
      requestersFullName: this.requestDetailsForm.value.requestersFullName,
      husbandFullName: this.requestDetailsForm.value.husbandFullName,
      wifeFullName: this.requestDetailsForm.value.wifeFullName,
      requestTypeId: this.selectRequestTypeForm.valid ? this.selectRequestTypeForm.value.requestTypeId : null,
      remarks: this.remarksForm.value.remarks
    };
  }

  get errorControls() {
    return {
      ...this.selectRequestTypeForm.controls,
      ...(this.requestDetailsForm ? this.requestDetailsForm.controls : null),
      ...this.remarksForm.controls,
    };
  }

  get previewData() {
    return {
      requestType: this.formData.requestTypeId ? this.appconfig.config.lookup.requestType
      .filter(x=>Number(x.requestTypeId) === Number(this.formData.requestTypeId))[0].name : '',
      dateBaptized: this.formData.dateBaptized,
      dateOfConfirmation: this.formData.dateOfConfirmation,
      dateMarried: this.formData.dateMarried,
      requestersFullName: this.formData.requestersFullName,
      husbandFullName: this.formData.husbandFullName,
      wifeFullName: this.formData.wifeFullName,
      remarks: this.formData.remarks
    };
  }

  ngOnInit() {
    this.selectRequestTypeForm = this.formBuilder.group({
      requestTypeId: ['', [Validators.required]],
    });
    this.requestDetailsForm = this.formBuilder.group({
      dateBaptized: [this.minDate],
      dateOfConfirmation: [this.minDate],
      dateMarried: [this.minDate],
      husbandFullName: [null],
      requestersFullName: [null],
      wifeFullName: [null],
    });
    this.remarksForm = this.formBuilder.group({
      remarks: [],
    });

    this.allowToClose = true;

    this.subscription = this.platform.backButton.subscribeWithPriority(9999, (e) => {
      if(this.modal.canDismiss){
        this.cancel();
      }
      this.pageLoaderService.close();
    });

    this.addEventSelectRequestTypeForm();

  }

  addEventSelectRequestTypeForm() {
    this.selectRequestTypeForm.get('requestTypeId').valueChanges.subscribe(async (selectedValue: number)=> {
      if(Number(selectedValue) === 1) {
        this.requestDetailsForm = this.formBuilder.group({
          dateBaptized: [this.minDate],
          requestersFullName: [null],
        });
        this.requestDetailsForm.controls.dateBaptized.addValidators([Validators.required]);
        this.requestDetailsForm.controls.requestersFullName.addValidators([Validators.required]);
      }
      else if(Number(selectedValue) === 2) {
        this.requestDetailsForm = this.formBuilder.group({
          dateOfConfirmation: [this.minDate],
          requestersFullName: [null],
        });
        this.requestDetailsForm.controls.dateOfConfirmation.addValidators([Validators.required]);
        this.requestDetailsForm.controls.requestersFullName.addValidators([Validators.required]);
      }
      else {
        this.requestDetailsForm = this.formBuilder.group({
          dateMarried: [this.minDate],
          husbandFullName: [null],
          wifeFullName: [null],
        });
        this.remarksForm = this.formBuilder.group({
          remarks: [],
        });
        this.requestDetailsForm.controls.dateMarried.addValidators([Validators.required]);
        this.requestDetailsForm.controls.husbandFullName.addValidators([Validators.required]);
        this.requestDetailsForm.controls.wifeFullName.addValidators([Validators.required]);
      }
    });
  }

  ionViewWillLeave() {
    this.subscription.unsubscribe();
  }

  onSelectFocus(control: any, value: any) {
    console.log('click');
    setTimeout(()=>{
      control.setValue(value);
    }, 1000);
  }

  cancel() {
    if(this.requestStepper.selectedIndex !== 0) {
      if(this.requestStepper.selectedIndex === 1) {
        this.selectRequestTypeForm = this.formBuilder.group({
          requestTypeId: [null, [Validators.required]],
        });
        this.requestDetailsForm = this.formBuilder.group({
          dateBaptized: [this.minDate],
          dateOfConfirmation: [this.minDate],
          dateMarried: [this.minDate],
          requestersFullName: [null],
          husbandFullName: [null],
          wifeFullName: [null],
        });
        this.remarksForm = this.formBuilder.group({
          remarks: [],
        });
      }
      this.requestStepper.selectedIndex  = this.requestStepper.selectedIndex - 1;
      this.addEventSelectRequestTypeForm();
    }
    else {
      this.modal.canDismiss = true;
      this.modalCtrl.dismiss(null, 'cancel');
    }
  }

  async save(){
    const params = this.formData;
    console.log(params);
    try{
      await this.pageLoaderService.open('Submitting request...');
      this.isSubmitting = true;
      if(params.requestTypeId === '1') {
        this.requestService.createBaptismalCertificateRequest(params)
          .subscribe(async res => {
            if (res.success) {
              await this.presentAlert({
                header: 'Request sent!',
                buttons: ['OK']
              });
              this.isSubmitting = false;
              this.modal.canDismiss = true;
              this.modal.dismiss({success: true, data: res.data}, 'confirm');
              await this.pageLoaderService.close();
            } else {
              await this.pageLoaderService.close();
              this.isSubmitting = false;
              await this.presentAlert({
                header: 'Try again!',
                message: Array.isArray(res.message) ? res.message[0] : res.message,
                buttons: ['OK']
              });
            }
          }, async (err) => {
            await this.pageLoaderService.close();
            this.isSubmitting = false;
            await this.presentAlert({
              header: 'Try again!',
              message: Array.isArray(err.message) ? err.message[0] : err.message,
              buttons: ['OK']
            });
          });
      }
      else if(params.requestTypeId === '2'){
       this.requestService.createConfirmationCertificateReques(params)
         .subscribe(async res => {
           if (res.success) {
             await this.presentAlert({
               header: 'Request sent!',
               buttons: ['OK']
             });
             this.isSubmitting = false;
             this.modal.canDismiss = true;
             this.modal.dismiss({success: true, data: res.data}, 'confirm');
             await this.pageLoaderService.close();
           } else {
             await this.pageLoaderService.close();
             this.isSubmitting = false;
             await this.presentAlert({
               header: 'Try again!',
               message: Array.isArray(res.message) ? res.message[0] : res.message,
               buttons: ['OK']
             });
           }
         }, async (err) => {
           await this.pageLoaderService.close();
           this.isSubmitting = false;
           await this.presentAlert({
             header: 'Try again!',
             message: Array.isArray(err.message) ? err.message[0] : err.message,
             buttons: ['OK']
           });
         });
      }
      else {
       this.requestService.createMarriageContractCertificateReques(params)
         .subscribe(async res => {
           if (res.success) {
             await this.presentAlert({
               header: 'Request sent!',
               buttons: ['OK']
             });
             this.isSubmitting = false;
             this.modal.canDismiss = true;
             this.modal.dismiss({success: true, data: res.data}, 'confirm');
             await this.pageLoaderService.close();
           } else {
             await this.pageLoaderService.close();
             this.isSubmitting = false;
             await this.presentAlert({
               header: 'Try again!',
               message: Array.isArray(res.message) ? res.message[0] : res.message,
               buttons: ['OK']
             });
           }
         }, async (err) => {
           await this.pageLoaderService.close();
           this.isSubmitting = false;
           await this.presentAlert({
             header: 'Try again!',
             message: Array.isArray(err.message) ? err.message[0] : err.message,
             buttons: ['OK']
           });
         });
      }
    } catch (e){
      await this.pageLoaderService.close();
      this.isSubmitting = false;
      await this.presentAlert({
        header: 'Try again!',
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

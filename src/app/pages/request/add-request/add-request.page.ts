import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { DomSanitizer } from '@angular/platform-browser';
import { IonModal, IonDatetime, ModalController, AlertController, ActionSheetController, Platform } from '@ionic/angular';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { Relationship, Request, RequestType } from 'src/app/core/model/request.model';
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
  relationshipOption: {relationshipId: string;name: string; message:any;}[] = [];
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
      this.relationshipOption = this.appconfig.config.lookup.relationship;
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
      date: this.requestDetailsForm.value.date ?
        moment(this.requestDetailsForm.value.date).format('YYYY-MM-DD') : null,
      clientId: this.currentUser.clientId,
      requestersFullName: this.requestDetailsForm.value?.requestersFullName ? this.requestDetailsForm.value?.requestersFullName : '',
      husbandFullName: this.requestDetailsForm.value?.husbandFullName ? this.requestDetailsForm.value?.husbandFullName : '',
      wifeFullName: this.requestDetailsForm.value?.wifeFullName ? this.requestDetailsForm.value?.wifeFullName : '',
      requestTypeId: this.selectRequestTypeForm.valid ? this.selectRequestTypeForm.value.requestTypeId : null,
      relationshipId: this.selectRequestTypeForm.valid ? this.selectRequestTypeForm.value.relationshipId : null,
      remarks: this.remarksForm.value.remarks,
      requestWarningMessage: this.selectRequestTypeForm.controls['relationshipId']?.value ?
      this.relationshipOption.filter(x=> x.relationshipId === this.selectRequestTypeForm.controls['relationshipId']?.value)[0]?.message :
      null
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
      dateBaptized: this.formData.dateBaptized ? this.formData.dateBaptized : '',
      dateOfConfirmation: this.formData.dateOfConfirmation ? this.formData.dateOfConfirmation : '',
      dateMarried: this.formData?.dateMarried ? this.formData.dateMarried : '',
      date: this.formData.date ? this.formData.date : '',
      requestersFullName: this.formData?.requestersFullName ? this.formData?.requestersFullName : '',
      husbandFullName: this.formData?.husbandFullName ? this.formData?.husbandFullName : '',
      wifeFullName: this.formData?.wifeFullName ? this.formData?.wifeFullName : '',
      remarks: this.formData.remarks
    };
  }

  ngOnInit() {
    this.selectRequestTypeForm = this.formBuilder.group({
      requestTypeId: ['', [Validators.required]],
      relationshipId: ['', [Validators.required]],
    });
    this.requestDetailsForm = this.formBuilder.group({
      dateBaptized: [this.minDate],
      dateOfConfirmation: [this.minDate],
      dateMarried: [this.minDate],
      date: [this.minDate],
      husbandFullName: [null],
      wifeFullName: [null],
      requestersFullName: [null],
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

  resetValidation(requestTypeId = 0) {
    this.requestDetailsForm.get('dateBaptized').setValidators([]);
    this.requestDetailsForm.get('dateOfConfirmation').setValidators([]);
    this.requestDetailsForm.get('dateMarried').setValidators([]);
    this.requestDetailsForm.get('date').setValidators([]);
    this.requestDetailsForm.get('husbandFullName').setValidators([]);
    this.requestDetailsForm.get('wifeFullName').setValidators([]);
    this.requestDetailsForm.get('requestersFullName').setValidators([]);
    
    if(Number(requestTypeId) === 1) {
      this.relationshipOption = this.appconfig.config.lookup.relationship;
      this.requestDetailsForm.get('dateBaptized').setValidators([Validators.required]);
      this.requestDetailsForm.get('requestersFullName').setValidators([Validators.required]);
    }
    else if(Number(requestTypeId) === 2) {
      this.relationshipOption = this.appconfig.config.lookup.relationship;
      this.remarksForm = new FormGroup({
        remarks: new FormControl(null),
      });
      this.requestDetailsForm.get('dateMarried').setValidators([Validators.required]);
      this.requestDetailsForm.get('husbandFullName').setValidators([Validators.required]);
      this.requestDetailsForm.get('wifeFullName').setValidators([Validators.required]);
    }
    else if(Number(requestTypeId) === 3) {
      this.relationshipOption = this.appconfig.config.lookup.relationship;
      this.requestDetailsForm.get('dateOfConfirmation').setValidators([Validators.required]);
      this.requestDetailsForm.get('requestersFullName').setValidators([Validators.required]);
    } 
    else {
      this.relationshipOption = this.appconfig.config.lookup.relationship.filter(x=> Number(x.relationshipId) !== 1);
      this.selectRequestTypeForm.get('relationshipId')?.reset(null);
      this.requestDetailsForm.get('date').setValidators([Validators.required]);
      this.requestDetailsForm.get('requestersFullName').setValidators([Validators.required]);
    }
  }

  addEventSelectRequestTypeForm() {
    this.selectRequestTypeForm.get('requestTypeId').valueChanges.subscribe(async (selectedValue: number)=> {
      this.resetValidation(selectedValue);
    });
  }

  ionViewWillLeave() {
    this.subscription.unsubscribe();
  }

  onSelectFocus(control: any, value: any) {
    setTimeout(()=>{
      control.setValue(value);
    }, 1000);
  }

  cancel() {
    if(this.requestStepper.selectedIndex !== 0) {
      // if(this.requestStepper.selectedIndex === 1) {
      //   this.selectRequestTypeForm = this.formBuilder.group({
      //     requestTypeId: [this.formData.requestTypeId, [Validators.required]],
      //     relationshipId: [this.formData.relationshipId, [Validators.required]],
      //   });
      //   this.requestDetailsForm = this.formBuilder.group({
      //     dateBaptized: [this.minDate],
      //     dateOfConfirmation: [this.minDate],
      //     dateMarried: [this.minDate],
      //     date: [this.minDate],
      //     requestersFullName: [null],
      //     husbandFullName: [null],
      //     wifeFullName: [null],
      //   });
      //   this.remarksForm = this.formBuilder.group({
      //     remarks: [],
      //   });
      // }
      this.requestStepper.selectedIndex  = this.requestStepper.selectedIndex - 1;
      
      this.resetValidation(this.formData.requestTypeId);
      this.addEventSelectRequestTypeForm();
    }
    else {
      this.modal.canDismiss = true;
      this.modalCtrl.dismiss(null, 'cancel');
    }
  }

  async save(){
    const params = this.formData;
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
       this.requestService.createMarriageContractCertificateRequest(params)
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
      else if(params.requestTypeId === '3'){
       this.requestService.createConfirmationCertificateRequest(params)
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
        this.requestService.createCertificateRequest(params)
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

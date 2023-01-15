import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { DomSanitizer } from '@angular/platform-browser';
import { IonModal, IonDatetime, ModalController, AlertController, ActionSheetController, Platform } from '@ionic/angular';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { LoginResult } from 'src/app/core/model/loginresult.model';
import { Reservation, ReservationType } from 'src/app/core/model/reservation.model';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { ReservationService } from 'src/app/core/services/reservation.service';
import { PageLoaderService } from 'src/app/core/ui-service/page-loader.service';



@Component({
  selector: 'app-add-schedule',
  templateUrl: './add-schedule.page.html',
  styleUrls: ['./add-schedule.page.scss'],
})
export class AddSchedulePage implements OnInit {
  @ViewChild('reservationStepper') reservationStepper: MatStepper;
  @ViewChild(IonModal) timeSlotModal: IonModal;
  @ViewChild('selectTimeSlotDateCtrl', { static: true }) selectTimeSlotDateCtrl: ElementRef<IonDatetime>;
  durationInHours = 1;
  isNew = false;
  modal: HTMLIonModalElement;
  currentUser: LoginResult;
  name: string;
  details: Reservation = {} as any;
  selectReservationTypeForm: FormGroup;
  selectTimeSlotForm: FormGroup;
  remarksForm: FormGroup;
  isSubmitting = false;
  isLoading = false;
  reservationTypeOption: ReservationType[] = [];
  error: any;
  subscription: Subscription;
  allowToClose = false;
  availableTimeSlot = [];

  currentDate = new Date();
  minDate: string = new Date(new Date().setDate(this.currentDate.getDate() + 1)).toISOString();
  constructor(private modalCtrl: ModalController,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private reservationService: ReservationService,
    private actionSheetController: ActionSheetController,
    private pageLoaderService: PageLoaderService,
    private appconfig: AppConfigService,
    private platform: Platform,
    public sanitizer: DomSanitizer) {
      this.reservationTypeOption = this.appconfig.config.lookup.reservationType;
      this.platform.backButton.subscribeWithPriority(-1, () => {
        this.cancel();
      });
  }

  get formData(){
    return {
      reservationDate: this.selectTimeSlotForm.value.selectTimeSlotDate ?
        moment(this.selectTimeSlotForm.value.selectTimeSlotDate).format('YYYY-MM-DD') : null,
      time: moment(
          moment(this.selectTimeSlotForm.value.selectTimeSlotDate).format('YYYY-MM-DD') +
        ' ' +
        this.selectTimeSlotForm.value.selectTime).format('HH:mm'),
      clientId: this.currentUser.clientId,
      reservationTypeId: this.selectReservationTypeForm.valid ? this.selectReservationTypeForm.value.reservationTypeId : null,
      remarks: this.remarksForm.value.remarks
    };
  }

  get errorControls() {
    return {
      ...this.selectReservationTypeForm.controls,
      ...this.selectTimeSlotForm.controls,
      ...this.remarksForm.controls,
    };
  }

  ngOnInit() {
    this.selectReservationTypeForm = this.formBuilder.group({
      reservationTypeId: [null, Validators.required],
    });
    this.selectTimeSlotForm = this.formBuilder.group({
      selectTimeSlotDate: [this.minDate, Validators.required],
      selectTime: [null, Validators.required],
    });
    this.remarksForm = this.formBuilder.group({
      remarks: [],
    });

    this.allowToClose = true;

    this.getReservationsForADay(moment(this.minDate).format('YYYY-MM-DD'), this.timeSlotOptions(this.durationInHours));

    this.selectTimeSlotForm.get('selectTimeSlotDate').valueChanges.subscribe(async selectedValue => {
      this.selectTimeSlotForm.controls.selectTime.setValue(null);
      const dayOfWeek = new Date(selectedValue).toLocaleDateString('en-US', { weekday: 'long' });
      const isDayAvailable = this.appconfig.config.reservationConfig.dayOfWeekNotAvailable
                              .filter(x=>x.toLowerCase().includes(dayOfWeek.toLowerCase())).length <= 0;
      if(isDayAvailable) {
        await this.getReservationsForADay(moment(this.formData.reservationDate)
        .format('YYYY-MM-DD'), this.timeSlotOptions(this.durationInHours));
      } else {
        this.availableTimeSlot = [];
      }
    });

    this.subscription = this.platform.backButton.subscribeWithPriority(9999, (e) => {
      if(this.modal.canDismiss){
        this.cancel();
      }
      this.pageLoaderService.close();
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
    if(this.reservationStepper.selectedIndex !== 0) {
      this.reservationStepper.selectedIndex  = this.reservationStepper.selectedIndex - 1;
    }else {
      this.modal.canDismiss = true;
      this.modalCtrl.dismiss(null, 'cancel');
    }
  }

  async save(){
    const params = this.formData;
    try{
      await this.pageLoaderService.open('Booking reservation...');
      this.isSubmitting = true;
      this.reservationService.createReservation(params)
        .subscribe(async res => {
          if (res.success) {
            await this.pageLoaderService.close();
            await this.presentAlert({
              header: 'Booked!',
              buttons: ['OK']
            });
            this.isSubmitting = false;
            this.modal.canDismiss = true;
            this.modal.dismiss({success: true, data: res.data}, 'confirm');
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

  toMinutes = str => str.split(':').reduce((h, m) => h * 60 + +m);

  toString = min => (Math.floor(min / 60) + ':' + (min % 60))
                         .replace(/\b\d\b/, '0$&');

  // eslint-disable-next-line @typescript-eslint/member-ordering
  timeSlotOptions(hours = 1) {
    const notAvailableHours = this.appconfig.config.reservationConfig.timeSlotNotAvailableHours;
    const start = this.toMinutes(this.appconfig.config.reservationConfig.timeSlotHours.start);
    const end = this.toMinutes(this.appconfig.config.reservationConfig.timeSlotHours.end);
    const slotOptions = Array.from({length: Math.floor((end - start) / (60 * Number(hours))) + 1}, (_, i) =>
    this.toString(start + i * (60 * Number(hours))));
    return slotOptions.filter(x=> !notAvailableHours.includes(x));
  }

  tConvert(time) {
    if(time.toLowerCase().includes('invalid date')) {return;};
    time = time.split(':')[1].charAt(1) ? time : time + '0';
    // Check correct time format and split into components
    time = time.toString().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

    if (time.length > 1) { // If time format correct
      time = time.slice (1);  // Remove full string match value
      time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
      time[0] = +time[0] % 12 || 12; // Adjust hours
    }
    return time.join(''); // return adjusted time or original string
  }

  async getReservationsForADay(dateString: string, timeSlotOptions: string[]) {
    try{
      this.isLoading = true;
      await this.reservationService.getReservationsForADay(dateString)
      .subscribe(async res => {
        if(res.success){
          const hSlotTaken = res.data.map((r) => {
            const reservationTimeStart = moment(
              `${r.reservationDate} ${r.time}`
            ).format('HH');
            const reservationDate = new Date(moment(
              `${r.reservationDate} ${r.time}`
            ).format('YYYY-MM-DD HH:mm'));
            reservationDate.setHours(reservationDate.getHours() + this.durationInHours);
            const reservationTimeEnd = moment(reservationDate).format('HH');
            return {
              reservationTimeStart,
              reservationTimeEnd,
            };
          });

          this.availableTimeSlot = timeSlotOptions.map((t)=> {
            const h = t.split(':')[0];
            if(hSlotTaken
            .filter(x=> Number(h) >= Number(x.reservationTimeStart) && Number(h) < Number(x.reservationTimeEnd)).length <= 0) {
              return t;
            }
          }).filter(x=>x !== null && x !== undefined && x !== '');

          this.isLoading = false;
        }
        else{
          await this.presentAlert({
            header: 'Try again!',
            subHeader: '',
            message: Array.isArray(res.message) ? res.message[0] : res.message,
            buttons: ['OK']
          });
          this.isLoading = false;
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
      console.log(e);
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

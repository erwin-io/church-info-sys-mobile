import { Client } from './client.model';

export class Reservation {
  reservationId: string;
  reservationDate: Date;
  time: string;
  remarks: string;
  isCancelledByAdmin: boolean;
  adminRemarks: string;
  client: Client;
  reservationType: ReservationType;
  reservationStatus: ReservationStatus;
}

export class ReservationStatus {
  reservationStatusId: string;
  name: string;
}

export class ReservationType {
  reservationTypeId: string;
  name: string;
}

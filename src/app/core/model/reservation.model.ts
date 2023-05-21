import { Client } from './client.model';

export class Reservation {
  reservationId: string;
  reservationDate: Date;
  time: string;
  fullName: string;
  weddingWifeName: string;
  weddingHusbandName: string;
  remarks: string;
  isCancelledByAdmin: boolean;
  adminRemarks: string;
  client: Client;
  reservationType: ReservationType;
  massIntentionTypeId: string;
  reservationStatus: ReservationStatus;
  massCategory: MassCategory;
  massIntentionType: MassIntentionType;
  priest: Priest;
}

export class ReservationStatus {
  reservationStatusId: string;
  name: string;
}

export class ReservationType {
  reservationTypeId: string;
  name: string;
}

export class MassCategory {
  massCategoryId: string;
  name: string;
}


export class MassIntentionType {
  massIntentionTypeId: string;
  name: string;
}

export class Priest {
  priestId: string;
  priestName: string;
}
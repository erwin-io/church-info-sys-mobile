import { Client } from './client.model';

export class Request {
  requestId: string;
  requestDate: Date;
  remarks: string;
  isCancelledByAdmin: boolean;
  adminRemarks: string;
  client: Client;
  requestType: RequestType;
  requestStatus: RequestStatus;
  requestersFullName: string;
  husbandFullName: string;
  wifeFullName: string;
  referenceDate: Date;
}

export class RequestStatus {
  requestStatusId: string;
  name: string;
}

export class RequestType {
  requestTypeId: string;
  name: string;
}

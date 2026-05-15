export type PaymentReturnOrderStatus =
  | "pending_payment"
  | "paid"
  | "delivering"
  | "delivered"
  | "failed"
  | string;

export interface PaymentReturnOrderSnapshot {
  product: string;
  recipient: string;
  chargedAmount: number;
  status: PaymentReturnOrderStatus;
  /** From service order metadata (checkout); used for utilities / ECG support. */
  meterNumber?: string;
  linkedMobile?: string;
}

export interface PaymentStatusPayload {
  hubtelStatus: string;
  ok: boolean;
  statusApiUnavailable?: boolean;
  orderStatus?: string;
}

export interface OrderStatusPayload {
  status: string;
  errorMessage?: string;
  product?: string;
  recipient?: string;
  chargedAmount?: number;
  meterNumber?: string;
  linkedMobile?: string;
  ok: boolean;
}

export interface ResolveCheckoutPayload {
  orderUuid: string | null;
  message?: string;
  ok: boolean;
}

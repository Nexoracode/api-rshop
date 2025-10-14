export enum PaymentStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
}

export enum PaymentLogStatus {
    INITIATED = 'initiated',
    VERIFIED = 'verified',
    FAILED = 'failed',
    CALLBACK_RECEIVED = 'callback_received',
    USER_CANCELLED = 'user_cancelled',
}

export enum PaymentGateway {
    ZARINPAL = 'zarinpal',
    IDPAY = 'idpay',
    MELAT = 'melat',
}
export abstract class SmsProvider {
    abstract send(recipients: string[], message: string): Promise<void>;
}
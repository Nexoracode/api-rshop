/**
 * Event که وقتی یک setting تغییر می‌کنه، emit میشه
 */
export class SettingUpdatedEvent {
    constructor(
        public readonly settingKey: string,
        public readonly oldValue: string,
        public readonly newValue: string,
    ) { }
}

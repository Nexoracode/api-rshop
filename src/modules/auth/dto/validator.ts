import {
    IsNotEmpty,
    Validate,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsEmailOrMobile', async: false })
export class IsEmailOrMobileConstraint implements ValidatorConstraintInterface {
    validate(value: string, args: ValidationArguments) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const iranPhoneRegex = /^09\d{9}$/;

        return emailRegex.test(value) || iranPhoneRegex.test(value);
    }

    defaultMessage(args: ValidationArguments) {
        const value = args.value;
        if (value.includes('@')) {
            return 'Invalid email format';
        } else {
            return 'Invalid phone number format';
        }
    }
}

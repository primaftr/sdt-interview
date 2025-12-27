import { registerDecorator } from 'class-validator';

export function IsValidTimezone() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTimezone',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: string) {
          try {
            Intl.DateTimeFormat(undefined, { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return 'Invalid IANA timezone';
        },
      },
    });
  };
}

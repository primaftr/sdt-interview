import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPastDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return new Date(value) < new Date();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a past date`;
        },
      },
    });
  };
}

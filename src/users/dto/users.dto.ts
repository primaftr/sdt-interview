import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsISO8601, IsEmail } from 'class-validator';
import { IsPastDate } from 'src/common/validator/isPastDate.validator';
import { IsValidTimezone } from 'src/common/validator/isValidTimezone.validator';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '1995-05-10' })
  @IsISO8601()
  @IsPastDate()
  birthday: string;

  @ApiProperty({ example: 'Australia/Melbourne' })
  @IsValidTimezone()
  timezone: string;

  @ApiProperty({ example: 'john.doe@email.com' })
  @IsEmail()
  email: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

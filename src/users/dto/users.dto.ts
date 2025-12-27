import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ example: '1995-05-10' })
  birthday: string;

  @ApiProperty({ example: 'Australia/Melbourne' })
  timezone: string;

  @ApiProperty()
  email: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

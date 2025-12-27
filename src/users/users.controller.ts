import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, Put, Delete, Param } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':email')
  update(@Param('email') email: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(email, dto);
  }

  @Delete(':email')
  remove(@Param('email') email: string) {
    return this.usersService.remove(email);
  }
}

import { Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { PrismaService } from 'src/prisma.service';
import { MessageService } from 'src/messages/messages.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private messageService: MessageService,
  ) {}

  async create(dto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        birthday: new Date(dto.birthday),
      },
    });

    await this.messageService.scheduleBirthday(user);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
    });

    await this.messageService.rescheduleBirthday(user);
    return user;
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
  }
}

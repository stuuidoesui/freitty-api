import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DEMO_USER_CODE = 'U1';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async me() {
    const user = await this.prisma.user.findUnique({
      where: { code: DEMO_USER_CODE },
      include: { account: true },
    });
    if (!user) {
      throw new NotFoundException('Demo user U1 is not seeded');
    }
    return {
      code: user.code,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
      account: {
        company: user.account.company,
        balanceCents: user.account.balance,
      },
      notificationCount: await this.prisma.order.count({
        where: { OR: [{ hasAlert: true }, { awaitingAction: true }] },
      }),
    };
  }
}

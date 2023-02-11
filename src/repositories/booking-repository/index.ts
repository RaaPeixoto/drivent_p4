import { prisma } from '@/config';
import { Booking, Room } from '@prisma/client';

async function findBookingByUserId(userId: number): Promise<
  Booking& {
    Room: Room;
  }
> {
  return prisma.booking.findFirst({
    where: { userId },
    include: {
      Room: true,
    },
  });
}

const bookingRepository = {
  findBookingByUserId,
};

export default bookingRepository;

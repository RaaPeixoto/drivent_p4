import { prisma } from "@/config";
import { Booking, Room } from "@prisma/client";

async function findBookingByUserId(userId: number): Promise<
  Booking & {
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

async function findRoom(roomId: number) {
  return prisma.room.findFirst({
    where: { id: roomId },
  });
}
async function createBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    },
  });
}
async function findUserBookingById(userId: number, bookingId: number): Promise<Booking> {
  return prisma.booking.findFirst({
    where: { id: bookingId, userId: userId },
  });
}

async function updateBooking(bookingId: number, roomId: number) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { roomId: roomId },
  });
}
const bookingRepository = {
  findBookingByUserId,
  findRoom,
  createBooking,
  findUserBookingById,
  updateBooking,
};

export default bookingRepository;

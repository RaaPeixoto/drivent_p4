import { forbiddenError, notFoundError } from '@/errors';
import bookingRepository from '@/repositories/booking-repository';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketRepository from '@/repositories/ticket-repository';
import { exclude } from '@/utils/prisma-utils';
import { Booking, Room } from '@prisma/client';
async function getUserBooking(userId: number): Promise<getBookingResult> {
  const userBooking = await bookingRepository.findBookingByUserId(userId);
  if (!userBooking) throw notFoundError();
  return exclude(userBooking, 'userId', 'roomId', 'createdAt', 'updatedAt');
}
type getBookingResult = Omit<Booking & { Room: Room }, 'userId' | 'roomId' | 'createdAt' | 'updatedAt'>;

async function postBookingService(roomId: number, userId: number): Promise<Booking> { 
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollment) throw forbiddenError('not found enrollment');

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status === 'RESERVED' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw forbiddenError('not found or not valid ticket');
  }
  const room = await bookingRepository.findRoom(roomId);

  if (!room) {
    throw notFoundError();
  }

  if (room.capacity === 0) {
    throw forbiddenError('the room has no vacancy');
  }
  const booking = await bookingRepository.createBooking(userId, roomId);
  return booking;
}

async function updateBookingService(roomId: number, userId: number,bookingId:number) {
  const booking = await bookingRepository.findUserBookingById (userId,bookingId);
  if(!booking) throw forbiddenError('The user dont have booking or thie booking is not from this user');
  const room = await bookingRepository.findRoom(roomId);

  if (!room) {
    throw notFoundError();
  }

  if (room.capacity === 0) {
    throw forbiddenError('the room has no vacancy');
  }

  await bookingRepository.updateBooking(bookingId,roomId);
}
const bookingService = {
  getUserBooking,
  postBookingService,
  updateBookingService
};

export default bookingService;

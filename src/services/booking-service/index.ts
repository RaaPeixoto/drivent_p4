import { notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import { exclude } from "@/utils/prisma-utils";
import { Booking,Room} from '@prisma/client';
async function getUserBooking (userId:number):Promise<getBookingResult>{
    const userBooking = await bookingRepository.findBookingByUserId(userId);
    if (!userBooking) throw notFoundError ();
    return exclude(userBooking,"userId","roomId","createdAt","updatedAt")

}
type getBookingResult = Omit<Booking & {Room: Room;}, "userId" | "roomId" | "createdAt" | "updatedAt">


const bookingService = {
    getUserBooking
}

export default bookingService;
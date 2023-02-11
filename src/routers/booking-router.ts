import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { getBooking, postBooking, updateBooking } from "@/controllers/booking-controller";
import { createUpdateBookingSchema } from "@/schemas/booking-schemas";

const bookingRouter = Router();

bookingRouter
.all("/*", authenticateToken)
.get("/",getBooking)
.post("/",validateBody(createUpdateBookingSchema),postBooking)
.put("/:bookingId",validateBody(createUpdateBookingSchema),updateBooking)


export {bookingRouter}
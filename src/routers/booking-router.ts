import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";

const bookingRouter = Router();

bookingRouter
.all("/*", authenticateToken)
.get("/")



export {bookingRouter}
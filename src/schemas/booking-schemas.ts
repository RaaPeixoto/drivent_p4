import { postBookingtype } from '@/protocols';
import Joi from 'joi';

export const createUpdateBookingSchema = Joi.object<postBookingtype>({
  roomId: Joi.number().required(),
});

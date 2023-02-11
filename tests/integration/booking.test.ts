import app, { init } from '@/app';
import faker from '@faker-js/faker';
import httpStatus from 'http-status';
import supertest from 'supertest';
import { cleanDb, generateValidToken } from '../helpers';
import * as jwt from 'jsonwebtoken';
import {
  createBooking,
  createEnrollmentWithAddress,
  createHotel,
  createPayment,
  createRoomWithHotelId,
  createTicketTypeRemote,
  createTicketTypeWithHotel,
  createUser,
  createTicket,
  createTicketTypeWithOutHotel,
  createRoomWithOutCapacity,
} from '../factories';
import { TicketStatus } from '@prisma/client';
beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 when there is no booking for given user', async () => {
      const token = await generateValidToken();

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 200 and booking data for given user', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const response = await server.get(`/booking`).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          ...room,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });
  });

  describe('POST /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
      const response = await server.post('/booking');

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if given token is not valid', async () => {
      const token = faker.lorem.word();

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('when token is valid', () => {
      it('should respond with status 400 when roomId is missing', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
  
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({});
  
        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
      it('should respond with status 403 when user dont have enrollment', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
    
  
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId:1});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it('should respond with status 403 when user dont have ticket', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
  
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId:1});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it('should respond with status 403 when ticket is remote', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeRemote();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId:1});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });
      it('should respond with status 403 when ticket dont include hotel', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithOutHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId:1});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it('should respond with status 403 when ticket is not paid', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        const payment = await createPayment(ticket.id, ticketType.price);
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId:1});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it('should respond with status 404 when room dont exist', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId:0});
  
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });

      it('should respond with status 403 when room has no vacancy', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithOutCapacity(hotel.id);
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId:room.id});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });
  
      it('should respond with status 200 and booking data for given user', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const response = await server.post(`/booking`).set('Authorization', `Bearer ${token}`).send ({roomId:room.id});
        expect(response.status).toBe(httpStatus.OK);

      });
    });
  });


  describe('PUT /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
      const response = await server.put('/booking/0');

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if given token is not valid', async () => {
      const token = faker.lorem.word();

      const response = await server.put('/booking/0').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await server.put('/booking/0').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('when token is valid', () => {
    
      it('should respond with status 400 when roomId is missing', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
  
        const response = await server.put('/booking/0').set('Authorization', `Bearer ${token}`).send({});
  
        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
      it('should respond with status 403 when booking dont exist', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
  
        const response = await server.put('/booking/0').set('Authorization', `Bearer ${token}`).send({roomId:0});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });


      it('should respond with status 404 when room dont exist', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await createBooking(user.id,room.id);
        const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({roomId:0});
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });

      it('should respond with status 403 when room has no vacancy', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await createBooking(user.id,room.id);
        const newRoom = await createRoomWithOutCapacity(hotel.id);
        const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({roomId:newRoom.id});
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });
  
      it('should respond with status 200  for given user', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await createBooking(user.id,room.id);
        const newRoom = await createRoomWithHotelId(hotel.id);
        const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send ({roomId:newRoom.id});
        expect(response.status).toBe(httpStatus.OK);

      });
    });
  });
});

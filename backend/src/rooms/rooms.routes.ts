import {Router} from 'express';
import {
  findAll,
  findOne,
  add,
  update,
  sanitizeRoomInput,
  validateRoomInput,
  validateRoomUpdateInput
} from './rooms.controller.js';

  export const roomRouter = Router();

  roomRouter.get('/', findAll);
  roomRouter.get('/:idRoom', findOne);
  roomRouter.post('/', sanitizeRoomInput, validateRoomInput, add);
  roomRouter.put('/:idRoom', sanitizeRoomInput, update);
  roomRouter.patch('/:idRoom', sanitizeRoomInput, update);

import { Router } from 'express';
import { sanitizeProvinciaInput, findAll, findOne, add, update, remove } from './provincias.controler.js';
export const provinciaRouter = Router();
provinciaRouter.get('/', findAll);
provinciaRouter.get('/:codProvincia', findOne);
provinciaRouter.post('/', sanitizeProvinciaInput, add);
provinciaRouter.put('/:codProvincia', sanitizeProvinciaInput, update);
provinciaRouter.patch('/:codProvincia', sanitizeProvinciaInput, update);
provinciaRouter.delete('/:codProvincia', remove);
//# sourceMappingURL=provincias.routes.js.map
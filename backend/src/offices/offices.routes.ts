import { Router } from 'express'
import {sanitizeOfficeInput, validateOfficeTimes, findAll, findOne, add, update} from './offices.controller.js'

export const officeRouter = Router()

officeRouter.get('/', findAll)
officeRouter.get('/:idOffice', findOne)
officeRouter.post('/', sanitizeOfficeInput, validateOfficeTimes , add)
officeRouter.put('/:idOffice', sanitizeOfficeInput, validateOfficeTimes , update)
officeRouter.patch('/:idOffice', sanitizeOfficeInput , update)

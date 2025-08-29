import { Router } from 'express'
import {findAll, findAllActive, findOne, add, update, toggleCityState, sanitizeCityInput} from './cities.controller.js'

export const cityRouter = Router()

cityRouter.get('/', findAll)
cityRouter.get('/active', findAllActive)
cityRouter.get('/:idCity', findOne)
cityRouter.post('/', sanitizeCityInput, add)
cityRouter.put('/:idCity', sanitizeCityInput, update)
cityRouter.patch('/:idCity', sanitizeCityInput, update)
cityRouter.patch('/:idCity/toggle-state', sanitizeCityInput, toggleCityState);


import { Router } from 'express'
import { 
    sanitizeProvinceInput,
    findAll, 
    findAllActive,
    findOne, 
    add, 
    update, 
    toggleProvinceState
} from './provinces.controller.js'

export const provinceRouter = Router()

provinceRouter.get('/', findAll)
provinceRouter.get('/active', findAllActive)
provinceRouter.get('/:idProvince', findOne)
provinceRouter.post('/',sanitizeProvinceInput, add)
provinceRouter.put('/:idProvince',sanitizeProvinceInput, update)
provinceRouter.patch('/:idProvince', sanitizeProvinceInput, update)
provinceRouter.patch('/:idProvince/toggle-state', sanitizeProvinceInput, toggleProvinceState)
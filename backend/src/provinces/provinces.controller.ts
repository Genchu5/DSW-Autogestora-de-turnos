import { Request, Response, NextFunction} from 'express'
import { ProvinceService } from './provinces.service.js'

function sanitizeProvinceInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    nameProvince: req.body.nameProvince,
    idProvince: req.body.idProvince,
    cities: req.body.cities,
    active: req.body.active !== undefined ? req.body.active : true, // Default state to true if not provided
  }

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key]
    }
  })
  next()
}

const provinceService = new ProvinceService()

async function findAll(req: Request, res: Response) {
  try {

    const provinces = await provinceService.findAllProvinces()
    res.status(200).json({message: 'finded all Provinces', data:provinces })
  
  }catch(error: any){
    res.status(500).json({ message: error.message })
  }
}

export async function findAllActive(req: Request, res: Response) {
  try {

    let provinces = await provinceService.findAllProvinces()
    provinces = provinces.filter(province => province.active) 
    res.status(200).json({message: 'finded all active Provinces', data:provinces })
  
  }catch(error: any){
    res.status(500).json({ message: error.message })
  }
}

async function findOne(req: Request, res: Response) {
  try {

    const id = Number.parseInt(req.params.idProvince)
    const province = await provinceService.findProvinceById(id)
    res.status(200).json({ message: 'finded Province', data: province })
  
  }catch(error: any) {
    res.status(500).json({ message: error.message })
  }
}


async function add(req: Request, res: Response) {
  try {

    const province = await provinceService.createProvince(req.body.sanitizedInput)
    res.status(201).json({ message: 'Province created', data: province })
  
  }catch(error: any) {
    res.status(500).json({ message: req.body.sanitizedInput.name + error.message })
  }
}

async function update(req: Request, res: Response) {
  try {
    
    const id = Number.parseInt(req.params.idProvince)
    delete req.body.sanitizedInput.active
    const province = await provinceService.updateProvince(id, req.body.sanitizedInput)
    res.status(200).json({ message: 'Province updated', data: province })

  }catch(error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function toggleProvinceState(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.idProvince)
    const province = await provinceService.toggleProvinceState(id)
    res.status(200).json({ message: 'Province state toggled', data: province })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export {sanitizeProvinceInput, findAll, findOne, add, update, toggleProvinceState}
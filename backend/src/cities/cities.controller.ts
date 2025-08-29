import { Request, Response, NextFunction} from 'express'
import { CityService } from './cities.service.js'
import { ProvinceService } from '../provinces/provinces.service.js';
import { wrap } from '@mikro-orm/core';

const cityService = new CityService();
const provinceService = new ProvinceService();

export function sanitizeCityInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    nameCity: req.body.nameCity?.toString().trim(),
    idCity: req.body.idCity,
    province: req.body.province && req.body.province.toString().trim() !== '' 
      ? req.body.province 
      : undefined,
    offices: req.body.offices,
    active: req.body.active !== undefined ? req.body.active : true, // Default state to true if not provided
  }

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key]
    }
  })
  next()
}


async function validateCityAdd(sanitizedInput: any): Promise<string[]> {
  const errors: string[] = []

  if (sanitizedInput.nameCity === undefined || sanitizedInput.nameCity === "") {
    errors.push('El nombre de la ciudad es obligatorio');
    }
    else {
      if (typeof sanitizedInput.nameCity !== 'string') {
      errors.push('El nombre de la ciudad debe ser una cadena de texto');
    } 
    if (sanitizedInput.nameCity.length < 2) {
      errors.push('El nombre de la ciudad es obligatorio y debe tener al menos 2 caracteres');
    } 
    if (sanitizedInput.nameCity.length > 100) {
      errors.push('El nombre de la ciudad no puede tener más de 100 caracteres');
    } 
    if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(sanitizedInput.nameCity)) {
      errors.push('El nombre de la ciudad solo puede contener letras, espacios, guiones y apóstrofes');
    }

  if(sanitizedInput.province === undefined || sanitizedInput.province === ''){
    errors.push('La provincia es obligatoria')
  }else{
    try{
      const id = Number.parseInt(sanitizedInput.province)
      const province = await provinceService.findProvinceById(id)
      if(province && !province.active){
        errors.push('La provincia está deshabilitada')
      }
    }catch(error: any) {
      errors.push('Error al validar estado de la provincia seleccionada')
    }
  }

  if(errors.length == 0){
      try {
            const existingCity = await cityService.cityExistsWithNameAndProvince(sanitizedInput.nameCity, sanitizedInput.province);

            if (existingCity) {
              errors.push('Ya existe una ciudad con el mismo nombre en la misma provincia')
            }
          }catch(error: any) {
            errors.push('Error al validar ciudades con mismo nombre')
    }
  }
  }

  return errors
}

async function validateCityUpdate(sanitizedInput: any): Promise<string[]> {
  const errors: string[] = []

  if ((sanitizedInput.nameCity === undefined || sanitizedInput.nameCity === "")&&(sanitizedInput.province === undefined || sanitizedInput.province === '')){
    errors.push('Se necesita al menos un campo, nombre o provincia, para modificar');
    }
  else if(sanitizedInput.nameCity !== "") {
    if (typeof sanitizedInput.nameCity !== 'string') {
      errors.push('El nombre de la ciudad debe ser una cadena de texto');
    } 
    if (sanitizedInput.nameCity.length < 2) {
      errors.push('El nombre de la ciudad es obligatorio y debe tener al menos 2 caracteres');
    } 
    if (sanitizedInput.nameCity.length > 100) {
      errors.push('El nombre de la ciudad no puede tener más de 100 caracteres');
    } 
    if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(sanitizedInput.nameCity)) {
      errors.push('El nombre de la ciudad solo puede contener letras, espacios, guiones y apóstrofes');
    }
  }
  
  if(sanitizedInput.province !== ""){
    try{
      const id = Number.parseInt(sanitizedInput.province)
      const province = await provinceService.findProvinceById(id)
      if(province && !province.active){
        errors.push('La provincia está deshabilitada')
      }
    }catch(error: any) {
      errors.push('Error al validar estado de la provincia seleccionada')
    }
  }
  

  if(errors.length == 0){
      try {
            const existingCity = await cityService.cityExistsWithNameAndProvince(sanitizedInput.nameCity, sanitizedInput.province, sanitizedInput.idCity);

            if (existingCity) {
              errors.push('Ya existe una ciudad con el mismo nombre en la misma provincia')
            }
          }catch(error: any) {
            errors.push('Error al validar ciudades con mismo nombre')
    }
  }
  

  return errors
}

export async function findAll(req: Request, res: Response) {
  try {
    let cities = await cityService.findAllCities()
    cities = cities.filter(city => city.province.active) //Filter all cities by its province state
    res.status(200).json({ message: 'find all cities', data: cities })
  }catch (error : any) {
    res.status(500).json({ message: error.message })
  }
}

export async function findAllActive(req:Request, res:Response){
  try {
    let cities = await cityService.findAllCities()
    cities = cities.filter(city => city.province.active) 
    cities = cities.filter(city => city.active) //Filter all cities by its province state
    res.status(200).json({ message: 'find all active cities', data: cities })
  }catch (error : any) {
    res.status(500).json({ message: error.message })
  }
}

export async function findOne(req: Request, res: Response) {
  try{
    const id = Number.parseInt(req.params.idCity)
    const city = await cityService.findCityById(id)
    res
      .status(200)
      .json({ message: 'found one city', data: city })
  }catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export async function add(req: Request, res: Response) {
  try{

  const errors = await validateCityAdd(req.body.sanitizedInput)

  if(errors.length > 0){
    const errorMessage = errors.join(', ')
    return res.status(400).json({ 
      message: errorMessage
    });
  }
  const city = await cityService.createCity(req.body.sanitizedInput)
  res.status(201).json({ message: 'City created successfully', data: wrap(city).toObject() }) // City created successfully
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export async function update(req: Request, res: Response) {
  try{

    const errors = await validateCityUpdate(req.body.sanitizedInput)

    if(errors.length > 0){
      const errorMessage = errors.join(', ')
      return res.status(400).json({ 
      message: errorMessage
    });
    }

    const id = Number.parseInt(req.params.idCity)
    const updatedCity = await cityService.updateCity(id, req.body.sanitizedInput)
    res.status(200).json({ message: 'City updated successfully', data: wrap(updatedCity).toObject() })
  }catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export async function toggleCityState(req: Request, res: Response) {
  try {
    const idCity = Number(req.params.idCity);
    const city = await cityService.toggleCityState(idCity);
    res.status(200).json({ message: 'Estado de la ciudad y offices actualizado', data: city });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

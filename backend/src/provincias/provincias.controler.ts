import { Request, Response, NextFunction } from 'express'
import { ProvinciasRepository } from './provincias.repository.js'
import { Provincia } from './provincias.entity.js'

const repository = new ProvinciasRepository()

function sanitizeProvinciaInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    codProvincia: req.body.codProvincia
  }
  //more checks here

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key]
    }
  })
  next()
}

function findAll(req: Request, res: Response) {
  res.json({ data: repository.findAll() })
}

function findOne(req: Request, res: Response) {
  const codProvincia = req.params.codProvincia
  const provincia = repository.findOne({codProvincia})
  if (!provincia) {
    return res.status(404).send({ message: 'Provincia not found' })
  }
  res.json({ data: provincia })
}

function add(req: Request, res: Response) {
  const input = req.body.sanitizedInput
  const provinciaInput = new Provincia(
    input.codProvincia,
    input.name
  )

  const provincia = repository.add(provinciaInput)
  return res.status(201).send({ message: 'Provincia created', data: provincia })
}

function update(req: Request, res: Response) {
  req.body.sanitizedInput.codProvincia = req.params.codProvincia
  const provincia = repository.update(req.body.sanitizedInput)

  if (!provincia) {
    return res.status(404).send({ message: 'Provincia not found' })
  }

  return res.status(200).send({ message: 'Provincia updated successfully', data: provincia })
}

function remove(req: Request, res: Response) {
  const codProvincia = req.params.codProvincia
  const provincia = repository.delete({ codProvincia })

  if (!provincia) {
    res.status(404).send({ message: 'Provincia not found' })
  } else {
    res.status(200).send({ message: 'Provincia deleted successfully' })
  }
}

export { sanitizeProvinciaInput, findAll, findOne, add, update, remove }
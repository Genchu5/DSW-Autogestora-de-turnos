import { Repository } from '../shared/repository.js'
import { Provincia } from './provincias.entity.js'

const provincias = [
  new Provincia(
    '01',
    'Santa Fe',
  ),
]

export class ProvinciasRepository implements Repository<Provincia> {
  public findAll(): Provincia[] | undefined {
    return provincias
}

  public findOne(item: { codProvincia: string }): Provincia | undefined {
    return provincias.find((provincia) => provincia.codProvincia === item.codProvincia)
  }

  public add(item: Provincia): Provincia | undefined {
    provincias.push(item)
    return item
  }

  public update(item: Provincia): Provincia | undefined {
    const provinciaCodx = provincias.findIndex((provincia) => provincia.codProvincia === item.codProvincia)

    if (provinciaCodx !== -1) {
      provincias[provinciaCodx] = { ...provincias[provinciaCodx], ...item }
    }
    return provincias[provinciaCodx]
  }

  public delete(item: { codProvincia: string }): Provincia | undefined {
    const provinciaCodx = provincias.findIndex((provincia) => provincia.codProvincia === item.codProvincia)

    if (provinciaCodx !== -1) {
      const deletedProvincias = provincias[provinciaCodx]
      provincias.splice(provinciaCodx, 1)
      return deletedProvincias
    }
  }
}
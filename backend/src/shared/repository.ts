export interface Repository<T> {
  findAll(): T[] | undefined
  findOne(item: { codProvincia: string }): T | undefined
  add(item: T): T | undefined
  update(item: T): T | undefined
  delete(item: { codProvincia: string }): T | undefined
}
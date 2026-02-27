import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Profesor extends BaseModel {
    public static table = 'profesores'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare nombre: string

    @column()
    declare categoria: string
}

import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Participante extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nombreCompleto: string

  @column()
  declare categoria: string

  @column()
  declare numero_votos: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}


import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Participante from '#models/participante'
import hash from '@adonisjs/core/services/hash'

export default class User extends BaseModel {
  public static table = 'usuarios'

  @column({ isPrimary: true })
  declare id: number


  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column()
  declare nombre: string | null

  @column()
  declare email: string | null

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare sub: string | null

  @column()
  declare oidcIssuer: string | null

  @column()
  declare givenName: string | null

  @column()
  declare familyName: string | null

  @column()
  declare primaryAffiliation: string | null

  @column()
  declare upmCentre: string | null

  @column()
  declare curso: string | null

  @column()
  declare votoParticipanteId: number | null

  @column()
  declare mensaje: string | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Participante, {
    foreignKey: 'votoParticipanteId',
  })
  declare votoParticipante: BelongsTo<typeof Participante>

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password && user.password) {
      user.password = await hash.make(user.password)
    }
  }
}

import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Vote from '#models/vote'
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
  declare password: string

  @column()
  declare rol: string | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Vote)
  declare votes: HasMany<typeof Vote>

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }
}
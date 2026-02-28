import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'usuarios'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('password').notNullable()
      table.unique(['email'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('password')
      table.dropUnique(['email'])
    })
  }
}

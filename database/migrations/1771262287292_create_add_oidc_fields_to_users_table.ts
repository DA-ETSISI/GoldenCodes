import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'usuarios'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('sub').nullable().unique()
      table.string('oidc_issuer').nullable()
      table.string('given_name').nullable()
      table.string('family_name').nullable()
      table.string('primary_affiliation').nullable()
      table.string('upm_centre').nullable()
    })

    this.schema.raw('ALTER TABLE usuarios MODIFY password VARCHAR(255) NULL')
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('sub')
      table.dropColumn('oidc_issuer')
      table.dropColumn('given_name')
      table.dropColumn('family_name')
      table.dropColumn('primary_affiliation')
      table.dropColumn('upm_centre')
    })

    this.schema.raw('ALTER TABLE usuarios MODIFY password VARCHAR(255) NOT NULL')
  }
}
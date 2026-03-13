import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'usuarios'

    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('is_verified').defaultTo(false)
            table.string('email_verification_token').nullable()
        })
    }

    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('is_verified')
            table.dropColumn('email_verification_token')
        })
    }
}

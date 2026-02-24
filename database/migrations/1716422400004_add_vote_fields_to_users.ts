import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'usuarios'

    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('curso').nullable()
            table.string('rol').nullable() // estudiante, pdi, ptgas
            table.text('mensaje').nullable()
        })
    }

    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('curso')
            table.dropColumn('rol')
            table.dropColumn('mensaje')
        })
    }
}

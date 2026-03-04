import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'usuarios'

    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('curso').nullable()
            table.string('grado').nullable()
        })
    }

    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumns('curso', 'grado')
        })
    }
}

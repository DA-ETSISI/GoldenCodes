import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'profesores'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.integer('id').unsigned().references('id').inTable('participantes').onDelete('CASCADE')
            table.string('nombre').notNullable()
            table.string('categoria').notNullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}

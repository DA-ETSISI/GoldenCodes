import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'participantes'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
            table.string('nombre_completo').notNullable()
            table.string('categoria').notNullable()
            table.integer('numero_votos').defaultTo(0)

            table.timestamp('created_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'votes'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
            table.integer('user_id').unsigned().references('id').inTable('usuarios').onDelete('CASCADE')
            table.integer('participante_id').unsigned().references('id').inTable('participantes').onDelete('CASCADE')
            table.string('categoria').notNullable()
            table.text('mensaje').nullable()

            table.timestamp('created_at')
            table.timestamp('updated_at')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}

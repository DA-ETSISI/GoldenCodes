import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import hash from '@adonisjs/core/services/hash'

export default class MakeAdminPassword extends BaseCommand {
  static commandName = 'make:admin_password'
  static description = 'Hashes a string and provides the Base64 value to use in the .env file as ADMIN_PASSWORD'

  @args.string({ description: 'The password to hash' })
  declare password: string

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info(`Hashing password: ${this.password}`)

    // Create the hash using scrypt (Adonis default hasher)
    const hashed = await hash.make(this.password)
    
    // Base64 encode it so it's safe to place in the .env file
    const base64Hashed = Buffer.from(hashed).toString('base64')

    this.logger.success('✅ Password successfully hashed and Base64 encoded!')
    console.log('\n======================================================')
    console.log('Copy the following text exactly and paste it in your .env as your ADMIN_PASSWORD:')
    console.log(`\nADMIN_PASSWORD=${base64Hashed}\n`)
    console.log('======================================================\n')
  }
}

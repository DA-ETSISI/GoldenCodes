import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import hash from '@adonisjs/core/services/hash'

export default class VerifyHash extends BaseCommand {
  static commandName = 'verify:hash'
  static description = 'Verifies if a given password matches the ADMIN_PASSWORD in .env'

  @args.string({ description: 'The password to test' })
  declare password: string

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: env } = await import('#start/env')
    const adminHashB64 = env.get('ADMIN_PASSWORD')
    const adminHash = adminHashB64 ? Buffer.from(adminHashB64, 'base64').toString('utf8') : null

    if (!adminHash) {
      this.logger.error('No ADMIN_PASSWORD found in .env')
      return
    }

    this.logger.info(`Testing password: "${this.password}"`)
    this.logger.info(`Hash: ${adminHash}`)

    const isValid = await hash.verify(adminHash, this.password)
    if (isValid) {
      this.logger.success(`✅ Password MATCHES! This is the correct password.`)
    } else {
      this.logger.error(`❌ Password does NOT match.`)
    }
  }
}

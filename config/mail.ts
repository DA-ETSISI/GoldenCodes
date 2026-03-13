import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
    default: 'smtp',

    /**
     * The mailers object can be used to configure multiple mailers
     * each using a different transport or the same transport with different
     * options.
     */
    mailers: {
        smtp: transports.smtp({
            host: env.get('SMTP_HOST', ''),
            port: env.get('SMTP_PORT', 587),
            auth: {
                type: 'login',
                user: env.get('SMTP_USERNAME', ''),
                pass: env.get('SMTP_PASSWORD', ''),
            },
        }),
    },

    /**
     * The from object is used to set the default from address for
     * all the outgoing emails.
     */
    from: {
        address: env.get('FROM_EMAIL', 'noreply@example.com'),
        name: env.get('FROM_NAME', 'Códigos de Oro'),
    },

    /**
     * The replyTo object is used to set the default replyTo address for
     * all the outgoing emails.
     */
    replyTo: {
        address: env.get('REPLY_TO_EMAIL', 'noreply@example.com'),
        name: env.get('REPLY_TO_NAME', 'Códigos de Oro'),
    },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
    export interface MailersList extends InferMailers<typeof mailConfig> { }
}

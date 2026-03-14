import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export default class PasswordResetController {
    async showForgot({ view }: HttpContext) {
        return view.render('pages/forgot_password')
    }

    async sendResetLink({ request, response, session }: HttpContext) {
        const email = request.input('email')
        const user = await User.findBy('email', email)

        if (!user) {
            session.flash('error', 'No encontramos ningún usuario con ese correo.')
            return response.redirect().back()
        }

        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = DateTime.now().plus({ hours: 1 })

        // Save token
        await db.table('password_reset_tokens').insert({
            email,
            token,
            expires_at: expiresAt.toSQL(),
            created_at: DateTime.now().toSQL(),
        })

        // Send email
        mail
            .sendLater((message) => {
                message
                    .to(email)
                    .subject('Recuperar contraseña - Códigos de Oro')
                    .htmlView('emails/password_reset', {
                        user,
                        url: `${env.get('APP_URL')}/reset-password?token=${token}&email=${email}`,
                    })
            })
            .catch(() => {

            })

        session.flash(
            'success',
            'Te hemos enviado un correo con instrucciones para recuperar tu contraseña.'
        )
        return response.redirect().back()
    }

    async showReset({ request, view }: HttpContext) {
        const { token, email } = request.all()
        return view.render('pages/reset_password', { token, email })
    }

    async reset({ request, response, session }: HttpContext) {
        const { token, email, password, password_confirmation } = request.all()

        if (password !== password_confirmation) {
            session.flash('error', 'Las contraseñas no coinciden.')
            return response.redirect().back()
        }

        const tokenData = await db
            .from('password_reset_tokens')
            .where('email', email)
            .where('token', token)
            .where('expires_at', '>', DateTime.now().toSQL())
            .first()

        if (!tokenData) {
            session.flash('error', 'El enlace es inválido o ha expirado.')
            return response.redirect('/forgot-password')
        }

        const user = await User.findBy('email', email)
        if (!user) {
            session.flash('error', 'Usuario no encontrado.')
            return response.redirect('/forgot-password')
        }

        user.password = password
        await user.save()

        // Delete token
        await db.from('password_reset_tokens').where('email', email).delete()

        session.flash('success', 'Tu contraseña ha sido actualizada correctamente.')
        return response.redirect('/login')
    }
}

import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class VerifiedMiddleware {
    async handle({ auth, response, session }: HttpContext, next: NextFn) {
        const user = auth.user

        if (user && !user.isVerified) {
            session.flash('error', 'Debes verificar tu correo electrónico para acceder a esta sección.')
            return response.redirect('/votacion') // Redirect to voting page where they will see the notice
        }

        return next()
    }
}

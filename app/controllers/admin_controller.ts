import type { HttpContext } from '@adonisjs/core/http'
import Participante from '#models/participante'

export default class AdminController {
    async index({ view }: HttpContext) {
        // Fetch all to show zeros if wanted, but "who have been voted" implies > 0.
        // Let's bring all of them so the admin sees the full map, 
        // but sort by votes desc.
        const allParticipantes = await Participante.query().orderBy('numero_votos', 'desc')

        // Group by category
        const groupedResults: Record<string, Participante[]> = {}

        allParticipantes.forEach(p => {
            if (!groupedResults[p.categoria]) {
                groupedResults[p.categoria] = []
            }
            groupedResults[p.categoria].push(p)
        })

        return view.render('pages/admin', { groupedResults })
    }

    async showLogin({ view }: HttpContext) {
        return view.render('pages/admin_login')
    }

    async login({ request, response, session }: HttpContext) {
        const { username, password } = request.all()

        // Validation of hardcoded credentials
        if (username === 'admin' && password === 'admin') {
            session.put('isAdmin', true)
            return response.redirect('/admin')
        }

        session.flash('error', 'Credenciales incorrectas.')
        return response.redirect().back()
    }

    async logout({ response, session }: HttpContext) {
        session.forget('isAdmin')
        return response.redirect('/')
    }
}

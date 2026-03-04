import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import Participante from '#models/participante'

export default class AdminController {
  async index({ view, request }: HttpContext) {
    // 1. Fetch search results if email is provided
    const searchEmail = request.input('email')
    let searchedUser: any = null
    let userVotes: any[] = []

    if (searchEmail) {
      const User = (await import('#models/user')).default
      searchedUser = await User.query().where('email', searchEmail).first()
      if (searchedUser) {
        const Vote = (await import('#models/vote')).default
        userVotes = await Vote.query().where('userId', searchedUser.id).preload('participante')
      }
    }

    // 2. Fetch all participants for general results
    const allParticipantes = await Participante.query().orderBy('numero_votos', 'desc')

    // Group by category
    const groupedResults: Record<string, Participante[]> = {}

    allParticipantes.forEach((p) => {
      if (!groupedResults[p.categoria]) {
        groupedResults[p.categoria] = []
      }
      groupedResults[p.categoria].push(p)
    })

    return view.render('pages/admin', {
      groupedResults,
      searchedUser,
      userVotes,
      searchEmail,
    })
  }

  async showLogin({ view }: HttpContext) {
    return view.render('pages/admin_login')
  }

  async login({ request, response, session }: HttpContext) {
    const { username, password } = request.all()

    // Validation of credentials using environment variables
    const adminUser = env.get('ADMIN_USER')
    const adminPass = env.get('ADMIN_PASSWORD')

    if (username === adminUser && password === adminPass) {
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

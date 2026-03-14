import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import Participante from '#models/participante'
import hash from '@adonisjs/core/services/hash'
import { scryptSync, timingSafeEqual } from 'node:crypto'

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

  /**
   * Compare two strings in constant time to prevent timing attacks.
   */
  private secureCompare(a: string, b: string): boolean {
    const bufA = scryptSync(a, 'static-salt-for-timing', 32)
    const bufB = scryptSync(b, 'static-salt-for-timing', 32)
    return timingSafeEqual(bufA, bufB)
  }

  async login({ request, response, session }: HttpContext) {
    const { username, password } = request.all()

    const adminUser = env.get('ADMIN_USER')
    // The hash is stored Base64-encoded in .env to avoid $ signs being interpolated by the env parser
    const adminHashB64 = env.get('ADMIN_PASSWORD')
    const adminHash = adminHashB64 ? Buffer.from(adminHashB64, 'base64').toString('utf8') : null

    // Use secureCompare for username and hash.verify for password
    const isUserValid = this.secureCompare(username || '', adminUser || '')
    const isPasswordValid = adminHash ? await hash.verify(adminHash, password || '') : false

    if (isUserValid && isPasswordValid) {
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

  async resetUser({ params, response, session }: HttpContext) {
    const userId = params.id
    const User = (await import('#models/user')).default
    const user = await User.find(userId)

    if (!user) {
      session.flash('error', 'Usuario no encontrado.')
      return response.redirect().back()
    }

    const Vote = (await import('#models/vote')).default
    const userVotes = await Vote.query().where('userId', user.id)

    // Decrement vote counts from participants
    for (const vote of userVotes) {
      const Participante = (await import('#models/participante')).default
      const p = await Participante.find(vote.participanteId)
      if (p) {
        p.numero_votos = Math.max(0, p.numero_votos - 1)
        await p.save()
      }
      await vote.delete()
    }

    // Reset user profile
    user.rol = null
    user.curso = null
    user.grado = null
    await user.save()

    session.flash('success', `Se han eliminado los ${userVotes.length} votos y se ha reseteado el perfil de ${user.email}.`)
    return response.redirect().back()
  }
}

import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import Participante from '#models/participante'
import { createHash, timingSafeEqual } from 'node:crypto'

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
   * SHA-256 normalizes both strings to the same byte length first,
   * so timingSafeEqual never throws on different-length inputs.
   */
  private timingSafeStringEqual(a: string, b: string): boolean {
    const hashA = createHash('sha256').update(a).digest()
    const hashB = createHash('sha256').update(b).digest()
    return timingSafeEqual(hashA, hashB)
  }

  async login({ request, response, session, logger }: HttpContext) {
    const { username, password } = request.all()

    const adminUser = env.get('ADMIN_USER')
    const adminPassword = env.get('ADMIN_PASSWORD')

    // Both username and password are compared in constant time using sha256-normalized
    // timingSafeEqual — this prevents timing attacks without needing to store a hash.
    // The .env file itself must be kept secret (it already holds DB credentials, APP_KEY, etc.)
    const isUserValid = this.timingSafeStringEqual(username || '', adminUser || '')
    const isPasswordValid = this.timingSafeStringEqual(password || '', adminPassword || '')

    if (isUserValid && isPasswordValid) {
      logger.info({ msg: 'Admin login successful' })
      session.put('isAdmin', true)
      return response.redirect('/admin')
    }

    logger.warn({ msg: 'Admin login failed', username: username || '(empty)' })
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

// app/controllers/users_controller.ts
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import Participante from '#models/participante'

export default class UsersController {

  public async index({ view }: HttpContext) {
    const allUsers = await User.all()

    // 2. Pasar los datos a una plantilla de Edge
    return view.render('pages/usersShow', {
      usersList: allUsers
    })
  }

  public async myVote({ view, auth }: HttpContext) {
    const user = await auth.getUserOrFail()
    await user.load('votes', (query) => {
      query.preload('participante')
    })

    return view.render('pages/vote_detail', { user })
  }

  public async check({ view }: HttpContext) {
    return view.render('pages/check_vote')
  }

  public async find({ request, response, session }: HttpContext) {
    const email = request.input('email')
    const user = await User.findBy('email', email)

    if (!user) {
      session.flash('error', 'No se encontró un usuario con ese email.')
      return response.redirect().back()
    }

    return response.redirect(`/consultar-voto/${user.id}`)
  }

  public async show({ params, view }: HttpContext) {
    const user = await User.find(params.id)
    if (user) {
      await user.load('votes', (query) => {
        query.preload('participante')
      })
    }

    return view.render('pages/vote_detail', { user })
  }

  public async checkParticipant({ view }: HttpContext) {
    return view.render('pages/check_participant')
  }

  public async findParticipant({ request, response, session }: HttpContext) {
    const participantId = request.input('participantId')
    const participante = await Participante.find(participantId)

    if (!participante) {
      session.flash('error', 'No se encontró un participante con ese ID.')
      return response.redirect().back()
    }

    return response.redirect(`/consultar-participante/${participante.id}`)
  }

  public async showParticipant({ params, view }: HttpContext) {
    const participante = await Participante.find(params.id)

    return view.render('pages/participant_detail', { participante })
  }
}
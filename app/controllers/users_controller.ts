import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  public async myVote({ view, auth }: HttpContext) {
    const user = await auth.getUserOrFail()
    await user.load('votes', (query) => {
      query.preload('participante')
    })

    return view.render('pages/vote_detail', { user })
  }
}

import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
    async index({ view, auth }: HttpContext) {
        let hasVoted = false

        if (auth.user) {
            await auth.user.loadCount('votes')
            hasVoted = Number(auth.user.$extras.votes_count) > 0
        }

        return view.render('pages/home', { hasVoted })
    }
}

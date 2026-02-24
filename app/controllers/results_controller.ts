import type { HttpContext } from '@adonisjs/core/http'
import Participante from '#models/participante'
import { DateTime } from 'luxon'

export default class ResultsController {
    async index({ view }: HttpContext) {
        const votingConfig = (await import('#config/voting')).default
        const now = DateTime.now()

        if (now < votingConfig.resultsAvailableAt) {
            return view.render('pages/results_locked', {
                availableAt: votingConfig.resultsAvailableAt
            })
        }

        const participantes = await Participante.all()

        // Group by category and sort
        const groupedResults: Record<string, Participante[]> = {}

        participantes.forEach(p => {
            if (!groupedResults[p.categoria]) {
                groupedResults[p.categoria] = []
            }
            groupedResults[p.categoria].push(p)
        })

        // Sort and take top 3
        for (const category in groupedResults) {
            groupedResults[category].sort((a, b) => b.numero_votos - a.numero_votos)
            groupedResults[category] = groupedResults[category].slice(0, 3)
        }

        return view.render('pages/results', { groupedResults })
    }
}

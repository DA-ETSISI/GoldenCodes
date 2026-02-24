import env from '#start/env'
import { DateTime } from 'luxon'

const votingConfig = {
    resultsAvailableAt: DateTime.fromISO(env.get('RESULTS_AVAILABLE_AT')),
}

export default votingConfig

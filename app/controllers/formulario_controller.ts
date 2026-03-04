import type { HttpContext } from '@adonisjs/core/http'
import Participante from '#models/participante'
import Vote from '#models/vote'

export default class FormularioController {
  async show({ view, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    // Auto-assign Estudiante role if email matches and rol is empty
    if (!user.rol && user.email?.endsWith('@alumnos.upm.es')) {
      user.rol = 'Estudiante'
      await user.save()
    }

    // Fetch all participantes (which are the votable options).
    const profesores = await Participante.all()

    const userVotes = await Vote.query().where('userId', user.id).preload('participante')
    const userVotesJson = userVotes.map(v => v.serialize())

    // Group votes by category to count how many votes they have used
    const votesByCategory: Record<string, number> = {}
    userVotes.forEach((v) => {
      votesByCategory[v.categoria] = (votesByCategory[v.categoria] || 0) + 1
    })

    return view.render('pages/formulario', {
      profesores,
      user,
      userVotes,
      userVotesJson,
      votesByCategory,
    })
  }

  async store({ request, response, session, auth }: HttpContext) {
    const isJson = request.input('_format') === 'json' || request.ajax() || !!request.accepts(['json'])

    try {
      const user = auth.getUserOrFail()
      const payload = request.only(['rol', 'profesor', 'categoria', 'curso', 'grado'])

      // On the first vote, the user must set their rol, curso (and grado if applicable)
      if (!user.rol || !user.curso || (user.curso === '3/4' && !user.grado)) {
        if (!payload.rol) {
          const errorMsg = 'Debes seleccionar tu perfil (PDI o PTGAS).'
          if (isJson) return response.status(400).json({ success: false, message: errorMsg })
          session.flash('error', errorMsg)
          return response.redirect().back()
        }
        if (payload.rol === 'Estudiante') {
          if (!payload.curso) {
            const errorMsg = 'Debes seleccionar tu curso.'
            if (isJson) return response.status(400).json({ success: false, message: errorMsg })
            session.flash('error', errorMsg)
            return response.redirect().back()
          }
          if (payload.curso === '3/4' && !payload.grado) {
            const errorMsg = 'Debes seleccionar tu grado.'
            if (isJson) return response.status(400).json({ success: false, message: errorMsg })
            session.flash('error', errorMsg)
            return response.redirect().back()
          }
        }
        user.rol = payload.rol
        user.curso = payload.curso
        user.grado = payload.grado
        await user.save()
      }

      const { profesor: profesorId, categoria } = payload as { profesor: string; categoria: string }

      if (!profesorId || !categoria) {
        const errorMsg = 'Faltan datos obligatorios.'
        if (isJson) return response.status(400).json({ success: false, message: errorMsg })
        session.flash('error', errorMsg)
        return response.redirect().back()
      }

      const profesor = await Participante.find(profesorId)
      if (!profesor) {
        const errorMsg = 'Candidato no válido.'
        if (isJson) return response.status(400).json({ success: false, message: errorMsg })
        session.flash('error', errorMsg)
        return response.redirect().back()
      }

      // Validate categories and rules based on rol
      const limits: Record<string, { roles: string[]; max: number }> = {
        // Mérito Docente
        'Primer curso (Grados)': { roles: ['Estudiante'], max: 3 },
        'Segundo curso (Grados)': { roles: ['Estudiante'], max: 3 },
        'Tercer y cuarto curso (Software)': { roles: ['Estudiante'], max: 3 },
        'Tercer y cuarto curso (Computadores)': { roles: ['Estudiante'], max: 3 },
        'Tercer y cuarto curso (TSI)': { roles: ['Estudiante'], max: 3 },
        'Tercer y cuarto curso (Sistemas de Información)': { roles: ['Estudiante'], max: 3 },
        'Grado en CDIA': { roles: ['Estudiante'], max: 3 },
        'Másteres universitarios': { roles: ['Estudiante'], max: 3 },
        // Especiales
        'Innovación Educativa': { roles: ['Estudiante', 'PDI'], max: 1 },
        'PDI más valorado por PTGAS': { roles: ['PTGAS'], max: 5 },
        'PTGAS en activo más valorado': { roles: ['PDI', 'PTGAS'], max: 5 },
      }

      const rule = limits[categoria]
      if (!rule) {
        const errorMsg = 'Categoría no válida.'
        if (isJson) return response.status(400).json({ success: false, message: errorMsg })
        session.flash('error', errorMsg)
        return response.redirect().back()
      }

      if (!rule.roles.includes(user.rol as string)) {
        const errorMsg = `Tu perfil (${user.rol}) no tiene permitido votar en esta categoría.`
        if (isJson) return response.status(400).json({ success: false, message: errorMsg })
        session.flash('error', errorMsg)
        return response.redirect().back()
      }

      // Additional restrictions for Estudiantes based on Curso/Grado
      if (user.rol === 'Estudiante') {
        const allowedCategories: Record<string, string[]> = {
          '1': ['Primer curso (Grados)'],
          '2': ['Primer curso (Grados)', 'Segundo curso (Grados)'],
          '3/4': ['Primer curso (Grados)', 'Segundo curso (Grados)'], // Will add degree below
          'CDIA': ['Grado en CDIA'],
          'Master': ['Másteres universitarios'],
        }

        const degreeCategories: Record<string, string> = {
          'Software': 'Tercer y cuarto curso (Software)',
          'Computadores': 'Tercer y cuarto curso (Computadores)',
          'TSI': 'Tercer y cuarto curso (TSI)',
          'Sistemas': 'Tercer y cuarto curso (Sistemas de Información)',
        }

        let allowed = allowedCategories[user.curso as string] || []
        if (user.curso === '3/4' && user.grado && degreeCategories[user.grado]) {
          allowed.push(degreeCategories[user.grado])
        }

        // Special global categories like "Innovación Educativa" or PTGAS/PDI shouldn't be blocked here
        // if they are already allowed in the rule roles.
        const isAcademicCategory = [
          'Primer curso (Grados)',
          'Segundo curso (Grados)',
          'Tercer y cuarto curso (Software)',
          'Tercer y cuarto curso (Computadores)',
          'Tercer y cuarto curso (TSI)',
          'Tercer y cuarto curso (Sistemas de Información)',
          'Grado en CDIA',
          'Másteres universitarios',
        ].includes(categoria)

        if (isAcademicCategory && !allowed.includes(categoria)) {
          const errorMsg = `Como estudiante de ${user.curso}${user.grado ? ` (${user.grado})` : ''}, no puedes votar en la categoría: ${categoria}.`
          if (isJson) return response.status(400).json({ success: false, message: errorMsg })
          session.flash('error', errorMsg)
          return response.redirect().back()
        }
      }

      const meritoDocenteCats = [
        'Primer curso (Grados)',
        'Segundo curso (Grados)',
        'Tercer y cuarto curso (Software)',
        'Tercer y cuarto curso (Computadores)',
        'Tercer y cuarto curso (TSI)',
        'Tercer y cuarto curso (Sistemas de Información)',
        'Grado en CDIA',
        'Másteres universitarios',
      ]

      // Count existing votes for this category and across Mérito Docente
      const userVotes = await Vote.query().where('userId', user.id)
      const meritoDocenteVotes = userVotes.filter((v) => meritoDocenteCats.includes(v.categoria))

      if (meritoDocenteCats.includes(categoria)) {
        // 1. Check votes in THIS specific category (limit 3)
        const categoryVotes = meritoDocenteVotes.filter((v) => v.categoria === categoria)
        if (categoryVotes.length >= 3) {
          const errorMsg = `Ya has alcanzado el límite de 3 votos para la categoría: ${categoria}.`
          if (isJson) return response.status(400).json({ success: false, message: errorMsg })
          session.flash('error', errorMsg)
          return response.redirect().back()
        }

        const usedCategories = [...new Set(meritoDocenteVotes.map((v) => v.categoria))]

        if (user.curso === '3/4') {
          const usedAcademic = usedCategories.filter((c) =>
            ['Primer curso (Grados)', 'Segundo curso (Grados)'].includes(c)
          )
          if (
            usedAcademic.length > 0 &&
            !usedAcademic.includes(categoria) &&
            ['Primer curso (Grados)', 'Segundo curso (Grados)'].includes(categoria)
          ) {
            const errorMsg =
              'Como estudiante de 3º/4º, solo puedes elegir un curso de grado (1º o 2º) para votar, no ambos.'
            if (isJson) return response.status(400).json({ success: false, message: errorMsg })
            session.flash('error', errorMsg)
            return response.redirect().back()
          }
        }

        // Check how many courses have been used in total (limit 2 for 3/4 and 2nd year students)
        if (!usedCategories.includes(categoria) && usedCategories.length >= 2) {
          const errorMsg = 'Solo puedes participar en un máximo de 2 cursos diferentes en Mérito Docente.'
          if (isJson) return response.status(400).json({ success: false, message: errorMsg })
          session.flash('error', errorMsg)
          return response.redirect().back()
        }
      }

      // Standard category limit check (applies to all, including Mérito Docente)
      const categoryVotesCount = userVotes.filter((v) => v.categoria === categoria).length
      const maxVotes = rule.max || 3
      if (categoryVotesCount >= maxVotes) {
        const errorMsg = `Ya has alcanzado el límite de votos (${maxVotes}) para esta categoría.`
        if (isJson) return response.status(400).json({ success: false, message: errorMsg })
        session.flash('error', errorMsg)
        return response.redirect().back()
      }

      // Prevent duplicate votes for the same person in the SAME category
      const alreadyVotedForPerson = userVotes.find(
        (v: Vote) => v.categoria === categoria && v.participanteId === profesor.id
      )
      if (alreadyVotedForPerson) {
        const errorMsg = 'Ya has votado por esta persona en esta categoría o grupo.'
        if (isJson) return response.status(400).json({ success: false, message: errorMsg })
        session.flash('error', errorMsg)
        return response.redirect().back()
      }

      // Register the vote
      await Vote.create({
        userId: user.id,
        participanteId: profesor.id,
        categoria: categoria,
      })

      // Increment votes in participante table
      const participante = await Participante.find(profesor.id)
      if (participante) {
        participante.numero_votos += 1
        await participante.save()
      }

      const message = `Voto registrado con éxito en ${categoria}.`

      if (isJson) {
        const updatedVotes = await Vote.query().where('userId', user.id).preload('participante')
        return response.json({
          success: true,
          message,
          userVotes: updatedVotes,
        })
      }

      session.flash('success', message)
      return response.redirect().back() // We return back to let them keep voting
    } catch (error) {
      console.error(error)
      const message = 'Ha ocurrido un error inesperado al procesar el voto.'
      if (isJson) {
        return response.status(error.status || 500).json({ success: false, message })
      }
      session.flash('error', message)
      return response.redirect().back()
    }
  }
}

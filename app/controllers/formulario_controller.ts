import type { HttpContext } from '@adonisjs/core/http'
import Profesor from '#models/profesor'
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

    // Fetch all profesores (which are the votable options)
    // In our model, "Profesor" maps to the options, even if they are PTGAS.
    // The seeder must populate them correctly.
    const profesores = await Profesor.all()

    // Fetch user's existing votes
    const userVotes = await Vote.query().where('userId', user.id).preload('participante')

    // Group votes by category to count how many votes they have used
    const votesByCategory: Record<string, number> = {}
    userVotes.forEach(v => {
      votesByCategory[v.categoria] = (votesByCategory[v.categoria] || 0) + 1
    })

    return view.render('pages/formulario', {
      profesores,
      user,
      userVotes,
      votesByCategory
    })
  }

  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = request.all()

    // On the first vote, the user must set their rol
    if (!user.rol) {
      if (!payload.rol) {
        session.flash('error', 'Debes seleccionar tu perfil (PDI o PTGAS).')
        return response.redirect().back()
      }
      user.rol = payload.rol
      await user.save()
    }

    const { profesor: profesorId, categoria } = payload as { profesor: string, categoria: string }

    if (!profesorId || !categoria) {
      session.flash('error', 'Faltan datos obligatorios.')
      return response.redirect().back()
    }

    const profesor = await Profesor.find(profesorId)
    if (!profesor) {
      session.flash('error', 'Candidato no válido.')
      return response.redirect().back()
    }

    // Validate categories and rules based on rol
    const limits: Record<string, { roles: string[], max: number }> = {
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
      'Premio Honorífico (Jubilado)': { roles: ['Estudiante', 'PDI', 'PTGAS'], max: 1 },
    }

    const rule = limits[categoria]
    if (!rule) {
      session.flash('error', 'Categoría no válida.')
      return response.redirect().back()
    }

    if (!rule.roles.includes(user.rol as string)) {
      session.flash('error', `Tu perfil (${user.rol}) no tiene permitido votar en esta categoría.`)
      return response.redirect().back()
    }

    const meritoDocenteCats = [
      'Primer curso (Grados)',
      'Segundo curso (Grados)',
      'Tercer y cuarto curso (Software)',
      'Tercer y cuarto curso (Computadores)',
      'Tercer y cuarto curso (TSI)',
      'Tercer y cuarto curso (Sistemas de Información)',
      'Grado en CDIA',
      'Másteres universitarios'
    ]

    // Count existing votes for this category (or group if Mérito Docente)
    let currentCategoryVotes
    if (meritoDocenteCats.includes(categoria)) {
      currentCategoryVotes = await Vote.query()
        .where('userId', user.id)
        .whereIn('categoria', meritoDocenteCats)
    } else {
      currentCategoryVotes = await Vote.query()
        .where('userId', user.id)
        .where('categoria', categoria)
    }

    if (currentCategoryVotes.length >= rule.max) {
      if (meritoDocenteCats.includes(categoria)) {
        session.flash('error', `Ya has alcanzado el límite global de votos (${rule.max}) para Mérito Docente.`)
      } else {
        session.flash('error', `Ya has alcanzado el límite de votos (${rule.max}) para esta categoría.`)
      }
      return response.redirect().back()
    }

    // Prevent duplicate votes for the same person in the SAME category (or across Mérito Docente globally to avoid duplicates)
    const alreadyVotedForPerson = currentCategoryVotes.find((v: Vote) => v.participanteId === profesor.id)
    if (alreadyVotedForPerson) {
      session.flash('error', 'Ya has votado por esta persona en esta categoría o grupo.')
      return response.redirect().back()
    }

    // Register the vote
    await Vote.create({
      userId: user.id,
      participanteId: profesor.id,
      categoria: categoria
    })

    // Increment votes in participante table
    const participante = await Participante.find(profesor.id)
    if (participante) {
      participante.numero_votos += 1
      await participante.save()
    }

    session.flash('success', `Voto registrado con éxito en ${categoria}.`)
    return response.redirect().back() // We return back to let them keep voting
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import crypto from 'node:crypto'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'

export default class AuthController {
  async showRegister({ view }: HttpContext) {
    return view.render('pages/register')
  }

  async register({ request, response, auth, session }: HttpContext) {
    const { nombre, email, password } = request.all()

    const normalizedEmail = email.toLowerCase().trim()

    // Validar dominio del email
    const esEmailValido = normalizedEmail.endsWith('@upm.es') || normalizedEmail.endsWith('@alumnos.upm.es')
    if (!esEmailValido) {
      session.flash('error', 'Solo se permiten correos @upm.es o @alumnos.upm.es.')
      return response.redirect().back()
    }

    // Validar que el email no esté registrado
    const existingUser = await User.findBy('email', normalizedEmail)
    if (existingUser) {
      session.flash('error', 'Este correo electrónico ya está registrado.')
      return response.redirect().back()
    }

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Crear el usuario
    const user = await User.create({
      nombre,
      email: normalizedEmail,
      password,
      emailVerificationToken: verificationToken,
      isVerified: false,
    })

    session.flash(
      'success',
      '¡Registro casi completado! Por favor, revisa tu correo para verificar tu cuenta antes de votar.'
    )

    // Enviar correo de verificación (sin bloquear la respuesta)
    mail
      .sendLater((message) => {
        message
          .to(user.email!)
          .subject('Verifica tu correo - Códigos de Oro')
          .htmlView('emails/verify_email', {
            user,
            url: `${env.get('APP_URL')}/verify-email?token=${verificationToken}&email=${user.email}`,
          })
      })
      .catch(() => {

      })

    // Autenticar automáticamente (pero con acceso restringido por middleware)
    await auth.use('web').login(user)

    return response.redirect('/votacion')
  }

  async verifyEmail({ request, response, session }: HttpContext) {
    const { token, email } = request.all()

    if (!email || !token) {
      session.flash('error', 'Enlace de verificación incompleto.')
      return response.redirect('/login')
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Buscar el usuario por email y token
    const user = await User.query()
      .where('email', normalizedEmail)
      .where('emailVerificationToken', token)
      .first()

    if (!user) {
      // Verificar si ya está verificado (posible pre-click de escáner de correo)
      const alreadyVerified = await User.query()
        .where('email', normalizedEmail)
        .where('isVerified', true)
        .first()

      if (alreadyVerified) {
        session.flash('success', '¡Tu cuenta ya ha sido verificada! Ya puedes participar.')
        return response.redirect('/votacion')
      }

      session.flash('error', 'El enlace de verificación es inválido o ha expirado.')
      return response.redirect('/login')
    }

    user.isVerified = true
    user.emailVerificationToken = null
    await user.save()

    session.flash('success', '¡Cuenta verificada correctamente! Ya puedes participar en las votaciones.')
    return response.redirect('/votacion')
  }

  async showLogin({ view }: HttpContext) {
    const oidcModule = await import('#config/oidc')
    const oidcConfig = oidcModule.default
    return view.render('pages/login', { oidcEnabled: oidcConfig.enabled })
  }

  async login({ request, response, auth, session }: HttpContext) {
    const { email, password } = request.all()

    try {
      const normalizedEmail = email.toLowerCase().trim()
      const user = await User.findBy('email', normalizedEmail)

      if (!user) {
        session.flash('error', 'Credenciales incorrectas.')
        return response.redirect().back()
      }

      const isValidPassword = await hash.verify(user.password, password)

      if (!isValidPassword) {
        session.flash('error', 'Credenciales incorrectas.')
        return response.redirect().back()
      }

      await auth.use('web').login(user)

      return response.redirect('/votacion')
    } catch (error) {
      session.flash('error', 'Error al iniciar sesión.')
      return response.redirect().back()
    }
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }

  async oidcRedirect({ response, session }: HttpContext) {
    const client = await import('openid-client')
    const oidcModule = await import('#config/oidc')
    const oidcConfig = oidcModule.default

    if (!oidcConfig.enabled) {
      return response.redirect('/login')
    }

    // We know these are string because enabled is true
    const server = await client.discovery(
      new URL(oidcConfig.issuer!),
      oidcConfig.clientId!,
      oidcConfig.clientSecret!
    )

    const codeVerifier = client.randomPKCECodeVerifier()
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)

    session.put('oidc_code_verifier', codeVerifier)

    const url = client.buildAuthorizationUrl(server, {
      scope: oidcConfig.scopes,
      redirect_uri: oidcConfig.redirectUri!,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    return response.redirect(url.href)
  }

  async oidcCallback({ request, response, auth, session }: HttpContext) {
    const client = await import('openid-client')
    const oidcModule = await import('#config/oidc')
    const oidcConfig = oidcModule.default

    if (!oidcConfig.enabled) {
      return response.redirect('/login')
    }

    try {
      const server = await client.discovery(
        new URL(oidcConfig.issuer!),
        oidcConfig.clientId!,
        oidcConfig.clientSecret!
      )

      const codeVerifier = session.get('oidc_code_verifier')
      if (!codeVerifier) {
        session.flash('error', 'Sesión OIDC inválida o expirada.')
        return response.redirect('/login')
      }
      session.forget('oidc_code_verifier')

      const currentUrl = new URL(request.completeUrl(true))

      const tokenSet = await client.authorizationCodeGrant(server, currentUrl, {
        pkceCodeVerifier: codeVerifier,
      })

      const claims = tokenSet.claims()
      if (!claims) {
        throw new Error('No se pudieron obtener los claims del token ID')
      }
      const userInfo = await client.fetchUserInfo(server, tokenSet.access_token, claims.sub)

      // Se imprime con el formato nativo del servidor (Pino JSON logger)
      logger.info({ oidc_data: userInfo }, 'Login OIDC completado')

      // Find or create user
      const email = userInfo.email
      const name = userInfo.name || userInfo.preferred_username || 'OIDC User'

      if (!email) {
        session.flash('error', 'No se pudo obtener el email del proveedor de identidad.')
        return response.redirect('/login')
      }

      // check if user exists
      let user = await User.findBy('email', email)

      if (!user) {
        // Create new user with random password since they use OIDC
        user = await User.create({
          nombre: name as string,
          email: email as string,
          password: crypto.randomUUID(), // Secure random password
        })
      }

      await auth.use('web').login(user)

      session.flash('success', `¡Bienvenido ${user.nombre}!`)
      return response.redirect('/votacion')
    } catch (error) {
      // El logger del servidor imprimirá el error de Pino en caso de que esté fallando
      logger.error(error)

      session.flash('error', 'Error en la autenticación OIDC.')
      return response.redirect('/login')
    }
  }

  async showChangePassword({ view }: HttpContext) {
    return view.render('pages/change_password')
  }

  async changePassword({ request, response, auth, session }: HttpContext) {
    const { currentPassword, newPassword } = request.all()
    const user = auth.user!

    // Verify current password
    const isValid = await hash.verify(user.password, currentPassword)
    if (!isValid) {
      session.flash('error', 'La contraseña actual es incorrecta.')
      return response.redirect().back()
    }

    // Update password
    user.password = newPassword
    await user.save()

    session.flash('success', 'Tu contraseña ha sido actualizada correctamente.')
    return response.redirect('/votacion')
  }

  async showForgotPassword({ view }: HttpContext) {
    return view.render('pages/forgot_password')
  }

  async sendResetLink({ request, response, session }: HttpContext) {
    const email = request.input('email')
    if (!email) {
      session.flash('error', 'El correo electrónico es obligatorio.')
      return response.redirect().back()
    }
    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findBy('email', normalizedEmail)

    if (!user) {
      session.flash('error', 'No encontramos ningún usuario con ese correo electrónico.')
      return response.redirect().back()
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = DateTime.now().plus({ hours: 1 })

    // Save token
    await db.table('password_reset_tokens').insert({
      email: normalizedEmail,
      token,
      expires_at: expiresAt.toFormat('yyyy-MM-dd HH:mm:ss'),
      created_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    // Send email
    mail.sendLater((message) => {
      message
        .to(normalizedEmail)
        .subject('Recuperar contraseña - Códigos de Oro')
        .htmlView('emails/reset_password', {
          user: user,
          url: `${env.get('APP_URL')}/reset-password?token=${token}&email=${normalizedEmail}`,
        })
    }).catch(() => {})

    session.flash('success', 'Te hemos enviado un enlace de recuperación a tu correo.')
    return response.redirect().back()
  }

  async showResetPassword({ request, view }: HttpContext) {
    const { token, email } = request.all()
    return view.render('pages/reset_password', { token, email })
  }

  async updatePassword({ request, response, session }: HttpContext) {
    const { token, email, password } = request.all()

    if (!email) return response.redirect('/forgot-password')
    const normalizedEmail = email.toLowerCase().trim()

    const resetToken = await db
      .from('password_reset_tokens')
      .where('email', normalizedEmail)
      .where('token', token)
      .where('expires_at', '>', DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'))
      .first()

    if (!resetToken) {
      session.flash('error', 'El enlace es inválido o ha expirado.')
      return response.redirect('/forgot-password')
    }

    const user = await User.findBy('email', normalizedEmail)
    if (!user) {
      session.flash('error', 'Usuario no encontrado.')
      return response.redirect('/forgot-password')
    }

    // Update password
    user.password = password
    await user.save()

    // Delete token
    await db.from('password_reset_tokens').where('email', normalizedEmail).delete()

    session.flash('success', 'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.')
    return response.redirect('/login')
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import crypto from 'node:crypto'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export default class AuthController {
  async showRegister({ view }: HttpContext) {
    return view.render('pages/register')
  }

  async register({ request, response, auth, session }: HttpContext) {
    const { nombre, email, password } = request.all()

    // Validar dominio del email
    const esEmailValido = email.endsWith('@upm.es') || email.endsWith('@alumnos.upm.es')
    if (!esEmailValido) {
      session.flash('error', 'Solo se permiten correos @upm.es o @alumnos.upm.es.')
      return response.redirect().back()
    }

    // Validar que el email no esté registrado
    const existingUser = await User.findBy('email', email)
    if (existingUser) {
      session.flash('error', 'Este correo electrónico ya está registrado.')
      return response.redirect().back()
    }

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Crear el usuario
    const user = await User.create({
      nombre,
      email,
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
            url: `${env.get('APP_URL', 'http://localhost:3333')}/verify-email?token=${verificationToken}&email=${user.email}`,
          })
      })
      .catch((error: any) => {
        console.error('Error enviando email:', error)
      })

    // Autenticar automáticamente (pero con acceso restringido por middleware)
    await auth.use('web').login(user)

    return response.redirect('/votacion')
  }

  async verifyEmail({ request, response, session }: HttpContext) {
    const { token, email } = request.all()

    const user = await User.query()
      .where('email', email)
      .where('emailVerificationToken', token)
      .first()

    if (!user) {
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
      const user = await User.findBy('email', email)

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
      codeChallenge,
      codeChallengeMethod: 'S256',
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
      console.error('OIDC Error:', error)
      session.flash('error', 'Error en la autenticación OIDC.')
      return response.redirect('/login')
    }
  }
}

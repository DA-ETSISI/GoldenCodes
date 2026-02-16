import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
    async showRegister({ view }: HttpContext) {
        return view.render('pages/register')
    }

    async register({ request, response, auth, session }: HttpContext) {
        const { nombre, email, password } = request.all()

        // Validar que el email no esté registrado
        const existingUser = await User.findBy('email', email)
        if (existingUser) {
            session.flash('error', 'Este correo electrónico ya está registrado.')
            return response.redirect().back()
        }

        // Crear el usuario
        const user = await User.create({
            nombre,
            email,
            password,
        })

        // Autenticar automáticamente
        await auth.use('web').login(user)

        session.flash('success', '¡Registro exitoso! Bienvenido.')
        return response.redirect('/')
    }

    async showLogin({ view, response, session }: HttpContext) {
        const oidcConfig = (await import('#config/oidc')).default
        if (oidcConfig.enabled) {
            return this.oidcRedirect({ response, session } as any)
        }
        return view.render('pages/login')
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

            return response.redirect('/')
        } catch (error) {
            session.flash('error', 'Error al iniciar sesión.')
            return response.redirect().back()
        }
    }

    async logout({ auth, response }: HttpContext) {
        await auth.use('web').logout()

        const oidcConfig = (await import('#config/oidc')).default
        if (oidcConfig.enabled) {
            const logoutUrl = new URL(`${oidcConfig.issuer}/protocol/openid-connect/logout`)
            logoutUrl.searchParams.set('post_logout_redirect_uri', oidcConfig.redirectUri!.replace('/auth/oidc/callback', '/'))
            logoutUrl.searchParams.set('client_id', oidcConfig.clientId!)
            return response.redirect(logoutUrl.href)
        }

        return response.redirect('/')
    }

    async oidcRedirect({ response, session }: HttpContext) {
        const client = await import('openid-client')
        const oidcConfig = (await import('#config/oidc')).default

        if (!oidcConfig.enabled) {
            return response.redirect('/login')
        }

        // We know these are string because enabled is true
        const execute = oidcConfig.issuer!.startsWith('http://') ? [client.allowInsecureRequests] : []
        const server = await client.discovery(new URL(oidcConfig.issuer!), oidcConfig.clientId!, oidcConfig.clientSecret!, undefined, { execute })

        const code_verifier = client.randomPKCECodeVerifier()
        const code_challenge = await client.calculatePKCECodeChallenge(code_verifier)

        session.put('oidc_code_verifier', code_verifier)

        const url = client.buildAuthorizationUrl(server, {
            scope: oidcConfig.scopes,
            redirect_uri: oidcConfig.redirectUri!,
            code_challenge,
            code_challenge_method: 'S256',
        })

        return response.redirect(url.href)
    }

    async oidcCallback({ request, response, auth, session }: HttpContext) {
        const client = await import('openid-client')
        const oidcConfig = (await import('#config/oidc')).default

        if (!oidcConfig.enabled) {
            return response.redirect('/login')
        }

        try {
            const execute = oidcConfig.issuer!.startsWith('http://') ? [client.allowInsecureRequests] : []
            const server = await client.discovery(new URL(oidcConfig.issuer!), oidcConfig.clientId!, oidcConfig.clientSecret!, undefined, { execute })

            const code_verifier = session.get('oidc_code_verifier')
            if (!code_verifier) {
                session.flash('error', 'Sesión OIDC inválida o expirada.')
                return response.redirect('/login')
            }
            session.forget('oidc_code_verifier')

            const currentUrl = new URL(request.completeUrl(true))

            const tokenSet = await client.authorizationCodeGrant(server, currentUrl, {
                pkceCodeVerifier: code_verifier,
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
                    password: Math.random().toString(36).slice(-8), // Random password
                })
            }

            await auth.use('web').login(user)

            session.flash('success', `¡Bienvenido ${user.nombre}!`)
            return response.redirect('/')

        } catch (error) {
            console.error('OIDC Error:', error)
            session.flash('error', 'Error en la autenticación OIDC.')
            return response.redirect('/login')
        }
    }
}

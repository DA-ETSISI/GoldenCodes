/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
router.on('/').render('pages/home')
router.on('/gracias').render('pages/gracias')

router.get('/users', [() => import('#controllers/users_controller'), 'index'])

// Authentication routes
router
  .group(() => {
    router.get('/register', [() => import('#controllers/auth_controller'), 'showRegister'])
    router.post('/register', [() => import('#controllers/auth_controller'), 'register'])
    router.get('/login', [() => import('#controllers/auth_controller'), 'showLogin'])
    router.post('/login', [() => import('#controllers/auth_controller'), 'login'])
    router.get('/auth/oidc/redirect', [
      () => import('#controllers/auth_controller'),
      'oidcRedirect',
    ])
    router.get('/auth/oidc/callback', [
      () => import('#controllers/auth_controller'),
      'oidcCallback',
    ])
  })
  .use(middleware.guest())

router
  .post('/logout', [() => import('#controllers/auth_controller'), 'logout'])
  .use(middleware.auth())

// Protected voting routes
router
  .group(() => {
    router.get('/votacion', [() => import('#controllers/formulario_controller'), 'show'])
    router.post('/votacion', [() => import('#controllers/formulario_controller'), 'store'])
    router.get('/mi-voto', [() => import('#controllers/users_controller'), 'myVote'])
  })
  .use(middleware.auth())

// Admin protected routes
router
  .group(() => {
    router.get('/consultar-voto', [() => import('#controllers/users_controller'), 'check'])
    router.post('/consultar-voto', [() => import('#controllers/users_controller'), 'find'])
    router.get('/consultar-voto/:id', [() => import('#controllers/users_controller'), 'show'])

    router.get('/consultar-participante', [
      () => import('#controllers/users_controller'),
      'checkParticipant',
    ])
    router.post('/consultar-participante', [
      () => import('#controllers/users_controller'),
      'findParticipant',
    ])
    router.get('/consultar-participante/:id', [
      () => import('#controllers/users_controller'),
      'showParticipant',
    ])
  })
  .use(middleware.admin())

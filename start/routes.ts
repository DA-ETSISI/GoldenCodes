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
router.get('/', [() => import('#controllers/home_controller'), 'index'])
router.get('/innovacion-educativa', [() => import('#controllers/home_controller'), 'innovation'])

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
    router.get('/verify-email', [() => import('#controllers/auth_controller'), 'verifyEmail'])

    // Password recovery
    router.get('/forgot-password', [() => import('#controllers/auth_controller'), 'showForgotPassword'])
    router.post('/forgot-password', [() => import('#controllers/auth_controller'), 'sendResetLink'])
    router.get('/reset-password', [() => import('#controllers/auth_controller'), 'showResetPassword'])
    router.post('/reset-password', [() => import('#controllers/auth_controller'), 'updatePassword'])
  })
  .use(middleware.guest())

router
  .post('/logout', [() => import('#controllers/auth_controller'), 'logout'])
  .use(middleware.auth())

// Protected voting routes
router
  .group(() => {
    router.get('/votacion', [() => import('#controllers/formulario_controller'), 'show'])
    router.post('/votacion', [() => import('#controllers/formulario_controller'), 'store']).use(
      middleware.verified()
    )
    router.get('/mi-voto', [() => import('#controllers/users_controller'), 'myVote'])
    router.get('/change-password', [() => import('#controllers/auth_controller'), 'showChangePassword'])
    router.post('/change-password', [() => import('#controllers/auth_controller'), 'changePassword']).as('changePassword')
  })
  .use(middleware.auth())

// Admin specific login routes (unprotected by middleware.admin())
router.get('/admin/login', [() => import('#controllers/admin_controller'), 'showLogin'])
router.post('/admin/login', [() => import('#controllers/admin_controller'), 'login'])
router
  .post('/admin/logout', [() => import('#controllers/admin_controller'), 'logout'])
  .use(middleware.admin())

// Admin protected routes
router
  .group(() => {
    router.get('/admin', [() => import('#controllers/admin_controller'), 'index'])
    router.post('/admin/users/:id/reset', [() => import('#controllers/admin_controller'), 'resetUser'])
  })
  .use(middleware.admin())

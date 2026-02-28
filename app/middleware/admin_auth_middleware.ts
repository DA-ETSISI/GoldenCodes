import type { HttpContext } from '@adonisjs/core/http'

export default class AdminAuthMiddleware {
  async handle({ session, response }: HttpContext, next: () => Promise<void>) {
    // Check if the secure session 'isAdmin' flag exists
    const isAdmin = session.get('isAdmin')

    if (!isAdmin) {
      // Not logged in or session expired
      return response.redirect('/admin/login')
    }

    // Proceed to admin routes
    await next()
  }
}

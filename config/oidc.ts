import env from '#start/env'

const issuer = env.get('OIDC_ISSUER')
const clientId = env.get('OIDC_CLIENT_ID')
const clientSecret = env.get('OIDC_CLIENT_SECRET')
const redirectUri = env.get('OIDC_REDIRECT_URI')

const enabled = !!(issuer && clientId && clientSecret && redirectUri)

const oidcConfig = {
  enabled,
  issuer: issuer,
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: redirectUri,
  scopes: 'openid profile email', // Default scopes to request
}

export default oidcConfig

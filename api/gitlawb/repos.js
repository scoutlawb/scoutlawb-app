const GITLAWB_REPOS_API = 'https://node.gitlawb.com/api/v1/repos'

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'content-type, accept')
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET, OPTIONS')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const upstream = await fetch(GITLAWB_REPOS_API, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    const body = await upstream.text()

    response.status(upstream.status)
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    response.send(body)
  } catch (error) {
    response.status(502).json({
      error: error instanceof Error ? error.message : 'GitLawb proxy failed',
    })
  } finally {
    clearTimeout(timeout)
  }
}

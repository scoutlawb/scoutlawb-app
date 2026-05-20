const GITLAWB_REPOS_API = 'https://node.gitlawb.com/api/v1/repos'

async function sendSnapshot(request, response, status = 200, reason = 'snapshot') {
  const host = request.headers['x-forwarded-host'] || request.headers.host
  const protocol = request.headers['x-forwarded-proto'] || 'https'
  const snapshotUrl = `${protocol}://${host}/data/repos.json`
  const snapshot = await fetch(snapshotUrl, {
    headers: { Accept: 'application/json' },
  })
  const body = await snapshot.text()

  response.status(status)
  response.setHeader('Content-Type', snapshot.headers.get('content-type') || 'application/json; charset=utf-8')
  response.setHeader('X-ScoutLawb-Source', reason)
  response.send(body)
}

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
  const timeout = setTimeout(() => controller.abort(), 6500)

  try {
    const upstream = await fetch(GITLAWB_REPOS_API, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    const body = await upstream.text()

    if (!upstream.ok) {
      await sendSnapshot(request, response, 200, `snapshot-fallback: upstream ${upstream.status}`)
      return
    }

    response.status(upstream.status)
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    response.setHeader('X-ScoutLawb-Source', 'live')
    response.send(body)
  } catch (error) {
    await sendSnapshot(request, response, 200, error instanceof Error ? `snapshot-fallback: ${error.message}` : 'snapshot-fallback')
  } finally {
    clearTimeout(timeout)
  }
}

const GITLAWB_REPOS_API = 'https://node.gitlawb.com/api/v1/repos'

async function sendSnapshot(response, status = 200, reason = 'snapshot') {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const snapshotPath = path.join(process.cwd(), 'public', 'data', 'repos.json')
  const body = await fs.readFile(snapshotPath, 'utf8')

  response.status(status)
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
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
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const upstream = await fetch(GITLAWB_REPOS_API, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    const body = await upstream.text()

    if (!upstream.ok) {
      await sendSnapshot(response, 200, `snapshot-fallback: upstream ${upstream.status}`)
      return
    }

    response.status(upstream.status)
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    response.setHeader('X-ScoutLawb-Source', 'live')
    response.send(body)
  } catch (error) {
    await sendSnapshot(response, 200, error instanceof Error ? `snapshot-fallback: ${error.message}` : 'snapshot-fallback')
  } finally {
    clearTimeout(timeout)
  }
}

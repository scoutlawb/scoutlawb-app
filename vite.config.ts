import type { Connect, Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GITLAWB_REPOS_API = 'https://node.gitlawb.com/api/v1/repos'

function gitlawbReposProxy(): Plugin {
  const handler: Connect.NextHandleFunction = async (request, response, next) => {
    if (!request.url?.startsWith('/api/gitlawb/repos')) {
      next()
      return
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type, accept',
      })
      response.end()
      return
    }

    if (request.method !== 'GET') {
      response.writeHead(405, { Allow: 'GET, OPTIONS' })
      response.end()
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    try {
      const upstream = await fetch(GITLAWB_REPOS_API, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      const body = await upstream.text()

      response.writeHead(upstream.status, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      })
      response.end(body)
    } catch (error) {
      response.writeHead(502, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      })
      response.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'GitLawb proxy failed',
        }),
      )
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    name: 'gitlawb-repos-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [gitlawbReposProxy(), react()],
  preview: {
    allowedHosts: ['.ngrok-free.app'],
  },
})

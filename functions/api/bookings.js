const UPSTREAM_BASE = 'https://sollentuna.interbookfri.se'
const UPSTREAM_URL = `${UPSTREAM_BASE}/BookingAPI/GetBookingsForSchedule`

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** Visit the site root to obtain a session cookie (IBGO_Release etc.) */
async function getSessionCookie() {
  const res = await fetch(UPSTREAM_BASE, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  })
  // Consume body so connection can be reused
  await res.arrayBuffer()

  // Collect Set-Cookie values into a single Cookie header string.
  // Cloudflare Workers support getAll on Headers for Set-Cookie.
  // Fall back to .get() which joins with ', ' if getAll isn't available.
  let cookies
  if (typeof res.headers.getAll === 'function') {
    cookies = res.headers.getAll('Set-Cookie')
  } else {
    const raw = res.headers.get('Set-Cookie') || ''
    cookies = raw.split(', ').filter(Boolean)
  }
  return cookies
    .map((c) => c.split(';')[0]) // keep only name=value
    .join('; ')
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function onRequestPost(context) {
  const body = await context.request.text()

  // Step 1: get session cookie
  const cookie = await getSessionCookie()

  // Step 2: make the actual API call with the cookie
  const upstream = await fetch(UPSTREAM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: UPSTREAM_BASE,
      Referer: `${UPSTREAM_BASE}/`,
      'User-Agent': UA,
      Cookie: cookie,
    },
    body,
  })

  if (!upstream.ok) {
    const text = await upstream.text()
    return new Response(
      JSON.stringify({
        error: `Upstream ${upstream.status}`,
        body: text.slice(0, 500),
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      },
    )
  }

  const data = await upstream.arrayBuffer()
  return new Response(data, {
    status: upstream.status,
    headers: {
      'Content-Type':
        upstream.headers.get('Content-Type') ?? 'application/json',
      ...CORS_HEADERS,
    },
  })
}

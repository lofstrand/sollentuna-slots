const UPSTREAM_URL =
  'https://sollentuna.interbookfri.se/APIBooking/GetSearchBookableFacilityObjectsFilterLists'

const UPSTREAM_HEADERS = {
  Accept: 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function onRequestGet() {
  const upstream = await fetch(UPSTREAM_URL, { headers: UPSTREAM_HEADERS })
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

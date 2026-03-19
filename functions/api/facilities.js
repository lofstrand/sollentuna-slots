export async function onRequestGet() {
  const upstream = await fetch(
    'https://sollentuna.interbookfri.se/APIBooking/GetSearchBookableFacilityObjectsFilterLists',
  )
  const data = await upstream.arrayBuffer()
  return new Response(data, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  })
}

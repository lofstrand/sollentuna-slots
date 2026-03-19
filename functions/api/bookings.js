export async function onRequestPost(context) {
  const body = await context.request.text()
  const upstream = await fetch(
    'https://sollentuna.interbookfri.se/BookingAPI/GetBookingsForSchedule',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
  )
  const data = await upstream.arrayBuffer()
  return new Response(data, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  })
}

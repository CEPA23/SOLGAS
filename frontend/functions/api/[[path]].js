const BACKEND_ORIGIN = 'https://solgas.onrender.com';

export async function onRequest(context) {
  const incomingUrl = new URL(context.request.url);
  const backendUrl = new URL(incomingUrl.pathname.replace(/^\/api/, '') || '/', BACKEND_ORIGIN);
  backendUrl.search = incomingUrl.search;

  const headers = new Headers(context.request.headers);
  headers.delete('host');

  const methodHasBody = !['GET', 'HEAD'].includes(context.request.method);
  const response = await fetch(backendUrl, {
    method: context.request.method,
    headers,
    body: methodHasBody ? context.request.body : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

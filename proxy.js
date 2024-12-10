const cache = caches.default;

export async function onRequest(context) {
  const { pathname, search } = new URL(context.request.url);
  const cacheKey = new Request(context.request.url, context.request);
  let response = await cache.match(cacheKey);

  if (!response) {
    const workersUrl = `https://your-workers-url.workers.dev${pathname}${search}`;
    response = await fetch(workersUrl, {
      method: context.request.method,
      headers: context.request.headers,
      body: context.request.body,
    });
    response = new Response(response.body, response);
    response.headers.append('Cache-Control', 's-maxage=3600');
    await cache.put(cacheKey, response.clone());
  }

  return response;
}

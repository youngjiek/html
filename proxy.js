export async function onRequest(context) {
  const { pathname, search } = new URL(context.request.url);

  // 目标 HTTP API 的基础 URL
  const targetApiBase = 'http://example.com';

  // 拼接完整的目标 URL
  const targetUrl = `${targetApiBase}${pathname}${search}`;

  // 转发请求到目标 HTTP API
  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.method !== 'GET' ? await context.request.text() : null,
  });

  // 返回目标 HTTP API 的响应，并设置必要的跨域头
  return new Response(response.body, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers),
      'Access-Control-Allow-Origin': '*', // 允许所有来源
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // 允许的方法
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // 允许的请求头
    },
  });
}

export async function onRequest(context) {
  // 获取原始请求 URL
  const url = new URL(context.request.url);

  // 提取查询参数的 key 和 value
  const [key, value] = url.search.replace('?', '').split('=');

  // 如果没有查询参数，返回错误
  if (!key || !value) {
    return new Response('Invalid query parameters', { status: 400 });
  }

  // 构建目标 URL
  const targetUrl = new URL(`http://jie.ueuo.com/api.php`);
  targetUrl.searchParams.set(key, value); // 将解析出的 key 和 value 添加为参数

  // 将原始请求中的其他查询参数附加到目标 URL
  for (const [paramKey, paramValue] of url.searchParams) {
    if (paramKey !== key) {
      targetUrl.searchParams.set(paramKey, paramValue);
    }
  }

  // 创建新的请求对象
  const newRequest = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD' ? await context.request.text() : null,
  });

  // 代理请求到目标接口
  const response = await fetch(newRequest);

  // 返回目标 API 的响应，并设置跨域头
  return new Response(response.body, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

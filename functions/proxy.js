export async function onRequest(context) {
  // 获取原始请求 URL
  const url = new URL(context.request.url);

  // 使用正则表达式提取 "/api/" 到下一个 "/" 之间的内容
  const match = url.pathname.match(/^\/api\/([^\/]+)/);
  if (!match) {
    return new Response('Not Found', { status: 404 });
  }

  // 获取 "/api/" 后的部分作为 act 参数值
  const action = match[1];

  // 构建目标 URL
  const targetUrl = new URL(`http://jie.ueuo.com/api.php`);
  targetUrl.searchParams.set('act', action);

  // 将原始请求中的所有查询参数附加到目标 URL
  for (const [key, value] of url.searchParams) {
    if (key !== 'act') { // 避免重复设置 act 参数
      targetUrl.searchParams.set(key, value);
    }
  }

  // 创建新的请求对象
  const newRequest = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD' ? await context.request.text() : null, // 保留请求体
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

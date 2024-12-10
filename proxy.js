export async function onRequest(context) {
  // 获取请求的路径和参数
  const { pathname, search } = new URL(context.request.url);

  // 拼接代理地址
  const workersUrl = `https://your-workers-url.workers.dev${pathname}${search}`;

  // 转发请求到 Workers
  const response = await fetch(workersUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });

  // 返回 Workers 的响应
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

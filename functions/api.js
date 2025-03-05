//需要区分成功和失败
function jsonResponseOk(msg,data) {
  // 默认状态码为 200 OK
  const status = 200;
  return new Response(
      JSON.stringify({ msg:msg,data: data ,status: status })
  );
}
function jsonResponseErr(msg,init,data) {
  // 默认状态码为 0 OK
  const status = init || 0;
  return new Response(
      JSON.stringify({ msg:msg,data: data ,status: status })
  );
}
// 封装代理请求
async function proxyRequest(act, post_data) {
  const targetUrl = new URL("https://sql.yang00fox.workers.dev/");
  targetUrl.searchParams.set("api", act); // 设置 API 动作

  const options = {
    method: "POST", // 统一使用 POST 传递数据
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(post_data)
  };

  try {
    const response = await fetch(targetUrl.toString(), options);
    const data = await response.json();
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  //使用 cloudflare D1 数据库
  const targetUrl = new URL("https://sql.yang00fox.workers.dev/");

  let hasParams = false; // 标记是否有参数
  let paramsCollected = {}; // 记录所有参数
  let body = null;
  const headers = new Headers(request.headers); // 复制请求头

  // 处理 GET 请求参数
  url.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
    hasParams = true; // 发现参数
    paramsCollected[key] = value;
  });

  // 处理 POST 请求参数
  if (request.method === "POST") {
    const contentType = request.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
      const jsonData = await request.json();
      if (Object.keys(jsonData).length > 0) hasParams = true; // 发现参数
      body = JSON.stringify(jsonData);
      paramsCollected["post_body"] = jsonData;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      if ([...formData.keys()].length > 0) hasParams = true; // 发现参数
      body = new URLSearchParams(formData).toString();
      formData.forEach((value, key) => {
        paramsCollected[key] = value;
      });
    } else if (contentType.includes("text/plain") || contentType.includes("application/xml")) {
      body = await request.text();
      if (body.trim() !== "") hasParams = true; // 发现参数
      paramsCollected["post_body"] = body;
    } else {
      body = await request.arrayBuffer(); // 其他格式的原始二进制数据
      if (body.byteLength > 0) hasParams = true; // 发现参数
      paramsCollected["post_body"] = "[Binary Data]";
    }
  }

  // 打印所有获取到的参数（用于调试）

  // 如果没有任何参数，返回 400 错误
  if (!hasParams) {
    return new Response(
        JSON.stringify({ error: "Invalid query parameters", collected: paramsCollected }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
    );
  }/*else{
    JSON.stringify(paramsCollected, null, 2)
    return new Response(
        JSON.stringify(paramsCollected, null, 2),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
    );
  }*/

  // 代理请求到目标 URL
  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers,
    body,
  });

  // 返回目标 API 的响应
  return new Response(response.body, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

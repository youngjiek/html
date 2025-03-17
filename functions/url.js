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
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    return jsonResponseOk("ok",url)
    // 获取用户请求的目标网址
    let targetPath = url.pathname.replace(/^\/url\//, ""); // 变成 "google.com"

    // 确保 targetPath 是一个合法的 URL
    if (!targetPath || !targetPath.includes(".")) {
        return new Response("Invalid URL", { status: 400 });
    }

    // 组装完整的目标 URL
    let targetUrl = `https://${targetPath}`;

    try {
        let response = await fetch(targetUrl, request);
        let contentType = response.headers.get("content-type") || "";

        // 如果是 HTML，则修改内部链接，使其仍然走代理
        if (contentType.includes("text/html")) {
            let text = await response.text();

            // 替换所有超链接，使其仍然在 `/url/` 下
            text = text.replace(/href="https?:\/\/(.*?)"/g, `href="/url/$1"`);
            text = text.replace(/src="https?:\/\/(.*?)"/g, `src="/url/$1"`);

            response = new Response(text, response);
            response.headers.set("content-type", "text/html; charset=utf-8");
        }

        return response;
    } catch (error) {
        return new Response(`Error fetching ${targetUrl}: ${error}`, { status: 500 });
    }
}



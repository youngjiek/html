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
    return jsonResponseErr("ok");
    // 提取目标 URL
    let targetUrl = url.pathname.replace(/^\/url\//, "https://");

    // 防止非法请求
    if (!targetUrl.startsWith("https://")) {
        return new Response("Invalid Request", { status: 400 });
    }

    // 代理目标网站
    let response = await fetch(targetUrl, request);
    let contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
        let text = await response.text();

        // 修改 HTML 页面中的所有链接，使其仍然指向 /url/ 路径
        text = text.replace(/href="https?:\/\/(.*?)"/g, `href="/url/$1"`);
        text = text.replace(/src="https?:\/\/(.*?)"/g, `src="/url/$1"`);

        response = new Response(text, response);
        response.headers.set("content-type", "text/html; charset=utf-8");
    }

    return response;
}


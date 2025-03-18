// 成功响应
function jsonResponseOk(msg, data) {
    return new Response(JSON.stringify({ msg: msg, data: data, status: 200 }), {
        headers: { "Content-Type": "application/json" }
    });
}

// 失败响应
function jsonResponseErr(msg, init, data) {
    return new Response(JSON.stringify({ msg: msg, data: data, status: init || 0 }), {
        headers: { "Content-Type": "application/json" }
    });
}

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // **问号前**是代理前缀，例如 `https://mh.youngjk.top/url/`
    let proxyPrefix = `${url.origin}${url.pathname.split("?")[0]}?`;

    // **问号后**是需要代理的目标地址
    let targetPath = url.searchParams.toString(); // 直接获取 `?` 后的内容

    // 确保 targetPath 是合法的域名
    if (!targetPath || !targetPath.includes(".")) {
        return jsonResponseErr("Invalid URL");
    }

    // 组装完整的目标 URL
    let targetUrl = `https://${targetPath}`;

    try {
        let response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // 伪装请求，防止被拦截
        });

        let contentType = response.headers.get("content-type") || "";

        // 如果是 HTML 页面
        if (contentType.includes("text/html")) {
            let text = await response.text();

            // 替换 HTML 页面中的所有 `<a>` 和 `<script>` 相关跳转
            text = text.replace(/(href|src)="(https?:\/\/[^"]+)"/g, (match, attr, link) => {
                return `${attr}="${proxyPrefix}${encodeURIComponent(link)}"`;
            });

            // 移除 `<meta http-equiv="refresh">`
            text = text.replace(/<meta[^>]*http-equiv=["']refresh["'][^>]*>/gi, "");

            // 禁止 `window.location` 相关 JavaScript 跳转
            text = text.replace(/window\.location\s*=\s*['"](.*?)['"]/g, "// window.location disabled");

            response = new Response(text, response);
            response.headers.set("content-type", "text/html; charset=utf-8");

            return response;
        }

        return response;
    } catch (error) {
        return jsonResponseErr(`Error fetching ${targetUrl}: ${error}`);
    }
}

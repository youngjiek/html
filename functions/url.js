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

    // 解析代理前缀
    let proxyPrefix = `${url.origin}${url.pathname.split("?")[0]}?`;

    // 获取 `?` 后面的代理目标网址
    let targetPath = url.search.substring(1);

    if (!targetPath || !targetPath.includes(".")) {
        return new Response("Invalid URL", { status: 400 });
    }

    let targetUrl = `https://${targetPath}`;

    try {
        let response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        let contentType = response.headers.get("content-type") || "";

        if (contentType.includes("text/html")) {
            let text = await response.text();

            // 替换所有超链接，确保所有链接都经过代理
            text = text.replace(/(href|src)="(https?:\/\/[^"]+)"/g, (match, attr, link) => {
                return `${attr}="${proxyPrefix}${encodeURIComponent(link)}"`;
            });

            // 移除 `<meta refresh>`
            text = text.replace(/<meta[^>]*http-equiv=["']refresh["'][^>]*>/gi, "");

            // 禁止 `window.location` 跳转
            text = text.replace(/window\.location\s*=\s*['"](.*?)['"]/g, "// window.location disabled");

            response = new Response(text, response);
            response.headers.set("content-type", "text/html; charset=utf-8");

            return response;
        }

        return response;
    } catch (error) {
        return new Response(`Error fetching ${targetUrl}: ${error}`, { status: 500 });
    }
}


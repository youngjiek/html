export default {
    async fetch(request) {
        const url = new URL(request.url);
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
            // 修改 HTML 页面中的所有链接，使其仍指向 /url/ 路径
            text = text.replace(/href="https?:\/\/(.*?)"/g, `href="/url/$1"`);
            text = text.replace(/src="https?:\/\/(.*?)"/g, `src="/url/$1"`);

            response = new Response(text, response);
            response.headers.set("content-type", "text/html; charset=utf-8");
        }

        return response;
    }
};

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
export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 获取 URL 查询参数（GET 请求）
        let params = Object.fromEntries(url.searchParams.entries());

        // 如果是 POST 请求，处理请求体中的数据
        if (request.method === "POST") {
            const contentType = request.headers.get("Content-Type");

            // 如果 Content-Type 是 JSON 格式
            if (contentType && contentType.includes("application/json")) {
                try {
                    const postData = await request.json();  // 获取 JSON 数据
                    params = { ...params, ...postData };  // 将 POST 数据合并到 GET 参数中
                } catch (error) {
                    return new Response("Invalid JSON body", { status: 400 });
                }
            }
            // 如果 Content-Type 是 URL 编码的表单数据
            else if (contentType && contentType.includes("application/x-www-form-urlencoded")) {
                const formData = await request.formData();  // 获取表单数据
                formData.forEach((value, key) => {
                    params[key] = value;  // 将表单数据合并到 GET 参数中
                });
            }
            // 如果是其他类型的请求体（如文本）
            else if (contentType && contentType.includes("text/plain")) {
                const postData = await request.text();  // 获取原始文本数据
                params["body"] = postData;  // 将原始请求体放到 params 中
            }
            else {
                return new Response("Unsupported Content-Type", { status: 415 });
            }
        }
        // return jsonResponseOk("ps",params);

        const post_data = params.post_data ? JSON.parse(params.post_data) : null;
        const sql = params.sql;  // 完整的 SQL 查询字符串
        const act = params.act;  // 完整的 act
        // 允许传递自定义 SQL 查询
        if (!act) {
            return jsonResponseErr("缺少接口参数");

        }
        if (!sql) {
            return jsonResponseErr("缺少参数");
        }

        // 获取 SQL 前六个字母，并转换为大写
        const sqlType = sql.toUpperCase().slice(0, 6);

        switch (sqlType) {
            case "SELECT":
                return await this.queryTable(sql, env);  // 查询操作
            case "INSERT":
                return await this.insertRow(sql, post_data, env);  // 插入操作
            case "UPDATE":
                return await this.updateRow(sql, post_data, env);  // 更新操作
            case "DELETE":
                return await this.deleteRow(sql, env);  // 删除操作
            default:
                return jsonResponseErr("Unsupported operation type");
        }


    },
    //
    async executeCustomSQL(sql, env) {
        // 简单的 SQL 验证：防止执行危险的查询，例如 DROP, DELETE 等
        const forbiddenCommands = ['DROP', 'DELETE', 'UPDATE'];
        if (forbiddenCommands.some(command => sql.toUpperCase().includes(command))) {
            return jsonResponseErr("Forbidden SQL command detected");
        }

        // 你可以在这里对 SQL 查询做进一步的安全校验，确保不含有恶意内容

        try {
            const result = await env.jksql.prepare(sql).all();  // 执行查询
            return jsonResponseOk("ok",result.results);
        } catch (err) {
            console.error('SQL execution error:', err);
            return jsonResponseErr(`Error querying table: ${err.message}`);
        }
    },

    // 查询表内容
    async queryTable(sql, env) {
        try {
            const result = await env.jksql.prepare(sql).all();  // 执行 SELECT 查询
            return jsonResponseOk("ok",result.results);
        } catch (error) {
            console.error('SQL execution error:', error);
            return jsonResponseErr(`Error querying table: ${error.message}`, 500);
        }
    },
    // 插入行
    async insertRow(sql, post_data, env) {
        try {
            let result;
            if (!post_data) {
                result = await env.jksql.prepare(sql).run();  // 执行 INSERT，不绑定数据
            }else{
                // 如果有 post_data，就绑定数据
                result = await env.jksql.prepare(sql).bind(...Object.values(post_data)).run();  // 执行 INSERT
            }
            return jsonResponseOk("ok",result.meta.last_row_id );
        } catch (error) {
            console.error('SQL execution error:', error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500 }
            );
        }
    },

    // 更新行
    async updateRow(sql, post_data, env) {
        try {
            let result;
            if (!post_data) {
                result = await env.jksql.prepare(sql).run();  // 执行 sql
            }else{
                // 如果有 post_data，就绑定数据
                result = await env.jksql.prepare(sql).bind(...Object.values(post_data)).run();  // 执行 sql
            }

            return jsonResponseOk("ok",result.meta.changed_db);
        } catch (error) {
            console.error('SQL execution error:', error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500 }
            );
        }
    },

    // 删除行
    async deleteRow(sql, env) {
        try {
            const result = await env.jksql.prepare(sql).run();  // 执行 DELETE
            return jsonResponseOk("ok",result.meta.changed_db);
        } catch (error) {
            console.error('SQL execution error:', error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500 }
            );
        }
    }
};

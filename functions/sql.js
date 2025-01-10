export async function onRequest(context) {
    return new Response('sqls', { status: 400 });
    // Create a prepared statement with our query
    const ps = context.env.NORTHWIND_DB.prepare("SELECT * from home_add_url");
    const data = await ps.first();
  
    return Response.json(data);
  }
export default {
    async fetch(request, env) {
      const { pathname } = new URL(request.url);
  
      if (pathname === "/jksql") {
        // If you did not use `DB` as your binding name, change it here
        
        const { results } = await env.DB.prepare(
          "SELECT * FROM home_add_url",
        );
        return Response.json(results);
        // const ps = env.NORTHWIND_DB.prepare("SELECT * from home_add_url");
        // const data = await ps.first();

        // return Response.json(data);
      }
  
      return new Response(
        "Call /api/beverages to see everyone who works at Bs Beverages",
      );
    },
  };
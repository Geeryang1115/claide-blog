interface Env {
  DB: D1Database
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context
  const id = Number(params.id)

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT * FROM DeviceLicense WHERE Id = ?')
        .bind(id)
        .first()

      if (!row) {
        return Response.json({ success: false, error: 'Not found' }, { status: 404, headers: corsHeaders })
      }

      return Response.json({ success: true, data: row }, { headers: corsHeaders })
    }

    if (request.method === 'PUT') {
      const body = await request.json<{
        DeviceName: string
        CustomerName: string
        ProjectCode: string
        MacAddress: string
        IpAddress: string
        StartTime: string
        EndTime: string | null
        IsEnabled?: number
      }>()

      const { DeviceName, CustomerName, ProjectCode, MacAddress, IpAddress, StartTime, EndTime, IsEnabled = 1 } = body

      await env.DB.prepare(
        `UPDATE DeviceLicense
         SET DeviceName = ?, CustomerName = ?, ProjectCode = ?, MacAddress = ?, IpAddress = ?, StartTime = ?, EndTime = ?, IsEnabled = ?, UpdateTime = datetime('now')
         WHERE Id = ?`
      )
        .bind(DeviceName, CustomerName, ProjectCode, MacAddress, IpAddress, StartTime, EndTime, IsEnabled, id)
        .run()

      return Response.json({ success: true }, { headers: corsHeaders })
    }

    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM DeviceLicense WHERE Id = ?')
        .bind(id)
        .run()

      return Response.json({ success: true }, { headers: corsHeaders })
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

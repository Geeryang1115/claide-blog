interface Env {
  DB: D1Database
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const url = new URL(request.url)

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (request.method === 'GET') {
      const search = url.searchParams.get('search') || ''
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)
      const offset = (page - 1) * pageSize

      let sql = 'SELECT * FROM DeviceLicense'
      let countSql = 'SELECT COUNT(*) as total FROM DeviceLicense'
      const params: (string | number)[] = []

      if (search) {
        const like = `%${search}%`
        sql += ' WHERE DeviceName LIKE ? OR MacAddress LIKE ? OR IpAddress LIKE ?'
        countSql += ' WHERE DeviceName LIKE ? OR MacAddress LIKE ? OR IpAddress LIKE ?'
        params.push(like, like, like)
      }

      sql += ' ORDER BY Id DESC LIMIT ? OFFSET ?'
      params.push(pageSize, offset)

      const [dataResult, countResult] = await Promise.all([
        env.DB.prepare(sql).bind(...params).all(),
        env.DB.prepare(countSql).bind(...(search ? [like, like, like] : [])).first<{ total: number }>(),
      ])

      return Response.json(
        {
          data: dataResult.results || [],
          total: countResult?.total || 0,
          page,
          pageSize,
        },
        { headers: corsHeaders }
      )
    }

    if (request.method === 'POST') {
      const body = await request.json<{
        DeviceName: string
        MacAddress: string
        IpAddress: string
        StartTime: string
        EndTime: string
        IsEnabled?: number
      }>()

      const { DeviceName, MacAddress, IpAddress, StartTime, EndTime, IsEnabled = 1 } = body

      const result = await env.DB.prepare(
        `INSERT INTO DeviceLicense (DeviceName, MacAddress, IpAddress, StartTime, EndTime, IsEnabled, UpdateTime)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      )
        .bind(DeviceName, MacAddress, IpAddress, StartTime, EndTime, IsEnabled)
        .run()

      return Response.json(
        { success: true, id: result.meta?.last_row_id },
        { headers: corsHeaders }
      )
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

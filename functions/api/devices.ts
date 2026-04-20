interface Env {
  DB: D1Database
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const url = new URL(request.url)

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
    // Stats endpoint: /api/devices?stats=1
    if (request.method === 'GET' && url.searchParams.get('stats') === '1') {
      const now = new Date().toISOString()
      const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const [
        totalRow,
        enabledRow,
        disabledRow,
        expiringSoonRow,
        expiredRow,
        permanentRow,
      ] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as total FROM DeviceLicense').first<{ total: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM DeviceLicense WHERE IsEnabled = 1').first<{ count: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM DeviceLicense WHERE IsEnabled = 0').first<{ count: number }>(),
        env.DB.prepare(
          `SELECT COUNT(*) as count FROM DeviceLicense
           WHERE EndTime IS NOT NULL AND EndTime > ? AND EndTime <= ? AND IsEnabled = 1`
        ).bind(now, sevenDaysLater).first<{ count: number }>(),
        env.DB.prepare(
          `SELECT COUNT(*) as count FROM DeviceLicense
           WHERE EndTime IS NOT NULL AND EndTime < ? AND IsEnabled = 1`
        ).bind(now).first<{ count: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM DeviceLicense WHERE EndTime IS NULL').first<{ count: number }>(),
      ])

      return Response.json(
        {
          total: totalRow?.total || 0,
          enabled: enabledRow?.count || 0,
          disabled: disabledRow?.count || 0,
          expiringSoon: expiringSoonRow?.count || 0,
          expired: expiredRow?.count || 0,
          permanent: permanentRow?.count || 0,
        },
        { headers: corsHeaders }
      )
    }

    if (request.method === 'GET') {
      const search = url.searchParams.get('search') || ''
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)
      const offset = (page - 1) * pageSize

      let sql = 'SELECT * FROM DeviceLicense'
      let countSql = 'SELECT COUNT(*) as total FROM DeviceLicense'
      const params: (string | number | null)[] = []

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
        env.DB.prepare(countSql).bind(...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [])).first<{ total: number }>(),
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
        EndTime: string | null
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

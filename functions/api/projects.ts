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
    if (request.method === 'GET') {
      const search = url.searchParams.get('search') || ''

      let sql = 'SELECT * FROM Projects'
      let countSql = 'SELECT COUNT(*) as total FROM Projects'
      const params: string[] = []

      if (search) {
        const like = `%${search}%`
        sql += ' WHERE ProjectCode LIKE ? OR ProjectName LIKE ?'
        countSql += ' WHERE ProjectCode LIKE ? OR ProjectName LIKE ?'
        params.push(like, like)
      }

      sql += ' ORDER BY Id DESC'

      const [dataResult, countResult] = await Promise.all([
        env.DB.prepare(sql).bind(...params).all(),
        env.DB.prepare(countSql).bind(...(search ? [`%${search}%`, `%${search}%`] : [])).first<{ total: number }>(),
      ])

      return Response.json(
        {
          data: dataResult.results || [],
          total: countResult?.total || 0,
        },
        { headers: corsHeaders }
      )
    }

    if (request.method === 'POST') {
      const body = await request.json<{
        projects: { ProjectCode: string; ProjectName: string }[]
      }>()

      const { projects } = body
      const inserted: number[] = []
      const skipped: string[] = []

      for (const p of projects) {
        // Check if project code already exists
        const existing = await env.DB.prepare('SELECT Id FROM Projects WHERE ProjectCode = ?')
          .bind(p.ProjectCode)
          .first<{ Id: number }>()

        if (existing) {
          skipped.push(p.ProjectCode)
          continue
        }

        const result = await env.DB.prepare(
          `INSERT INTO Projects (ProjectCode, ProjectName, CreateTime)
           VALUES (?, ?, datetime('now'))`
        )
          .bind(p.ProjectCode, p.ProjectName || '')
          .run()

        if (result.meta?.last_row_id) {
          inserted.push(result.meta.last_row_id)
        }
      }

      return Response.json(
        { success: true, inserted: inserted.length, skipped },
        { headers: corsHeaders }
      )
    }

    if (request.method === 'PUT') {
      const body = await request.json<{
        Id: number
        ProjectCode: string
        ProjectName: string
      }>()

      const { Id, ProjectCode, ProjectName } = body

      await env.DB.prepare(
        'UPDATE Projects SET ProjectCode = ?, ProjectName = ? WHERE Id = ?'
      )
        .bind(ProjectCode, ProjectName, Id)
        .run()

      return Response.json({ success: true }, { headers: corsHeaders })
    }

    if (request.method === 'DELETE') {
      const body = await request.json<{ Id: number }>()
      await env.DB.prepare('DELETE FROM Projects WHERE Id = ?').bind(body.Id).run()
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

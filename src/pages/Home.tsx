import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Infinity, Shield, Clock, AlertTriangle, Upload, FileSpreadsheet, FolderKanban, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Dashboard from '@/components/Dashboard'
import type { DeviceLicense, DeviceFormData } from '@/types/device'
import type { Project, ProjectFormData } from '@/types/project'
import * as XLSX from 'xlsx'

const API_BASE = '/api'

function getLicenseStatus(device: DeviceLicense) {
  if (!device.IsEnabled) return { label: '禁用', class: 'bg-red-500/10 text-red-400' }
  if (!device.EndTime) return { label: '永久授权', class: 'bg-cyan-500/10 text-cyan-400' }
  const now = new Date().getTime()
  const end = new Date(device.EndTime).getTime()
  const diff = end - now
  if (diff < 0) return { label: '已过期', class: 'bg-rose-500/10 text-rose-400' }
  if (diff < 7 * 24 * 60 * 60 * 1000) return { label: '即将过期', class: 'bg-amber-500/10 text-amber-400' }
  return { label: '正常', class: 'bg-emerald-500/10 text-emerald-400' }
}

export default function Home() {
  const [devices, setDevices] = useState<DeviceLicense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<DeviceLicense | null>(null)
  const [filter, setFilter] = useState<string>('all')

  // Excel import
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importRows, setImportRows] = useState<DeviceFormData[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Project ledger
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectSearch, setProjectSearch] = useState('')
  const [projectImportDialogOpen, setProjectImportDialogOpen] = useState(false)
  const [projectImportRows, setProjectImportRows] = useState<ProjectFormData[]>([])
  const [projectImportLoading, setProjectImportLoading] = useState(false)
  const [projectForm, setProjectForm] = useState<ProjectFormData>({ ProjectCode: '', ProjectName: '' })
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const projectFileRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<DeviceFormData>({
    DeviceName: '',
    CustomerName: '',
    ProjectCode: '',
    MacAddress: '',
    IpAddress: '',
    StartTime: '',
    EndTime: '',
    IsEnabled: 1,
  })

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE}/devices?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
      )
      const json = await res.json()
      setDevices(json.data || [])
      setTotal(json.total || 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => { fetchDevices() }, [fetchDevices])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchDevices()
  }

  const handleAdd = () => {
    setEditingDevice(null)
    setFormData({
      DeviceName: '',
      CustomerName: '',
      ProjectCode: '',
      MacAddress: '',
      IpAddress: '',
      StartTime: '',
      EndTime: '',
      IsEnabled: 1,
    })
    setDialogOpen(true)
  }

  const handleEdit = (device: DeviceLicense) => {
    setEditingDevice(device)
    setFormData({
      DeviceName: device.DeviceName,
      CustomerName: device.CustomerName || '',
      ProjectCode: device.ProjectCode || '',
      MacAddress: device.MacAddress,
      IpAddress: device.IpAddress,
      StartTime: device.StartTime,
      EndTime: device.EndTime,
      IsEnabled: device.IsEnabled,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该设备授权信息吗？')) return
    await fetch(`${API_BASE}/devices/${id}`, { method: 'DELETE' })
    fetchDevices()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingDevice ? `${API_BASE}/devices/${editingDevice.Id}` : `${API_BASE}/devices`
    const method = editingDevice ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    setDialogOpen(false)
    fetchDevices()
  }

  const setPermanent = () => {
    setFormData({ ...formData, EndTime: null })
  }

  // Project functions
  const fetchProjects = useCallback(async () => {
    const res = await fetch(`${API_BASE}/projects?search=${encodeURIComponent(projectSearch)}`)
    const json = await res.json()
    setProjects(json.data || [])
  }, [projectSearch])

  useEffect(() => {
    if (projectDialogOpen) fetchProjects()
  }, [projectDialogOpen, fetchProjects])

  const handleProjectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

      if (json.length < 2) {
        alert('CSV 文件数据为空')
        return
      }

      const headers = json[0].map(h => String(h).trim())
      const rows: ProjectFormData[] = []

      for (let i = 1; i < json.length; i++) {
        const row = json[i]
        if (!row || row.length === 0) continue

        const getValue = (keywords: string[]) => {
          for (const kw of keywords) {
            const idx = headers.findIndex(h => h.includes(kw))
            if (idx >= 0) return String(row[idx] || '').trim()
          }
          return ''
        }

        const projectCode = getValue(['项目编号', '项目代码', 'ProjectCode', 'Project Code', '项目号', '编号'])
        const projectName = getValue(['项目名称', '项目名', 'ProjectName', 'Project Name', '名称', '项目'])

        if (!projectCode && !projectName) continue
        if (!projectCode) continue

        rows.push({ ProjectCode: projectCode, ProjectName: projectName })
      }

      setProjectImportRows(rows)
      setProjectImportDialogOpen(true)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const handleProjectImportConfirm = async () => {
    setProjectImportLoading(true)
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: projectImportRows }),
      })
      const json = await res.json()
      setProjectImportDialogOpen(false)
      setProjectImportRows([])
      fetchProjects()
      if (json.skipped?.length > 0) {
        alert(`导入完成！新增 ${json.inserted} 条，跳过 ${json.skipped.length} 条（项目编号已存在）`)
      }
    } finally {
      setProjectImportLoading(false)
    }
  }

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProject) {
      await fetch(`${API_BASE}/projects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Id: editingProject.Id, ...projectForm }),
      })
      setEditingProject(null)
    } else {
      await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: [projectForm] }),
      })
    }
    setProjectForm({ ProjectCode: '', ProjectName: '' })
    fetchProjects()
  }

  const handleProjectDelete = async (id: number) => {
    if (!confirm('确定删除该项目？')) return
    await fetch(`${API_BASE}/projects`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Id: id }),
    })
    fetchProjects()
  }

  // Excel import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

      if (json.length < 2) {
        alert('Excel 文件数据为空')
        return
      }

      const headers = json[0].map(h => String(h).trim())
      const rows: DeviceFormData[] = []

      for (let i = 1; i < json.length; i++) {
        const row = json[i]
        if (!row || row.length === 0) continue

        const getValue = (name: string) => {
          const idx = headers.findIndex(h => h.includes(name))
          return idx >= 0 ? String(row[idx] || '').trim() : ''
        }

        const deviceName = getValue('设备') || getValue('Device')
        const customerName = getValue('客户') || getValue('Customer')
        const projectCode = getValue('项目') || getValue('Project')
        const macAddress = getValue('MAC') || getValue('Mac')
        const ipAddress = getValue('IP')

        if (!deviceName && !macAddress && !ipAddress) continue

        rows.push({
          DeviceName: deviceName,
          CustomerName: customerName,
          ProjectCode: projectCode,
          MacAddress: macAddress,
          IpAddress: ipAddress,
          StartTime: new Date().toISOString().slice(0, 16),
          EndTime: '',
          IsEnabled: 1,
        })
      }

      setImportRows(rows)
      setImportDialogOpen(true)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const handleImportConfirm = async () => {
    setImportLoading(true)
    try {
      for (const row of importRows) {
        await fetch(`${API_BASE}/devices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        })
      }
      setImportDialogOpen(false)
      setImportRows([])
      fetchDevices()
    } finally {
      setImportLoading(false)
    }
  }

  const updateImportRow = (index: number, field: keyof DeviceFormData, value: any) => {
    setImportRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const setAllEndTime = (value: string) => {
    setImportRows(prev => prev.map(r => ({ ...r, EndTime: value })))
  }

  const setAllStartTime = (value: string) => {
    setImportRows(prev => prev.map(r => ({ ...r, StartTime: value })))
  }

  const filteredDevices = useMemo(() => {
    const now = new Date().getTime()
    return devices.filter((d) => {
      switch (filter) {
        case 'enabled': return d.IsEnabled === 1
        case 'disabled': return d.IsEnabled === 0
        case 'expiring':
          return d.IsEnabled === 1 && !!d.EndTime && new Date(d.EndTime).getTime() - now > 0 && new Date(d.EndTime).getTime() - now < 7 * 24 * 60 * 60 * 1000
        case 'expired':
          return d.IsEnabled === 1 && !!d.EndTime && new Date(d.EndTime).getTime() < now
        case 'permanent': return !d.EndTime
        default: return true
      }
    })
  }, [devices, filter])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-[#030305] text-[#EAEAEA]">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030305]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#7B61FF]" />
            <h1 className="text-xl font-semibold tracking-tight">设备授权查询系统</h1>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setProjectDialogOpen(true)}
              variant="outline"
              className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-full"
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              项目台账
            </Button>
            <input
              type="file"
              ref={fileRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileRef.current?.click()}
              variant="outline"
              className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              导入 Excel
            </Button>
            <Button onClick={handleAdd} className="bg-[#7B61FF] hover:bg-[#6a52e0] text-white rounded-full px-5">
              <Plus className="mr-2 h-4 w-4" />
              添加设备
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Dashboard onFilterChange={setFilter} activeFilter={filter} />

        <form onSubmit={handleSearch} className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7A7A]" />
            <Input
              placeholder="搜索设备名称、客户名称、项目编号、MAC 或 IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-[#EAEAEA] placeholder:text-[#7A7A7A] rounded-xl"
            />
          </div>
          <Button type="submit" variant="outline" className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-xl">
            搜索
          </Button>
        </form>

        <div className="liquid-glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#7A7A7A]">
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">设备名称</th>
                  <th className="px-6 py-4 font-medium">客户名称</th>
                  <th className="px-6 py-4 font-medium">项目编号</th>
                  <th className="px-6 py-4 font-medium">MAC 地址</th>
                  <th className="px-6 py-4 font-medium">IP 地址</th>
                  <th className="px-6 py-4 font-medium">授权起始</th>
                  <th className="px-6 py-4 font-medium">授权截止</th>
                  <th className="px-6 py-4 font-medium">状态</th>
                  <th className="px-6 py-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="px-6 py-12 text-center text-[#7A7A7A]">加载中...</td></tr>
                ) : filteredDevices.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-12 text-center text-[#7A7A7A]">暂无数据</td></tr>
                ) : (
                  filteredDevices.map((d) => {
                    const status = getLicenseStatus(d)
                    return (
                      <tr key={d.Id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-[#7A7A7A]">{d.Id}</td>
                        <td className="px-6 py-4 font-medium text-[#EAEAEA]">{d.DeviceName}</td>
                        <td className="px-6 py-4">{d.CustomerName || '-'}</td>
                        <td className="px-6 py-4 font-mono text-[#7B61FF]">{d.ProjectCode || '-'}</td>
                        <td className="px-6 py-4 font-mono text-[#7B61FF]">{d.MacAddress}</td>
                        <td className="px-6 py-4 font-mono text-[#FF8C42]">{d.IpAddress}</td>
                        <td className="px-6 py-4">{d.StartTime}</td>
                        <td className="px-6 py-4">
                          {d.EndTime ? d.EndTime : (
                            <span className="inline-flex items-center gap-1 text-cyan-400 font-medium">
                              <Infinity className="h-3.5 w-3.5" /> 永久授权
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.class}`}>
                            {status.label === '即将过期' && <AlertTriangle className="h-3 w-3" />}
                            {status.label === '已过期' && <Clock className="h-3 w-3" />}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(d)} className="p-2 rounded-lg hover:bg-white/10 text-[#7A7A7A] hover:text-[#EAEAEA] transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(d.Id)} className="p-2 rounded-lg hover:bg-white/10 text-[#7A7A7A] hover:text-red-400 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
              <span className="text-xs text-[#7A7A7A]">共 {total} 条，第 {page} / {totalPages} 页</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0A0A0C] border-white/10 text-[#EAEAEA] max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDevice ? '编辑设备授权' : '添加设备授权'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs text-[#7A7A7A] mb-1.5">设备名称</label>
              <Input required value={formData.DeviceName} onChange={(e) => setFormData({ ...formData, DeviceName: e.target.value })} className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">客户名称</label>
                <Input value={formData.CustomerName} onChange={(e) => setFormData({ ...formData, CustomerName: e.target.value })} className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl" />
              </div>
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">项目编号</label>
                <Input value={formData.ProjectCode} onChange={(e) => setFormData({ ...formData, ProjectCode: e.target.value })} className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">MAC 地址</label>
                <Input value={formData.MacAddress} onChange={(e) => setFormData({ ...formData, MacAddress: e.target.value })} className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl font-mono" />
              </div>
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">IP 地址</label>
                <Input value={formData.IpAddress} onChange={(e) => setFormData({ ...formData, IpAddress: e.target.value })} className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">授权起始时间</label>
                <Input type="datetime-local" required value={formData.StartTime} onChange={(e) => setFormData({ ...formData, StartTime: e.target.value })} className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">授权截止时间</label>
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={formData.EndTime ?? ''}
                    onChange={(e) => setFormData({ ...formData, EndTime: e.target.value || null })}
                    disabled={formData.EndTime === null}
                    className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl [color-scheme:dark] disabled:opacity-40"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={setPermanent}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  formData.EndTime === null
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-[#7A7A7A] hover:text-cyan-400 hover:border-cyan-500/30'
                }`}
              >
                <Infinity className="h-3.5 w-3.5" />
                {formData.EndTime === null ? '已设为永久授权' : '一键永久授权'}
              </button>
              {formData.EndTime === null && (
                <button type="button" onClick={() => setFormData({ ...formData, EndTime: '' })} className="text-xs text-[#7A7A7A] hover:text-[#EAEAEA] underline">
                  取消永久
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isEnabled"
                checked={formData.IsEnabled === 1}
                onChange={(e) => setFormData({ ...formData, IsEnabled: e.target.checked ? 1 : 0 })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#7B61FF]"
              />
              <label htmlFor="isEnabled" className="text-sm text-[#EAEAEA]">启用授权</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-xl">
                取消
              </Button>
              <Button type="submit" className="bg-[#7B61FF] hover:bg-[#6a52e0] text-white rounded-xl px-6">
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Ledger Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="bg-[#0A0A0C] border-white/10 text-[#EAEAEA] max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-[#7B61FF]" />
              项目台账管理
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Search + Import */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7A7A]" />
                <Input
                  placeholder="搜索项目编号或项目名称..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-[#EAEAEA] placeholder:text-[#7A7A7A] rounded-xl"
                />
              </div>
              <input
                type="file"
                ref={projectFileRef}
                accept=".csv,.xlsx,.xls"
                onChange={handleProjectFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => projectFileRef.current?.click()}
                variant="outline"
                className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-xl"
              >
                <Upload className="mr-2 h-4 w-4" />
                导入台账
              </Button>
            </div>

            {/* Add project form */}
            <form onSubmit={handleProjectSubmit} className="flex gap-3 items-end p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-1">
                <label className="block text-xs text-[#7A7A7A] mb-1.5">项目编号</label>
                <Input
                  required
                  value={projectForm.ProjectCode}
                  onChange={(e) => setProjectForm({ ...projectForm, ProjectCode: e.target.value })}
                  className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-[#7A7A7A] mb-1.5">项目名称</label>
                <Input
                  value={projectForm.ProjectName}
                  onChange={(e) => setProjectForm({ ...projectForm, ProjectName: e.target.value })}
                  className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl"
                />
              </div>
              <Button type="submit" className="bg-[#7B61FF] hover:bg-[#6a52e0] text-white rounded-xl">
                {editingProject ? '更新' : '添加'}
              </Button>
              {editingProject && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setEditingProject(null); setProjectForm({ ProjectCode: '', ProjectName: '' }) }}
                  className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>

            {/* Project list */}
            <div className="liquid-glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[#0A0A0C] z-10">
                    <tr className="border-b border-white/10 text-[#7A7A7A]">
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">项目编号</th>
                      <th className="px-4 py-3 font-medium">项目名称</th>
                      <th className="px-4 py-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-[#7A7A7A]">暂无项目，请导入或手动添加</td></tr>
                    ) : (
                      projects.map((p) => (
                        <tr key={p.Id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-[#7A7A7A]">{p.Id}</td>
                          <td className="px-4 py-3 font-mono text-[#7B61FF]">{p.ProjectCode}</td>
                          <td className="px-4 py-3">{p.ProjectName || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => { setEditingProject(p); setProjectForm({ ProjectCode: p.ProjectCode, ProjectName: p.ProjectName }) }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-[#7A7A7A] hover:text-[#EAEAEA]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleProjectDelete(p.Id)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-[#7A7A7A] hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Import Dialog */}
      <Dialog open={projectImportDialogOpen} onOpenChange={setProjectImportDialogOpen}>
        <DialogContent className="bg-[#0A0A0C] border-white/10 text-[#EAEAEA] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              导入项目台账 — 共 {projectImportRows.length} 条
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="liquid-glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[#0A0A0C] z-10">
                    <tr className="border-b border-white/10 text-[#7A7A7A]">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">项目编号</th>
                      <th className="px-4 py-3 font-medium">项目名称</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectImportRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="px-4 py-2 text-[#7A7A7A]">{i + 1}</td>
                        <td className="px-4 py-2 font-mono text-[#7B61FF]">
                          <Input
                            value={row.ProjectCode}
                            onChange={(e) => setProjectImportRows(prev => prev.map((r, idx) => idx === i ? { ...r, ProjectCode: e.target.value } : r))}
                            className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-lg text-xs py-1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={row.ProjectName}
                            onChange={(e) => setProjectImportRows(prev => prev.map((r, idx) => idx === i ? { ...r, ProjectName: e.target.value } : r))}
                            className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-lg text-xs py-1"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setProjectImportDialogOpen(false)} className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-xl">
                取消
              </Button>
              <Button
                onClick={handleProjectImportConfirm}
                disabled={projectImportLoading || projectImportRows.length === 0}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6"
              >
                {projectImportLoading ? '导入中...' : `确认导入 (${projectImportRows.length} 条)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="bg-[#0A0A0C] border-white/10 text-[#EAEAEA] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              导入确认 — 共 {importRows.length} 条记录
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Batch time settings */}
            <div className="flex gap-4 items-end p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-1">
                <label className="block text-xs text-[#7A7A7A] mb-1.5">批量设置起始时间</label>
                <Input
                  type="datetime-local"
                  onChange={(e) => setAllStartTime(e.target.value)}
                  className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl [color-scheme:dark]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-[#7A7A7A] mb-1.5">批量设置截止时间</label>
                <Input
                  type="datetime-local"
                  onChange={(e) => setAllEndTime(e.target.value)}
                  className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl [color-scheme:dark]"
                />
              </div>
              <Button
                type="button"
                onClick={() => setImportRows(prev => prev.map(r => ({ ...r, EndTime: null })))}
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 rounded-xl"
              >
                <Infinity className="h-4 w-4 mr-1" />
                全部永久
              </Button>
            </div>

            {/* Preview table */}
            <div className="liquid-glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#0A0A0C] z-10">
                    <tr className="border-b border-white/10 text-[#7A7A7A]">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">设备名称</th>
                      <th className="px-4 py-3 font-medium">客户名称</th>
                      <th className="px-4 py-3 font-medium">项目编号</th>
                      <th className="px-4 py-3 font-medium">MAC</th>
                      <th className="px-4 py-3 font-medium">IP</th>
                      <th className="px-4 py-3 font-medium">起始时间</th>
                      <th className="px-4 py-3 font-medium">截止时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="px-4 py-2 text-[#7A7A7A]">{i + 1}</td>
                        <td className="px-4 py-2">{row.DeviceName}</td>
                        <td className="px-4 py-2">{row.CustomerName || '-'}</td>
                        <td className="px-4 py-2 font-mono text-[#7B61FF]">{row.ProjectCode || '-'}</td>
                        <td className="px-4 py-2 font-mono">{row.MacAddress}</td>
                        <td className="px-4 py-2 font-mono">{row.IpAddress}</td>
                        <td className="px-4 py-2">
                          <Input
                            type="datetime-local"
                            value={row.StartTime}
                            onChange={(e) => updateImportRow(i, 'StartTime', e.target.value)}
                            className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-lg text-xs py-1 [color-scheme:dark]"
                          />
                        </td>
                        <td className="px-4 py-2">
                          {row.EndTime === null ? (
                            <span className="inline-flex items-center gap-1 text-cyan-400 text-xs">
                              <Infinity className="h-3 w-3" /> 永久
                            </span>
                          ) : (
                            <Input
                              type="datetime-local"
                              value={row.EndTime || ''}
                              onChange={(e) => updateImportRow(i, 'EndTime', e.target.value || null)}
                              className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-lg text-xs py-1 [color-scheme:dark]"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => updateImportRow(i, 'EndTime', row.EndTime === null ? '' : null)}
                            className="text-[10px] text-[#7A7A7A] hover:text-cyan-400 mt-1 underline"
                          >
                            {row.EndTime === null ? '取消永久' : '设为永久'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)} className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-xl">
                取消
              </Button>
              <Button
                onClick={handleImportConfirm}
                disabled={importLoading || importRows.length === 0}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6"
              >
                {importLoading ? '导入中...' : `确认导入 (${importRows.length} 条)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { DeviceLicense, DeviceFormData } from '@/types/device'

const API_BASE = '/api'

export default function Home() {
  const [devices, setDevices] = useState<DeviceLicense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<DeviceLicense | null>(null)
  const [formData, setFormData] = useState<DeviceFormData>({
    DeviceName: '',
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

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchDevices()
  }

  const handleAdd = () => {
    setEditingDevice(null)
    setFormData({
      DeviceName: '',
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
    const url = editingDevice
      ? `${API_BASE}/devices/${editingDevice.Id}`
      : `${API_BASE}/devices`
    const method = editingDevice ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    setDialogOpen(false)
    fetchDevices()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-[#030305] text-[#EAEAEA]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030305]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight">
            设备授权查询系统
          </h1>
          <Button
            onClick={handleAdd}
            className="bg-[#7B61FF] hover:bg-[#6a52e0] text-white rounded-full px-5"
          >
            <Plus className="mr-2 h-4 w-4" />
            添加设备
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7A7A]" />
            <Input
              placeholder="搜索设备名称、MAC 地址或 IP 地址..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-[#EAEAEA] placeholder:text-[#7A7A7A] rounded-xl"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-xl"
          >
            搜索
          </Button>
        </form>

        {/* Table */}
        <div className="liquid-glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#7A7A7A]">
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">设备名称</th>
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
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#7A7A7A]">
                      加载中...
                    </td>
                  </tr>
                ) : devices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#7A7A7A]">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  devices.map((d) => (
                    <tr
                      key={d.Id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-[#7A7A7A]">{d.Id}</td>
                      <td className="px-6 py-4 font-medium text-[#EAEAEA]">
                        {d.DeviceName}
                      </td>
                      <td className="px-6 py-4 font-mono text-[#7B61FF]">
                        {d.MacAddress}
                      </td>
                      <td className="px-6 py-4 font-mono text-[#FF8C42]">
                        {d.IpAddress}
                      </td>
                      <td className="px-6 py-4">{d.StartTime}</td>
                      <td className="px-6 py-4">{d.EndTime}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            d.IsEnabled
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {d.IsEnabled ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(d)}
                            className="p-2 rounded-lg hover:bg-white/10 text-[#7A7A7A] hover:text-[#EAEAEA] transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.Id)}
                            className="p-2 rounded-lg hover:bg-white/10 text-[#7A7A7A] hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
              <span className="text-xs text-[#7A7A7A]">
                共 {total} 条，第 {page} / {totalPages} 页
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0A0A0C] border-white/10 text-[#EAEAEA] max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? '编辑设备授权' : '添加设备授权'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs text-[#7A7A7A] mb-1.5">
                设备名称
              </label>
              <Input
                required
                value={formData.DeviceName}
                onChange={(e) =>
                  setFormData({ ...formData, DeviceName: e.target.value })
                }
                className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">
                  MAC 地址
                </label>
                <Input
                  value={formData.MacAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, MacAddress: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">
                  IP 地址
                </label>
                <Input
                  value={formData.IpAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, IpAddress: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">
                  授权起始时间
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.StartTime}
                  onChange={(e) =>
                    setFormData({ ...formData, StartTime: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#7A7A7A] mb-1.5">
                  授权截止时间
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.EndTime}
                  onChange={(e) =>
                    setFormData({ ...formData, EndTime: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-[#EAEAEA] rounded-xl [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isEnabled"
                checked={formData.IsEnabled === 1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    IsEnabled: e.target.checked ? 1 : 0,
                  })
                }
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#7B61FF]"
              />
              <label htmlFor="isEnabled" className="text-sm text-[#EAEAEA]">
                启用授权
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-white/10 text-[#EAEAEA] hover:bg-white/10 rounded-xl"
              >
                取消
              </Button>
              <Button
                type="submit"
                className="bg-[#7B61FF] hover:bg-[#6a52e0] text-white rounded-xl px-6"
              >
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

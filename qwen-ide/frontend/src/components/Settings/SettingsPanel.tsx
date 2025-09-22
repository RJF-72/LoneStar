import { useEffect, useMemo, useState } from 'react'

type ProgressItem = {
  id: string
  downloaded: number
  total: number
  speed: number
  eta: number
  status: string
  url: string
}

type CompressedModel = {
  id: string
  name: string
  version: string
  size: number
  compressedSize: number
  compressionRatio: number
  hash: string
  originalUrl: string
  downloadedAt: string
  architecture: string
  parameters: number
}

const fmtBytes = (n: number | undefined) => {
  const v = typeof n === 'number' ? n : 0
  if (v === 0) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let x = v
  while (x >= 1024 && i < u.length - 1) {
    x /= 1024
    i++
  }
  return `${x < 10 ? x.toFixed(2) : x.toFixed(1)} ${u[i]}`
}

const fmtSecs = (s: number | undefined) => {
  const v = Math.max(0, Math.floor(s || 0))
  const h = Math.floor(v / 3600)
  const m = Math.floor((v % 3600) / 60)
  const ss = v % 60
  if (h > 0) return `${h}h ${m}m ${ss}s`
  if (m > 0) return `${m}m ${ss}s`
  return `${ss}s`
}

const SettingsPanel = () => {
  const [url, setUrl] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [models, setModels] = useState<CompressedModel[]>([])

  const hasActiveJobs = useMemo(() => progress && progress.length > 0, [progress])

  const refreshProgress = async () => {
    try {
      const res = await fetch('/api/compression/progress')
      const data = await res.json()
      if (data?.success) setProgress(data.progress || [])
    } catch (e) {
      // ignore polling errors
    }
  }

  const refreshModels = async () => {
    try {
      const res = await fetch('/api/compression/models')
      const data = await res.json()
      if (data?.success) setModels(data.models || [])
    } catch (e) {
      // ignore polling errors
    }
  }

  const startCompression = async () => {
    setStarting(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/compression/download-compress?async=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to start compression')
      setMessage(`Started compression job: ${data.modelId}`)
      // immediate refresh to show job
      await refreshProgress()
    } catch (e: any) {
      setError(e?.message || 'Failed to start')
    } finally {
      setStarting(false)
    }
  }

  const cancelJob = async (modelId: string) => {
    try {
      await fetch(`/api/compression/cancel/${encodeURIComponent(modelId)}`, { method: 'POST' })
      await refreshProgress()
    } catch {}
  }

  const removeModel = async (modelId: string) => {
    try {
      await fetch(`/api/compression/models/${encodeURIComponent(modelId)}`, { method: 'DELETE' })
      await refreshModels()
    } catch {}
  }

  useEffect(() => {
    // initial load
    refreshProgress()
    refreshModels()
    // poll
    const t = setInterval(() => {
      refreshProgress()
      refreshModels()
    }, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="h-full bg-gray-800 p-4 overflow-auto">
      <h3 className="text-white font-semibold mb-4">Settings</h3>

      <div className="space-y-8">
        <section>
          <h4 className="text-gray-200 font-medium mb-2">Model Compression</h4>
          <p className="text-gray-400 text-sm mb-3">Start a streaming, no-decompress compression job for a model URL.</p>
          <div className="flex gap-2 items-center">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:9001/model.gguf"
              className="flex-1 rounded bg-gray-700 text-gray-100 px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              disabled={!url || starting}
              onClick={startCompression}
            >{starting ? 'Starting…' : 'Start'}</button>
          </div>
          {error && <div className="mt-2 text-red-400 text-sm">{error}</div>}
          {message && <div className="mt-2 text-green-400 text-sm">{message}</div>}
        </section>

        <section>
          <h4 className="text-gray-200 font-medium mb-2">Active Jobs</h4>
          {!hasActiveJobs && <div className="text-gray-500 text-sm">No active jobs.</div>}
          <div className="space-y-2">
            {progress.map((p) => {
              const pct = p.total > 0 ? Math.min(100, Math.round((p.downloaded / p.total) * 100)) : 0
              return (
                <div key={p.id} className="rounded border border-gray-700 bg-gray-750 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-gray-200 text-sm truncate" title={p.url}>{p.url}</div>
                    <div className="text-gray-400 text-xs">{p.status}</div>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded overflow-hidden mb-1">
                    <div className="h-2 bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-gray-400 text-xs flex gap-4 justify-between">
                    <div>{fmtBytes(p.downloaded)} / {fmtBytes(p.total)} ({pct}%)</div>
                    <div>{fmtBytes(p.speed)}/s • ETA {fmtSecs(p.eta)}</div>
                    <button className="text-red-400 hover:text-red-300" onClick={() => cancelJob(p.id)}>Cancel</button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <h4 className="text-gray-200 font-medium mb-2">Compressed Models</h4>
          {models.length === 0 && <div className="text-gray-500 text-sm">No compressed models yet.</div>}
          <div className="space-y-2">
            {models.map((m) => (
              <div key={m.id} className="rounded border border-gray-700 bg-gray-750 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-100 text-sm font-medium">{m.name}</div>
                    <div className="text-gray-400 text-xs truncate" title={m.originalUrl}>{m.originalUrl}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-sm">{m.compressionRatio.toFixed(1)}% saved</div>
                    <div className="text-gray-400 text-xs">{fmtBytes(m.size)} → {fmtBytes(m.compressedSize)}</div>
                  </div>
                </div>
                <div className="mt-2 text-gray-500 text-xs">Downloaded: {new Date(m.downloadedAt).toLocaleString()}</div>
                <div className="mt-2 flex gap-3 text-xs">
                  <button className="text-red-400 hover:text-red-300" onClick={() => removeModel(m.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default SettingsPanel
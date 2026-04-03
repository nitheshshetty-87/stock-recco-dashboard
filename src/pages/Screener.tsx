import { useEffect, useState, useCallback, useRef } from 'react'

interface Instrument {
  token: string
  symbol: string
  name: string
  exchange: string
  last_price: number
}

interface ApiResponse {
  total: number
  page: number
  limit: number
  results: Instrument[]
}

const EXCHANGES = ['ALL', 'NSE', 'BSE']
const PAGE_SIZE = 50

export default function Screener() {
  const [query, setQuery] = useState('')
  const [exchange, setExchange] = useState('ALL')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchInstruments = useCallback(async (q: string, exch: string, pg: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q, exchange: exch, page: String(pg), limit: String(PAGE_SIZE) })
      const res = await fetch(`/api/instruments?${params}`)
      if (!res.ok) throw new Error('Failed to fetch instruments')
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(0)
      fetchInstruments(query, exchange, 0)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, exchange, fetchInstruments])

  // Page changes (no debounce)
  useEffect(() => {
    fetchInstruments(query, exchange, page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Screener</h1>
          <p className="text-gray-400 text-sm mt-1">
            {data ? (
              <>Search across <span className="text-white font-medium">{data.total.toLocaleString()}</span> {exchange === 'ALL' ? 'NSE + BSE' : exchange} equities</>
            ) : 'Loading instruments...'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or symbol..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-gray-800/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Exchange filter */}
        <div className="flex gap-2">
          {EXCHANGES.map(ex => (
            <button
              key={ex}
              onClick={() => { setExchange(ex); setPage(0) }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                exchange === ex
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-800/60 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error} — make sure `npm run dev` is running (starts the API server)
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-3 text-left">Symbol</th>
                <th className="px-6 py-3 text-left">Company</th>
                <th className="px-6 py-3 text-center">Exchange</th>
                <th className="px-6 py-3 text-right">Last Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-48" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-12 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.results.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No stocks found for "{query}"
                  </td>
                </tr>
              ) : (
                data?.results.map(inst => (
                  <tr key={`${inst.exchange}:${inst.symbol}`} className="hover:bg-white/3 transition-colors cursor-pointer">
                    <td className="px-6 py-3 font-semibold text-white">{inst.symbol}</td>
                    <td className="px-6 py-3 text-gray-400 max-w-xs truncate">{inst.name}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        inst.exchange === 'NSE'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-purple-500/15 text-purple-400'
                      }`}>
                        {inst.exchange}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-300">
                      {inst.last_price > 0 ? `₹${inst.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} of {data.total.toLocaleString()} stocks
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700/60 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-xs text-gray-400">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700/60 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

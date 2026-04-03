import { useEffect, useState } from 'react'

interface Holding {
  tradingsymbol: string
  exchange: string
  quantity: number
  average_price: number
  last_price: number
  close_price: number
  pnl: number
  day_change: number
  day_change_percentage: number
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function fetchHoldings() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/holdings')
      if (!res.ok) throw new Error('Failed to fetch holdings')
      const data = await res.json()
      setHoldings(data)
      setLastUpdated(new Date())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHoldings() }, [])

  const totalInvested = holdings.reduce((s, h) => s + h.quantity * h.average_price, 0)
  const totalCurrent = holdings.reduce((s, h) => s + h.quantity * h.last_price, 0)
  const totalPnl = holdings.reduce((s, h) => s + h.pnl, 0)
  const totalPnlPct = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : '0.00'
  const dayPnl = holdings.reduce((s, h) => s + h.day_change * h.quantity, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-gray-400 text-sm mt-1">
            Live holdings from Zerodha
            {lastUpdated && (
              <span className="ml-2 text-gray-600">· Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <button
          onClick={fetchHoldings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error} — make sure the API server is running (`node server.js`)
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/60 border border-white/5 rounded-2xl px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Invested</p>
          <p className="text-xl font-bold text-white">
            {loading ? '—' : `₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </p>
        </div>
        <div className="bg-gray-800/60 border border-white/5 rounded-2xl px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Current Value</p>
          <p className="text-xl font-bold text-white">
            {loading ? '—' : `₹${totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </p>
        </div>
        <div className="bg-gray-800/60 border border-white/5 rounded-2xl px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Total P&L</p>
          {loading ? <p className="text-xl font-bold text-white">—</p> : (
            <>
              <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className={`text-xs mt-0.5 ${Number(totalPnlPct) >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                {Number(totalPnlPct) >= 0 ? '+' : ''}{totalPnlPct}%
              </p>
            </>
          )}
        </div>
        <div className="bg-gray-800/60 border border-white/5 rounded-2xl px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Day P&L</p>
          {loading ? <p className="text-xl font-bold text-white">—</p> : (
            <p className={`text-xl font-bold ${dayPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {dayPnl >= 0 ? '+' : ''}₹{dayPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          )}
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-gray-800/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Holdings</h2>
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Zerodha · {holdings.length} stocks
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-3 text-left">Symbol</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Avg Cost</th>
                <th className="px-6 py-3 text-right">LTP</th>
                <th className="px-6 py-3 text-right">Day Change</th>
                <th className="px-6 py-3 text-right">P&L</th>
                <th className="px-6 py-3 text-right">Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      Loading holdings...
                    </div>
                  </td>
                </tr>
              ) : holdings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500 text-sm">No holdings found.</td>
                </tr>
              ) : (
                holdings.map((h) => {
                  const ret = ((h.pnl / (h.quantity * h.average_price)) * 100).toFixed(2)
                  return (
                    <tr key={h.tradingsymbol} className="hover:bg-white/3 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{h.tradingsymbol}</p>
                        <p className="text-xs text-gray-500">{h.exchange}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">{h.quantity}</td>
                      <td className="px-6 py-4 text-right text-gray-300">₹{h.average_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right text-white font-medium">₹{h.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`px-6 py-4 text-right ${h.day_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <p>{h.day_change >= 0 ? '+' : ''}₹{h.day_change.toFixed(2)}</p>
                        <p className="text-xs opacity-70">{h.day_change_percentage >= 0 ? '+' : ''}{h.day_change_percentage.toFixed(2)}%</p>
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${Number(ret) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Number(ret) >= 0 ? '+' : ''}{ret}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

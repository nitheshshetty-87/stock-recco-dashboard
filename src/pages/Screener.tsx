import { useState } from 'react'

const sampleStocks = [
  { symbol: 'RELIANCE', sector: 'Energy', pe: 28.4, pb: 2.1, roe: 14.2, mcap: '19.8L Cr', week52h: 3024, week52l: 2220 },
  { symbol: 'INFY', sector: 'IT', pe: 22.1, pb: 5.8, roe: 31.5, mcap: '6.3L Cr', week52h: 1600, week52l: 1218 },
  { symbol: 'HDFCBANK', sector: 'Banking', pe: 18.6, pb: 2.4, roe: 16.8, mcap: '12.1L Cr', week52h: 1794, week52l: 1430 },
  { symbol: 'TCS', sector: 'IT', pe: 30.2, pb: 12.4, roe: 51.3, mcap: '14.5L Cr', week52h: 4255, week52l: 3311 },
  { symbol: 'TATAPOWER', sector: 'Power', pe: 41.0, pb: 4.2, roe: 10.1, mcap: '1.2L Cr', week52h: 494, week52l: 320 },
  { symbol: 'IRCTC', sector: 'Tourism', pe: 55.3, pb: 14.8, roe: 28.7, mcap: '0.57L Cr', week52h: 998, week52l: 666 },
]

const sectors = ['All', ...Array.from(new Set(sampleStocks.map((s) => s.sector)))]

export default function Screener() {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All')

  const filtered = sampleStocks.filter((s) => {
    const matchSearch = s.symbol.toLowerCase().includes(search.toLowerCase())
    const matchSector = sector === 'All' || s.sector === sector
    return matchSearch && matchSector
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Screener</h1>
        <p className="text-gray-400 text-sm mt-1">Filter and research stocks using key metrics.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 w-52"
        />
        <div className="flex gap-2 flex-wrap">
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                sector === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-800/60 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-3 text-left">Symbol</th>
                <th className="px-6 py-3 text-left">Sector</th>
                <th className="px-6 py-3 text-right">P/E</th>
                <th className="px-6 py-3 text-right">P/B</th>
                <th className="px-6 py-3 text-right">ROE %</th>
                <th className="px-6 py-3 text-right">Mkt Cap</th>
                <th className="px-6 py-3 text-right">52W H</th>
                <th className="px-6 py-3 text-right">52W L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500 text-sm">
                    No stocks match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.symbol} className="hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{s.symbol}</td>
                    <td className="px-6 py-4 text-gray-400">{s.sector}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{s.pe}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{s.pb}</td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-medium">{s.roe}%</td>
                    <td className="px-6 py-4 text-right text-gray-300">₹{s.mcap}</td>
                    <td className="px-6 py-4 text-right text-gray-300">₹{s.week52h}</td>
                    <td className="px-6 py-4 text-right text-gray-300">₹{s.week52l}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-6">
        Sample data shown. Connect a live data source to populate real-time metrics.
      </p>
    </div>
  )
}

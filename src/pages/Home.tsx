import { useAuth } from '../contexts/AuthContext'

const marketCards = [
  { label: 'NIFTY 50', value: '22,513', change: '+0.42%', up: true },
  { label: 'SENSEX', value: '74,119', change: '+0.38%', up: true },
  { label: 'BANK NIFTY', value: '48,204', change: '-0.15%', up: false },
  { label: 'MIDCAP 100', value: '51,872', change: '+0.91%', up: true },
]

export default function Home() {
  const { user } = useAuth()
  const firstName = user?.displayName?.split(' ')[0] ?? 'Investor'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Good morning, {firstName} 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Here's what's happening in the market today.</p>
      </div>

      {/* Market overview cards */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Market Overview</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {marketCards.map((card) => (
            <div key={card.label} className="bg-gray-800/60 border border-white/5 rounded-2xl px-5 py-4">
              <p className="text-xs text-gray-400 font-medium mb-1">{card.label}</p>
              <p className="text-xl font-bold text-white">{card.value}</p>
              <p className={`text-sm font-medium mt-1 ${card.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {card.change}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-gray-800/60 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Top Gainers</h3>
          <div className="space-y-3">
            {['TATAPOWER', 'ZOMATO', 'IRCTC'].map((s) => (
              <div key={s} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-300 font-medium">{s}</span>
                <span className="text-sm text-emerald-400 font-medium">+{(Math.random() * 5 + 1).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/60 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Top Losers</h3>
          <div className="space-y-3">
            {['ADANIENT', 'PAYTM', 'NYKAA'].map((s) => (
              <div key={s} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-300 font-medium">{s}</span>
                <span className="text-sm text-red-400 font-medium">-{(Math.random() * 4 + 0.5).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-gray-800/60 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-2">Research Notes</h3>
          <p className="text-gray-500 text-sm">No notes yet. Start adding research notes from the Screener.</p>
        </div>
      </div>
    </div>
  )
}

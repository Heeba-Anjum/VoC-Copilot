import React, { useState } from 'react'
import axios from 'axios'
import Papa from 'papaparse'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const API_BASE = 'https://voc-copilot.onrender.com'

function App() {
  const [inputText, setInputText] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

    const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const firstKey = result.meta.fields[0]
        const texts = result.data.map((row) => row[firstKey]).filter(Boolean)
        setInputText(texts.join('\n'))
      },
      error: () => setError('Could not parse CSV file'),
    })
  }

  
  const handleAnalyze = async () => {
    setError('')
    setResults(null)

    const texts = inputText.split('\n').map((t) => t.trim()).filter(Boolean)
    if (texts.length === 0) {
      setError('Please enter at least one feedback line')
      return
    }

    setLoading(true)
    try {
      const uploadRes = await axios.post(`${API_BASE}/api/feedback/upload`, { texts })
      const { batchId } = uploadRes.data
      const resultsRes = await axios.get(`${API_BASE}/api/feedback/${batchId}/results`)
      setResults(resultsRes.data)
    } catch (err) {
      setError('Something went wrong. Check the server logs.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const sentimentColor = (type) => {
    if (type === 'positive') return 'text-signal-green'
    if (type === 'negative') return 'text-red-400'
    return 'text-mutedInk'
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-signal-amber mb-3">
          AI Product · Voice of Customer
        </p>
        <h1 className="text-4xl font-display font-semibold mb-2">VOC Copilot</h1>
        <p className="text-mutedInk mb-8">
          Paste raw customer feedback below — one entry per line — and let AI cluster it into themes, tag sentiment, and rank priority.
        </p>

      
       <div className="flex items-center gap-3 mb-3">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium rounded-full border border-ink-border px-4 py-2 hover:border-signal-blue transition-colors">
            📁 Upload CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          {fileName && <span className="text-xs text-mutedInk font-mono">{fileName}</span>}
        </div>

        <textarea
          rows={8}
          className="w-full bg-ink-panel border border-ink-border rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-signal-blue transition-colors"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste feedback here, one per line — or upload a CSV above&#10;App keeps crashing during checkout&#10;Great delivery speed, very happy"
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-signal-amber text-ink px-6 py-3 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Feedback'}
        </button>

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

        {results && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6">
              Results — {results.totalCount} feedback items
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div
                className="bg-ink-panel border border-ink-border rounded-2xl p-5 flex flex-col"
                style={{ animation: 'fadeIn 0.6s ease-out 0.1s forwards', opacity: 0 }}
              >
                <p className="text-sm font-medium mb-3">Mentions by Theme</p>
                <ResponsiveContainer width="100%" height={Math.max(200, results.themes.length * 45)}>
                  <BarChart data={results.themes} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11, fill: '#8A93A6' }}
                      interval={0}
                    />
                    <Tooltip
                      contentStyle={{ background: '#141B2B', border: '1px solid #232C40', fontSize: 12 }}
                      cursor={{ fill: 'rgba(242,166,90,0.08)' }}
                    />
                    <Bar dataKey="count" fill="#F2A65A" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div
               className="bg-ink-panel border border-ink-border rounded-2xl p-5 flex flex-col"
                style={{ animation: 'fadeIn 0.6s ease-out 0.5s forwards', opacity: 0 }}
              >
                <p className="text-sm font-medium mb-3">Overall Sentiment</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Positive', value: results.themes.reduce((a, t) => a + t.sentimentSplit.positive, 0) },
                        { name: 'Negative', value: results.themes.reduce((a, t) => a + t.sentimentSplit.negative, 0) },
                        { name: 'Neutral', value: results.themes.reduce((a, t) => a + t.sentimentSplit.neutral, 0) },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      label
                    >
                      <Cell fill="#4FBF8B" />
                      <Cell fill="#EF4444" />
                      <Cell fill="#8A93A6" />
                    </Pie>
                    <Tooltip contentStyle={{ background: '#141B2B', border: '1px solid #232C40' }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#8A93A6' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              {results.themes.map((theme) => (
                <div
                  key={theme.name}
                  className="bg-ink-panel border border-ink-border rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{theme.name}</h3>
                    <span className="font-mono text-xs rounded-full px-3 py-1 bg-signal-amber/10 text-signal-amber">
                      Priority {theme.priorityScore}
                    </span>
                  </div>

                  <p className="text-sm text-mutedInk mb-3">{theme.count} mentions</p>

                  <div className="flex gap-4 text-xs font-mono mb-4">
                    <span className={sentimentColor('positive')}>
                      Positive: {theme.sentimentSplit.positive}
                    </span>
                    <span className={sentimentColor('negative')}>
                      Negative: {theme.sentimentSplit.negative}
                    </span>
                    <span className={sentimentColor('neutral')}>
                      Neutral: {theme.sentimentSplit.neutral}
                    </span>
                  </div>

                  <ul className="space-y-1.5">
                    {theme.sampleQuotes.map((q, i) => (
                      <li key={i} className="text-sm text-mutedInk flex gap-2">
                        <span className="text-signal-blue">"</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
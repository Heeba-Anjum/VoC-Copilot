global.crypto = require('crypto')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const Batch = require('./models/Batch')
const FeedbackEntry = require('./models/FeedbackEntry')
const { analyzeFeedback } = require('./services/geminiService')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection FAILED:', err.message))

app.post('/api/feedback/upload', async (req, res) => {
  try {
    const { texts } = req.body
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts array is required' })
    }

    const batch = await Batch.create({ totalCount: texts.length, status: 'processing' })

    // Analyze with Gemini
    const analyzed = await analyzeFeedback(texts)

    // Save entries with theme + sentiment
    const entries = analyzed.map((item) => ({
      batchId: batch._id,
      text: item.text,
      theme: item.theme,
      sentiment: item.sentiment,
    }))
    await FeedbackEntry.insertMany(entries)

    batch.status = 'completed'
    await batch.save()

    res.json({ batchId: batch._id, totalCount: texts.length })
  } catch (err) {
    console.error('Upload error:', err.message)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// Get aggregated results for a batch
app.get('/api/feedback/:batchId/results', async (req, res) => {
  try {
    const { batchId } = req.params
    const entries = await FeedbackEntry.find({ batchId })

    if (entries.length === 0) {
      return res.status(404).json({ error: 'No feedback found for this batch' })
    }

    // Group by theme
    const themeMap = {}
    entries.forEach((entry) => {
      const theme = entry.theme || 'Uncategorized'
      if (!themeMap[theme]) {
        themeMap[theme] = { name: theme, count: 0, sentiments: [], quotes: [] }
      }
      themeMap[theme].count += 1
      themeMap[theme].sentiments.push(entry.sentiment)
      if (themeMap[theme].quotes.length < 3) themeMap[theme].quotes.push(entry.text)
    })

    const total = entries.length
    const themes = Object.values(themeMap).map((t) => {
      const negativeCount = t.sentiments.filter((s) => s === 'negative').length
      const negativeRatio = negativeCount / t.count
      const priorityScore = (t.count / total) * 0.5 + negativeRatio * 0.5

      return {
        name: t.name,
        count: t.count,
        sentimentSplit: {
          positive: t.sentiments.filter((s) => s === 'positive').length,
          negative: negativeCount,
          neutral: t.sentiments.filter((s) => s === 'neutral').length,
        },
        sampleQuotes: t.quotes,
        priorityScore: Math.round(priorityScore * 100) / 100,
      }
    })

    themes.sort((a, b) => b.priorityScore - a.priorityScore)

    res.json({ batchId, totalCount: total, themes })
  } catch (err) {
    console.error('Results error:', err.message)
    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
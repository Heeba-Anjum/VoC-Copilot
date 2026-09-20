const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function analyzeFeedback(texts) {
//   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    //  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' })

//   const prompt = `
// You are analyzing customer feedback. For each feedback item below, return a JSON array where each object has:
// - "text": the original feedback text
// - "theme": a short 1-3 word theme label (e.g. "Pricing", "App Crashes", "Delivery Speed")
// - "sentiment": one of "positive", "negative", "neutral"

// Return ONLY valid JSON array, no markdown, no extra text.

// Feedback items:
// ${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}
// `

const prompt = `
You are analyzing customer feedback for a product team. For each feedback item below, return a JSON array where each object has:
- "text": the original feedback text
- "theme": a short 1-3 word theme label
- "sentiment": one of "positive", "negative", "neutral"

IMPORTANT: Use a small, consistent set of theme labels. Merge similar or overlapping concepts into ONE theme instead of creating near-duplicate labels. For example, use a single theme like "App Stability" instead of separately using "App Crashes," "App Performance," and "App Freezing" — pick ONE consistent name for the underlying issue and reuse it across all matching feedback.

Return ONLY valid JSON array, no markdown, no extra text.

Feedback items:
${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}
`

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  const cleaned = responseText.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

module.exports = { analyzeFeedback }
const mongoose = require('mongoose')

const feedbackEntrySchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  text: { type: String, required: true },
  theme: { type: String, default: null },
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral', null], default: null },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('FeedbackEntry', feedbackEntrySchema)
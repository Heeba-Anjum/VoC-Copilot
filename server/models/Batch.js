const mongoose = require('mongoose')

const batchSchema = new mongoose.Schema({
  totalCount: { type: Number, default: 0 },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Batch', batchSchema)
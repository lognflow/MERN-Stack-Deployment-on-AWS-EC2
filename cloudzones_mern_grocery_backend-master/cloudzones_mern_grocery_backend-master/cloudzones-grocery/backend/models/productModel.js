const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String, default: 'General' },
  unit: { type: String, default: '1 unit' },
  image: { type: String },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 120 },
  inStock: { type: Boolean, default: true },
  badge: { type: String },
  description: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);

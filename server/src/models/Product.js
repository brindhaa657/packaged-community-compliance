const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product or commodity name is required'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'Unknown / Unbranded',
    },
    category: {
      type: String,
      enum: [
        'Food',
        'Beverages',
        'Cosmetics',
        'Household Products',
        'Personal Care',
        'Packaged Goods',
        'Food & Beverages',
        'Other',
      ],
      default: 'Food',
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    packer: {
      type: String,
      trim: true,
    },
    importer: {
      type: String,
      trim: true,
    },
    countryOfOrigin: {
      type: String,
      default: 'India',
    },
    identifiers: {
      barcode: { type: String, trim: true },
      sku: { type: String, trim: true },
      fssaiLicense: { type: String, trim: true },
      ecomListingUrl: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);

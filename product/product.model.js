import mongoose from 'mongoose';

// set schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 55,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      maxlength: 55,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    quantity: {
      type: Number,
      min: 1,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    freeShipping: {
      type: Boolean,
      required: false,
      default: false,
    },
    adminId: {
      type: mongoose.ObjectId,
      required: true,
      ref: 'User',
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 100,
      maxlength: 1000,
    },
    image: {
      type: String,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.methods.toJSON = function () {
  let obj = this.toObject(); // it converts BSON to JSON
  delete obj.adminId;
  return obj;
};

// create model
const Product = mongoose.model('Product', productSchema);

export default Product;

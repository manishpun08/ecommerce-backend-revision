import mongoose from 'mongoose';

const orderProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.ObjectId,
    ref: 'products',
    required: true,
  },
  orderedQuantity: {
    type: Number,
    min: 1,
    required: true,
  },
});

// create schema
const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.ObjectId,
    required: true,
    ref: 'users',
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  paymentStatus: {
    type: String,
    required: true,
    enum: [
      'Completed',
      'Pending',
      'Expired',
      'Initiated',
      'Refunded',
      'User canceled',
      'Partially Refunded',
    ],
  },

  productList: {
    type: [orderProductSchema],
    required: true,
  },

  pidx: {
    type: String,
    required: true,
    trim: true,
  },
});

// create table
const Order = mongoose.model('Order', orderSchema);

export default Order;

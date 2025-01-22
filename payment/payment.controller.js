import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { isBuyer } from '../middleware/authentication.middleware.js';
import { generateRandomString } from '../utils/generate.random.string.js';
import Order from '../order/order.model.js';
import Cart from '../cart/cart.model.js';

const router = express.Router();

// Initiate payment
router.post('/payment/khalti/start', isBuyer, async (req, res) => {
  const { amount, productList } = req.body; // amount and product list from the request body
  const purchaseOrderId = generateRandomString(); // generate a unique order ID

  try {
    // Initiate payment with Khalti
    const khaltiResponse = await axios.post(
      'https://a.khalti.com/api/v2/epayment/initiate/',
      {
        return_url: 'http://localhost:3000/payment/', // Adjust return URL as needed
        website_url: 'http://localhost:3000/', // Adjust website URL as needed
        amount: Number(amount) * 100, // Convert amount to paisa
        purchase_order_id: purchaseOrderId,
        purchase_order_name: `item-${purchaseOrderId}`,
      },
      {
        headers: {
          Authorization: `key 14947c13cf064858b6628d9b95f28f05`, // Replace with an environment variable
          'Content-Type': 'application/json',
        },
      }
    );
    await Order.create({
      buyerId: req.loggedInUserId,
      totalAmount: amount,
      paymentStatus: 'Initiated',
      productList,
      pidx: khaltiResponse?.data?.pidx,
    });

    // Send success response to the client
    return res.status(200).send({
      message: 'Khalti Payment initiation successful',
      paymentDetails: khaltiResponse?.data,
    });
  } catch (error) {
    console.error('Error initiating Khalti payment:', error);
    return res.status(500).send({
      message: 'Payment initialization failed.',
      error: error.message,
    });
  }
});

// verify payment
router.post('/payment/khalti/verify', isBuyer, async (req, res) => {
  const { pidx } = req.body;

  try {
    // Verify payment status with Khalti
    const khaltiResponse = await axios.post(
      'https://a.khalti.com/api/v2/epayment/lookup/',
      { pidx },
      {
        headers: {
          Authorization: 'key 14947c13cf064858b6628d9b95f28f05',
          'Content-Type': 'application/json',
        },
      }
    );

    // Update order payment status in the database
    await Order.updateMany(
      { pidx },
      {
        $set: {
          paymentStatus: khaltiResponse?.data?.status,
        },
      }
    );

    // If payment status is not completed
    if (khaltiResponse?.data?.status !== 'Completed') {
      return res.status(400).send({ message: 'Khalti Payment status failed' });
    }

    // Delete cart items after successful transaction
    await Cart.deleteMany({ buyerId: req.loggedInUserId });

    return res.status(200).send({ message: 'Khalti payment is successful' });
  } catch (error) {
    console.error('Error verifying Khalti payment:', error);
    return res
      .status(400)
      .send({ message: 'Khalti Payment verification failed' });
  }
});

export default router;

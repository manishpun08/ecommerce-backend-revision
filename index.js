import express from 'express';
import cartRoutes from './cart/cart.controller.js';
import connectDB from './database-connection/db.connect.js';
import productRoutes from './product/product.controller.js';
import userRoutes from './user/user.controller.js';
import adminRoutes from './admin/admin.controller.js';
import paymentRoutes from './payment/payment.controller.js';

import cors from 'cors';

const app = express();

// to make app understand cors
app.use(cors());

// to make app understand json
app.use(express.json());

// connect database
await connectDB();

// register routes
app.use(userRoutes);
app.use(productRoutes);
app.use(cartRoutes);
app.use(adminRoutes);
app.use(paymentRoutes);

// network port and server
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});

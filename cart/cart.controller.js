import express from 'express';
import { isBuyer } from '../middleware/authentication.middleware.js';
import validateReqBody from '../middleware/validate.req.body.js';
import checkMongoIdValidity from '../utils/mongo.id.validity.js';
import { addCartItemValidationSchema } from './cart.validation.js';
import Product from '../product/product.model.js';
import Cart from './cart.model.js';
import validateMongoIdFromParams from '../middleware/validate.mongo.id.js';
import { updateCartReqBodyValidation } from '../middleware/cart.middleware.js';

const router = express.Router();

// * add item to cart
router.post(
  '/cart/add/item',
  isBuyer,
  validateReqBody(addCartItemValidationSchema),
  (req, res, next) => {
    // validate product id from req.body
    const { productId } = req.body;

    // check mongo id validity for productId
    const isValidId = checkMongoIdValidity(productId);

    // if not valid mongo id, throw error
    if (!isValidId) {
      return res.status(400).send({ message: 'Invalid mongo id.' });
    }

    // call next function
    next();
  },
  // create cart, add item to cart function
  async (req, res) => {
    // extract cart item from req.body
    const cartItem = req.body;

    // attach buyerId to cart item
    cartItem.buyerId = req.loggedInUserId;

    // check if the item is added to cart
    const cart = await Cart.findOne({
      productId: cartItem.productId,
      buyerId: req.loggedInUserId,
    });

    // if item is already in cart, throw error
    if (cart) {
      return res
        .status(409)
        .send({ message: 'Item is already added to cart.' });
    }
    // find product
    const product = await Product.findOne({ _id: cartItem.productId });

    // if ordered quantity is greater than product quantity, throw error
    if (cartItem?.orderedQuantity > product?.quantity) {
      return res.status(403).send({ message: 'Product is outnumbered.' });
    }
    // create cart
    await Cart.create(cartItem);

    // send response
    return res
      .status(200)
      .send({ message: 'Item is added to cart successfully.' });
  }
);

// * flush cart / remove all items from cart
router.delete('/cart/flush', isBuyer, async (req, res) => {
  // extract buyerId from req.loggedInUserId
  const buyerId = req.loggedInUserId;

  // remove all items from cart for that buyer
  await Cart.deleteMany({ buyerId });

  // send res
  return res.status(200).send({ message: 'Cart is cleared successfully.' });
});

// * remove single item from cart
//  id => cartId
router.delete(
  '/cart/item/delete/:id',
  isBuyer,
  validateMongoIdFromParams,
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;
    // remove that item from cart for logged in buyer
    await Cart.deleteOne({ productId: productId, buyerId: req.loggedInUserId });

    // send response
    return res
      .status(200)
      .send({ message: 'Item is removed from cart successfully.' });
  }
);

// cart count
router.get('/cart/item/count', isBuyer, async (req, res) => {
  const cartCount = await Cart.find({
    buyerId: req.loggedInUserId,
  }).countDocuments();
  return res.status(200).send({ message: 'success', itemCount: cartCount });
});

//get cart items
router.get('/cart/item/list', isBuyer, async (req, res) => {
  const cartItemList = await Cart.aggregate([
    {
      $match: {
        buyerId: req.loggedInUserId,
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'productDetails',
      },
    },
    {
      $project: {
        name: { $first: '$productDetails.name' },
        brand: { $first: '$productDetails.brand' },
        price: { $first: '$productDetails.price' },
        availableQuantity: { $first: '$productDetails.quantity' },
        category: { $first: '$productDetails.category' },
        image: { $first: '$productDetails.image' },
        sellerId: { $first: '$productDetails.sellerId' },
        productId: 1,
        orderedQuantity: 1,
        subTotal: {
          $multiply: [{ $first: '$productDetails.price' }, '$orderedQuantity'],
        },
      },
    },
  ]);

  // for sub total of all products
  let allProductSubTotal = 0;
  cartItemList.forEach((item) => {
    allProductSubTotal = allProductSubTotal + item.subTotal;
  });

  // for discount granting 5% discount in all products
  const discount = 0.05 * allProductSubTotal;

  // for grand total
  const Total = allProductSubTotal - discount;

  return res.status(200).send({
    message: 'success',
    cartItem: cartItemList,
    orderSummary: [
      { name: 'Sub total', value: allProductSubTotal.toFixed(2) },
      { name: 'discount', value: discount.toFixed(2) },
      { name: 'Total', value: Total.toFixed(2) },
    ],
    Total,
  });
});

// update cart quantity
router.put(
  '/cart/quantity/update/:id',
  isBuyer,
  validateMongoIdFromParams,
  updateCartReqBodyValidation,
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;

    // check if cart exists using product id and buyer id
    const cart = await Cart.findOne({ productId, buyerId: req.loggedInUserId });

    // if not cart, throw error
    if (!cart) {
      return res.status(404).send({ message: 'Product is not added to cart.' });
    }
    // extract values from req.body
    const actionData = req.body;

    // change in order quantity
    let newOrderedQuantity =
      actionData.action === 'inc'
        ? cart.orderedQuantity + 1
        : cart.orderedQuantity - 1;

    // find product
    const product = await Product.findOne({ _id: productId });

    // not exceeding more than available quantity and less then 1.
    const availableQuantity = product.quantity;
    if (newOrderedQuantity > availableQuantity) {
      return res.status(403).send({ message: 'Product is outnumbered.' });
    }

    if (newOrderedQuantity < 1) {
      return res.status(403).send({ message: 'Please remove item from cart.' });
    }

    // update cart
    await Cart.updateOne(
      { productId, buyerId: req.loggedInUserId },
      {
        $set: {
          orderedQuantity: newOrderedQuantity,
        },
      }
    );
    return res.status(200).send({ message: 'Cart is updated successfully.' });
  }
);

export default router;

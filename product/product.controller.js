import express from 'express';
import {
  isBuyer,
  isAdmin,
  isUser,
} from '../middleware/authentication.middleware.js';
import validateMongoIdFromParams from '../middleware/validate.mongo.id.js';
import validateReqBody from '../middleware/validate.req.body.js';
import checkMongoIdsEquality from '../utils/mongo.id.equality.js';
import Product from './product.model.js';
import {
  addProductValidationSchema,
  paginationDataValidationSchema,
} from './product.validation.js';

const router = express.Router();

// *add product
router.post(
  '/product/add',
  isAdmin,
  validateReqBody(addProductValidationSchema),
  async (req, res) => {
    // extract newProduct from req.body
    const newProduct = req.body;

    // add admin Id
    newProduct.adminId = req.loggedInUserId;

    // add product
    await Product.create(newProduct);

    // send res
    return res.status(201).send({ message: 'Product is added successfully.' });
  }
);

// * delete product
router.delete(
  '/product/delete/:id',
  isAdmin,
  validateMongoIdFromParams,
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;

    // find product using productId
    const product = await Product.findById(productId);

    // if not product found, throw error
    if (!product) {
      return res.status(404).send({ message: 'Product does not exist.' });
    }

    // check if loggedInUserId is owner of the product
    const isProductOwner = checkMongoIdsEquality(
      product.adminId,
      req.loggedInUserId
    );

    // if not owner, throw error
    if (!isProductOwner) {
      return res
        .status(403)
        .send({ message: 'You are not owner of this product.' });
    }

    // delete product
    await Product.findByIdAndDelete(productId);

    // send res
    res.status(200).send({ message: 'Product is deleted successfully.' });
  }
);

// * edit product
router.put(
  '/product/edit/:id',
  isAdmin,
  validateMongoIdFromParams,
  validateReqBody(addProductValidationSchema),
  async (req, res) => {
    // extract productId from req.params
    const productId = req.params.id;

    // find product using product id
    const product = await Product.findOne({ _id: productId });

    // if not product, throw error
    if (!product) {
      return res.status(404).send({ message: 'Product does not exist.' });
    }

    // check product ownership
    const isProductOwner = checkMongoIdsEquality(
      product.adminId,
      req.loggedInUserId
    );

    // if not product owner, throw error
    if (!isProductOwner) {
      return res
        .status(403)
        .send({ message: 'You are not owner of this product.' });
    }

    // extract new values from req.body
    const newValues = req.body;

    // edit product
    await Product.updateOne(
      { _id: productId },
      {
        $set: { ...newValues },
      }
    );

    // send res
    return res.status(200).send({ message: 'Product is edited successfully.' });
  }
);

// *get product details
router.get(
  '/product/detail/:id',
  isUser,
  validateMongoIdFromParams,
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;

    // find product using product id
    const product = await Product.findOne({ _id: productId });

    // if not product, throw error
    if (!product) {
      return res.status(404).send({ message: 'Product does not exist.' });
    }

    // send res
    return res.status(200).send({ message: 'success', productDetail: product });
  }
);

// * list product by admin
router.post(
  '/product/admin/list',
  isAdmin,
  // getting admin all products function
  async (req, res) => {
    const allProducts = await Product.find();

    // send all products data as response
    return res.status(200).send({
      message: 'success',
      allProducts,
    });
  }
);

// * list product by buyer
router.post(
  '/product/buyer/list',
  isBuyer,
  validateReqBody(paginationDataValidationSchema),
  async (req, res) => {
    // extract pagination data from req.body
    const { page, limit, searchText } = req.body;

    let match = {};

    if (searchText) {
      match.name = { $regex: searchText, $options: 'i' };
    }

    // calculate skip
    const skip = (page - 1) * limit;

    // find products
    const products = await Product.aggregate([
      {
        $match: match,
      },

      {
        $skip: skip,
      },
      { $limit: limit },

      {
        $project: {
          name: 1,
          brand: 1,
          price: 1,
          image: 1,
          description: { $substr: ['$description', 0, 150] },
        },
      },
    ]);
    const totalProducts = await Product.find(match).countDocuments();
    const numberOfPages = Math.ceil(totalProducts / limit);

    // send res
    return res
      .status(200)
      .send({ message: 'success', productList: products, numberOfPages });
  }
);
export default router;

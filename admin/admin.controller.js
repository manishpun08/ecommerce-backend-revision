import express from 'express';
import { isAdmin } from '../middleware/authentication.middleware.js';
import Product from '../product/product.model.js';
import User from '../user/user.model.js';
import Category from '../product/product.category.model.js';
import checkMongoIdValidity from '../utils/mongo.id.validity.js';
import validateMongoIdFromParams from '../middleware/validate.mongo.id.js';

const router = express.Router();

// get admin dashboard
router.get(
  '/admin/dashboard',

  // authenticating admin
  isAdmin,

  // getting admin dashboard function
  async (_, res) => {
    const totalProducts = await Product.countDocuments();
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const latest4Products = await Product.find().sort({ _id: -1 }).limit(4);
    const categProductsCount = await Product.find().then((products) =>
      products.reduce((acc, cur) => {
        const categEntryIndex = acc.findIndex((c) => c.name == cur.category);
        if (categEntryIndex == -1) {
          acc.push({ name: cur.category, count: 1 });
        } else {
          acc[categEntryIndex].count++;
        }

        return acc;
      }, [])
    );

    // send dashboard data as response
    return res.status(200).send({
      message: 'success',
      dashboard: {
        totalProducts,
        totalBuyers,
        latest4Products,
        categProductsCount,
      },
    });
  }
);

// add new categories by admin
router.post('/add/categories', async (req, res) => {
  const category = new Category({
    title: req.body.title,
  });
  await category.save();
  return res
    .status(201)
    .send({ message: 'Category is added successfully.', category });
});

// get category of products
router.get('/get/categories', async (req, res) => {
  const categories = await Category.find({});
  return res
    .status(200)
    .send({ message: 'Categories is displayed successfully.', categories });
});

// delete categories by admin
router.delete(
  '/delete/categories/:id',
  validateMongoIdFromParams,
  async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    return res.status(200).send({ message: 'success' });
  }
);

// get category list
router.get('/product/category/list', async (req, res) => {
  const categoryList = await Product.aggregate([
    { $match: {} },

    {
      $sort: {
        category: 1,
      },
    },

    {
      $project: {
        category: 1,
        image: 1,
        name: 1,
        brand: 1,
        price: 1,
        description: { $substr: ['$description', 0, 300] },
      },
    },
  ]);

  // A  New Set is a collection of unique values, meaning it cannot contain duplicate elements.
  const uniqueIdsSet = new Set();
  // This line creates a new array
  const uniqueCategories = categoryList.filter((item) => {
    // .has checks if the uniqueIdsSet
    if (!uniqueIdsSet.has(item.category)) {
      // If the category is unique, this line adds it to the uniqueIdsSet
      uniqueIdsSet.add(item.category);
      return true;
    }
    return false;
  });

  return res.status(200).send({ message: 'Success', uniqueCategories });
});

// get product by category
router.get(
  '/product/category/:id',
  validateMongoIdFromParams,
  async (req, res) => {
    // extract product id from req.params
    const productId = req.params.id;
    // find product
    const product = await Product.findById(productId);
    // if not product throw error
    if (!product) {
      return res.status(404).send({ message: 'Product does not exist.' });
    }
    const productInSameCategory = await Product.find({
      category: product.category,
    });

    res.status(200).send({ message: 'Success', productInSameCategory });
  }
);

export default router;

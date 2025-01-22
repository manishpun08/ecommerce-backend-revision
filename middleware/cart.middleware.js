import { updateCartQuantityValidationSchema } from '../cart/cart.validation.js';

export const updateCartReqBodyValidation = async (req, res, next) => {
  // extract cart item from req.body
  const cartItem = req.body;

  // validate cart item
  try {
    const validatedData = await updateCartQuantityValidationSchema.validate(
      cartItem
    );
    req.body = validatedData;
    next();
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
};

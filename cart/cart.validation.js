import Yup from 'yup';

export const addCartItemValidationSchema = Yup.object({
  productId: Yup.string().required().trim(),
  orderedQuantity: Yup.number().min(1).required(),
});

export const updateCartQuantityValidationSchema = Yup.object({
  action: Yup.string().required().oneOf(['inc', 'dec']),
});

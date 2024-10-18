import Joi from 'joi';

// 1. 🧑‍💼 **User Account Management**
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const passwordResetSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

export const passwordResetSchemaToken = Joi.object({
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

export const NameChange = Joi.object({
  firstName: Joi.string().min(1),
  lastName: Joi.string().min(1),
}).or('firstName', 'lastName');

export const enableAndRemoveEmailVerify = Joi.object({
  otp: Joi.string().length(6).required(),
});

export const delUserSchema = Joi.object({
  otp: Joi.string().length(6).required(),
});

export const emailVerifySchema = Joi.object({
  email: Joi.string().email().required(),
});

export const twoFaVerifySchema = Joi.object({
  email: Joi.string().email(),
  token: Joi.string().length(6).required(),
});

export const generateTotp = Joi.object({
  otp: Joi.string().length(6).required(),
});

export const removeTotpUsingTotpSchema = Joi.object({
  token: Joi.string().length(6).required(),
});

export const removeTotpUsingEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  otp: Joi.string().length(6).required(),
});

// 2. 📚 **Product Catalog**
export const createProductSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  price: Joi.number().positive().required(),
  categoryId: Joi.string().guid().required(),
  stock: Joi.number().integer().min(0).required(),
});

export const updateProductSchema = createProductSchema.keys({
  id: Joi.string().guid().required(),
});

export const productSearchSchema = Joi.object({
  keyword: Joi.string().optional(),
  categoryId: Joi.string().guid().optional(),
  page: Joi.number().integer().min(0).default(1),
  limit: Joi.number().integer().min(0).default(10),
});

// 3. 🛒 **Shopping Cart**
export const cartItemSchema = Joi.object({
  productId: Joi.string().guid().required(),
  quantity: Joi.number().integer().positive().required(),
});

// 4. 💸 **Checkout & Orders**
export const orderSchema = Joi.object({
  paymentMethod: Joi.string().valid('credit_card', 'paypal').required(),
  address: Joi.string().min(10).required(),
});

export const orderIdSchema = Joi.object({
  orderId: Joi.string().guid().required(),
});

// 5. 💳 **Payment Gateway**
export const paymentSchema = Joi.object({
  token: Joi.string().min(1).required(),
});

// 6. ⭐ **Product Reviews and Ratings**
export const reviewSchema = Joi.object({
  productId: Joi.string().guid().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().optional(),
});

// 7. 📝 **Wishlist Management**
export const wishlistSchema = Joi.object({
  productId: Joi.string().guid().required(),
});

// 8. 📦 **Inventory Management (Admin)**
export const updateStockSchema = Joi.object({
  productId: Joi.string().guid().required(),
  stock: Joi.number().integer().min(0).required(),
});

// 9. 🛠️ **Admin Dashboard**
export const userIdSchema = Joi.object({
  id: Joi.string().guid().required(),
});

// 10. 🔐 **Security and Authentication**
export const twoFASchema = Joi.object({
  code: Joi.string().length(6).required(),
});

// 11. 📧 **Newsletter Subscription**
export const newsletterSchema = Joi.object({
  email: Joi.string().email().required(),
});

// 12. 🎁 **Discounts and Coupons**
export const discountSchema = Joi.object({
  code: Joi.string().min(1).required(),
});

// 13. 🚚 **Shipping and Delivery**
export const shippingSchema = Joi.object({
  address: Joi.string().min(10).required(),
});

// 14. 📊 **Analytics and Reporting (Admin)**
export const analyticsSchema = Joi.object({
  type: Joi.string().valid('sales', 'products').required(),
});

// 15. 🌍 **Multi-language and Currency Support**
export const languageSchema = Joi.object({
  language: Joi.string().min(2).required(),
});

// 16. 🔄 **Return and Refund Management**
export const returnRequestSchema = Joi.object({
  orderId: Joi.string().guid().required(),
  reason: Joi.string().min(10).required(),
});

// 17. 🤖 **AI Product Suggestions**
export const aiRecommendationSchema = Joi.object({
  userId: Joi.string().guid().required(),
});

// 18. 📝 **Blog and Content Management**
export const blogPostSchema = Joi.object({
  title: Joi.string().min(1).required(),
  content: Joi.string().min(10).required(),
});

// Exporting all schemas as a single object
export const validationSchemas = {
  register: registerSchema,
  login: loginSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema,
  createProduct: createProductSchema,
  updateProduct: updateProductSchema,
  productSearch: productSearchSchema,
  cartItem: cartItemSchema,
  order: orderSchema,
  orderId: orderIdSchema,
  payment: paymentSchema,
  review: reviewSchema,
  wishlist: wishlistSchema,
  updateStock: updateStockSchema,
  userId: userIdSchema,
  twoFA: twoFASchema,
  newsletter: newsletterSchema,
  discount: discountSchema,
  shipping: shippingSchema,
  analytics: analyticsSchema,
  language: languageSchema,
  returnRequest: returnRequestSchema,
  aiRecommendation: aiRecommendationSchema,
  blogPost: blogPostSchema,
};

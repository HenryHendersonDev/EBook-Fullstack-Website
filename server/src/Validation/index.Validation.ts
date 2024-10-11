import { z } from 'zod';

// 1. 🧑‍💼 **User Account Management**
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetSchema = z.object({
  otp: z.string().length(6),
  newPassword: z.string().min(6),
});

// 2. 📚 **Product Catalog**
export const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
  stock: z.number().int().nonnegative(),
});

export const updateProductSchema = createProductSchema.extend({
  id: z.string().uuid(),
});

export const productSearchSchema = z.object({
  keyword: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  page: z.number().int().nonnegative().default(1),
  limit: z.number().int().nonnegative().default(10),
});

// 3. 🛒 **Shopping Cart**
export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

// 4. 💸 **Checkout & Orders**
export const orderSchema = z.object({
  paymentMethod: z.enum(['credit_card', 'paypal']),
  address: z.string().min(10),
});

export const orderIdSchema = z.object({
  orderId: z.string().uuid(),
});

// 5. 💳 **Payment Gateway**
export const paymentSchema = z.object({
  token: z.string().min(1),
});

// 6. ⭐ **Product Reviews and Ratings**
export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// 7. 📝 **Wishlist Management**
export const wishlistSchema = z.object({
  productId: z.string().uuid(),
});

// 8. 📦 **Inventory Management (Admin)**
export const updateStockSchema = z.object({
  productId: z.string().uuid(),
  stock: z.number().int().nonnegative(),
});

// 9. 🛠️ **Admin Dashboard**
export const userIdSchema = z.object({
  id: z.string().uuid(),
});

// 10. 🔐 **Security and Authentication**
export const twoFASchema = z.object({
  code: z.string().length(6),
});

// 11. 📧 **Newsletter Subscription**
export const newsletterSchema = z.object({
  email: z.string().email(),
});

// 12. 🎁 **Discounts and Coupons**
export const discountSchema = z.object({
  code: z.string().min(1),
});

// 13. 🚚 **Shipping and Delivery**
export const shippingSchema = z.object({
  address: z.string().min(10),
});

// 14. 📊 **Analytics and Reporting (Admin)**
export const analyticsSchema = z.object({
  type: z.enum(['sales', 'products']),
});

// 15. 🌍 **Multi-language and Currency Support**
export const languageSchema = z.object({
  language: z.string().min(2),
});

// 16. 🔄 **Return and Refund Management**
export const returnRequestSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(10),
});

// 17. 🤖 **AI Product Suggestions**
export const aiRecommendationSchema = z.object({
  userId: z.string().uuid(),
});

// 18. 📝 **Blog and Content Management**
export const blogPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(10),
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

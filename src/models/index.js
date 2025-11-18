import sequelize from "../config/database.js";

import User from "./user.model.js";
import Role from "./role.model.js";
import UserRole from "./userRole.model.js";
import Category from "./category.model.js";
import Product from "./product.model.js";
import ProductPhoto from "./productPhoto.model.js";
import Favorite from "./favorite.model.js";
import Conversation from "./conversation.model.js";
import Message from "./message.model.js";
import Notification from "./notification.model.js";
import NotificationType from "./notificationType.model.js";
import Incidence from "./incidence.model.js";
import Appeal from "./appeals.model.js";
import Report from "./reports.models.js";
import SellerRating from "./sellerRating.model.js";

/* ==========================
   RELATIONS
   ========================== */

UserRole.belongsTo(Role, { foreignKey: "roleId", as: "Role" });

// Users ↔ Roles (Many-to-Many)
User.belongsToMany(Role, { through: UserRole, foreignKey: "userId", otherKey: "roleId" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId", otherKey: "userId" });

// Users ↔ Products (One-to-Many)
User.hasMany(Product, { foreignKey: "sellerId" });
Product.belongsTo(User, { foreignKey: "sellerId" });

// Categories self-reference
Category.hasMany(Category, { as: "subcategories", foreignKey: "parentCategoryId" });
Category.belongsTo(Category, { as: "parent", foreignKey: "parentCategoryId" });

// Categories ↔ Products (One-to-Many)
Category.hasMany(Product, { foreignKey: "categoryId" });
Product.belongsTo(Category, { foreignKey: "categoryId" });

// Products ↔ ProductPhotos (One-to-Many)
Product.hasMany(ProductPhoto, { foreignKey: "productId" });
ProductPhoto.belongsTo(Product, { foreignKey: "productId" });

// Users ↔ Products (Favorites Many-to-Many)
User.belongsToMany(Product, { through: Favorite, foreignKey: "userId", otherKey: "productId", as: "favoriteProducts" });
Product.belongsToMany(User, { through: Favorite, foreignKey: "productId", otherKey: "userId", as: "usersWhoFavorited" });

// Favorite ↔ Product (para poder hacer include directo)
Favorite.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(Favorite, { foreignKey: "productId" });

// Favorite ↔ User (para poder hacer include directo)
Favorite.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Favorite, { foreignKey: "userId" });

// Conversations ↔ Products
Product.hasMany(Conversation, { foreignKey: "productId" });
Conversation.belongsTo(Product, { foreignKey: "productId" });

// Conversations ↔ Users
User.hasMany(Conversation, { as: "purchases", foreignKey: "buyerId" });
User.hasMany(Conversation, { as: "sales", foreignKey: "sellerId" });
Conversation.belongsTo(User, { as: "buyer", foreignKey: "buyerId" });
Conversation.belongsTo(User, { as: "seller", foreignKey: "sellerId" });

// Conversations ↔ Messages
Conversation.hasMany(Message, { foreignKey: "conversationId" });
Message.belongsTo(Conversation, { foreignKey: "conversationId" });

// Users ↔ Messages
User.hasMany(Message, { foreignKey: "senderId" });
Message.belongsTo(User, { foreignKey: "senderId" });

// Users ↔ Notifications
User.hasMany(Notification, { foreignKey: "userId" });
Notification.belongsTo(User, { foreignKey: "userId" });
//User ↔ Incidences

// Users ↔ SellerRatings (calificaciones de vendedores)
User.hasMany(SellerRating, { foreignKey: "sellerId", as: "receivedRatings" });
User.hasMany(SellerRating, { foreignKey: "raterId", as: "givenRatings" });
SellerRating.belongsTo(User, { foreignKey: "sellerId", as: "seller" });
SellerRating.belongsTo(User, { foreignKey: "raterId", as: "rater" });
User.hasMany(Incidence, { foreignKey: "userId" });
Incidence.belongsTo(User, { foreignKey: "userId" });
//Product ↔ Incidences
Product.hasMany(Incidence, { foreignKey: "productId" });
Incidence.belongsTo(Product, { foreignKey: "productId" });
//Incidences ↔ Appeals
Incidence.hasMany(Appeal, { foreignKey: "incidenceId" });
Appeal.belongsTo(Incidence, { foreignKey: "incidenceId" });

//Users ↔ Reports
User.hasMany(Report, { foreignKey: "userId" });
Report.belongsTo(User, { foreignKey: "userId" });
//Products ↔ Reports
Product.hasMany(Report, { foreignKey: "productId" });
Report.belongsTo(Product, { foreignKey: "productId" });

// NotificationTypes ↔ Notifications
NotificationType.hasMany(Notification, { foreignKey: "typeId" });
Notification.belongsTo(NotificationType, { foreignKey: "typeId" });

/* ==========================
   EXPORT MODELS
   ========================== */
export {
  sequelize,
  User,
  Role,
  UserRole,
  Category,
  Product,
  ProductPhoto,
  Favorite,
  Conversation,
  Message,
  Notification,
  NotificationType,
  Incidence,
  Appeal,
  Report
   , SellerRating
};

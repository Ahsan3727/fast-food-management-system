/**
 * Seed script — creates an admin user, a rider user, sample categories
 * and menu items. Run once after first deployment.
 *
 * Usage: node seed.js
 *   (from apps/api directory with .env present)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import argon2 from 'argon2';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }

await mongoose.connect(MONGO_URI);
console.log('✅ Connected to MongoDB:', mongoose.connection.name);

// ── Schemas ─────────────────────────────────────
const UserSchema = new mongoose.Schema({ name: String, phone: String, email: String, password: String, role: String }, { timestamps: true });
const CategorySchema = new mongoose.Schema({ name: String, icon: String, sortOrder: Number, isActive: { type: Boolean, default: true } }, { timestamps: true });
const MenuItemSchema = new mongoose.Schema({ name: String, description: String, categoryId: String, basePrice: Number, emoji: String, isAvailable: { type: Boolean, default: true }, sizes: Array, addOns: Array }, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

// ── Users ────────────────────────────────────────
const adminPass = await argon2.hash('admin123456');
const riderPass = await argon2.hash('rider123456');
const custPass  = await argon2.hash('customer1234');

const [admin, rider, customer] = await Promise.all([
  User.findOneAndUpdate({ phone: '+923001111111' }, { name: 'Admin', phone: '+923001111111', password: adminPass, role: 'admin' }, { upsert: true, new: true }),
  User.findOneAndUpdate({ phone: '+923002222222' }, { name: 'Test Rider', phone: '+923002222222', password: riderPass, role: 'rider' }, { upsert: true, new: true }),
  User.findOneAndUpdate({ phone: '+923003333333' }, { name: 'Test Customer', phone: '+923003333333', password: custPass, role: 'customer' }, { upsert: true, new: true }),
]);

console.log('👤 Admin:', admin.phone, '— password: admin123456');
console.log('🏍️  Rider:', rider.phone, '— password: rider123456');
console.log('📱 Customer:', customer.phone, '— password: customer1234');

// ── Categories ───────────────────────────────────
const cats = await Promise.all([
  Category.findOneAndUpdate({ name: 'Burgers' }, { name: 'Burgers', icon: '🍔', sortOrder: 1 }, { upsert: true, new: true }),
  Category.findOneAndUpdate({ name: 'Pizza' },   { name: 'Pizza',   icon: '🍕', sortOrder: 2 }, { upsert: true, new: true }),
  Category.findOneAndUpdate({ name: 'Drinks' },  { name: 'Drinks',  icon: '🥤', sortOrder: 3 }, { upsert: true, new: true }),
  Category.findOneAndUpdate({ name: 'Desserts' }, { name: 'Desserts', icon: '🍰', sortOrder: 4 }, { upsert: true, new: true }),
]);

console.log('📂 Categories seeded:', cats.map(c => c.name).join(', '));

// ── Menu Items (prices in paisa) ─────────────────
const burgerId   = cats[0]._id.toString();
const pizzaId    = cats[1]._id.toString();
const drinkId    = cats[2]._id.toString();
const dessertId  = cats[3]._id.toString();

const items = [
  { name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, special sauce', categoryId: burgerId, basePrice: 35000, emoji: '🍔', sizes: [{ label: 'Regular', price: 35000 }, { label: 'Double', price: 55000 }], addOns: [{ label: 'Extra Cheese', price: 5000 }, { label: 'Bacon', price: 8000 }] },
  { name: 'Zinger Burger', description: 'Crispy chicken fillet with jalapeños', categoryId: burgerId, basePrice: 40000, emoji: '🍗' },
  { name: 'Margherita Pizza', description: 'Classic tomato base with mozzarella', categoryId: pizzaId, basePrice: 65000, emoji: '🍕', sizes: [{ label: 'Small', price: 65000 }, { label: 'Large', price: 95000 }] },
  { name: 'BBQ Chicken Pizza', description: 'BBQ sauce, chicken, red onion', categoryId: pizzaId, basePrice: 80000, emoji: '🍕' },
  { name: 'Pepsi 500ml', description: 'Chilled carbonated drink', categoryId: drinkId, basePrice: 8000, emoji: '🥤' },
  { name: 'Mango Milkshake', description: 'Fresh mango blended with milk', categoryId: drinkId, basePrice: 15000, emoji: '🥭' },
  { name: 'Chocolate Brownie', description: 'Warm fudge brownie with ice cream', categoryId: dessertId, basePrice: 20000, emoji: '🍫' },
];

for (const item of items) {
  await MenuItem.findOneAndUpdate({ name: item.name }, item, { upsert: true, new: true });
}
console.log('🍽️  Menu items seeded:', items.map(i => i.name).join(', '));

await mongoose.disconnect();
console.log('✅ Seed complete!');

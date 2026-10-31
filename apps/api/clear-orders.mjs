/**
 * Clear Orders Script
 * Deletes all orders from the database and resets the order sequence counter.
 *
 * Usage: node clear-orders.mjs
 *   (run from apps/api directory or repo root)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

async function clearOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', mongoose.connection.name);

    const db = mongoose.connection.db;

    // 1. Delete all documents in 'orders' collection
    const ordersCol = db.collection('orders');
    const deleteResult = await ordersCol.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} orders from the database.`);

    // 2. Reset order numbering sequence back to 1000
    const counterCol = db.collection('order_counters');
    await counterCol.deleteMany({});
    console.log('🔄 Reset order counter sequence (next order will start at #1001).');

    // 3. Optional: Reset rider deliveries and cash metrics back to 0
    const ridersCol = db.collection('riders');
    await ridersCol.updateMany({}, { $set: { totalDeliveries: 0, unsettledCashPaisa: 0 } });
    console.log('🏍️  Reset rider delivery metrics.');

    console.log('✨ All orders have been successfully cleared!');
  } catch (err) {
    console.error('❌ Error clearing orders:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

clearOrders();

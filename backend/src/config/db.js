import mongoose from 'mongoose';

let connectionPromise = null;

const connectDB = async () => {
  if (connectionPromise) return connectionPromise;
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[db] MONGO_URI is not set. Copy backend/.env.example to backend/.env and edit it.');
    throw new Error('MONGO_URI not set');
  }
  connectionPromise = mongoose
    .connect(uri, { serverSelectionTimeoutMS: 8000 })
    .then((conn) => {
      console.log(`[db] MongoDB connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((err) => {
      connectionPromise = null;
      console.error('[db] Connection error:', err.message);
      throw err;
    });
  return connectionPromise;
};

export default connectDB;

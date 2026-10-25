import mongoose from 'mongoose';

export interface MongoConnectOptions {
  readonly uri: string;
  readonly serverSelectionTimeoutMS?: number;
  readonly appName?: string;
}

/**
 * Opens the shared Mongoose connection. Credentials come from the URI supplied via
 * environment variables — nothing is hard-coded here.
 */
export async function connectMongo(options: MongoConnectOptions): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  return mongoose.connect(options.uri, {
    serverSelectionTimeoutMS: options.serverSelectionTimeoutMS ?? 5_000,
    appName: options.appName ?? 'impactalign-api',
    autoIndex: process.env['NODE_ENV'] !== 'production',
    // Reject operators in query filters that were built from untrusted input.
    sanitizeFilter: true,
  });
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

/** Round-trips to the server; throws when the database is unreachable. */
export async function pingMongo(): Promise<void> {
  const db = mongoose.connection.db;
  if (mongoose.connection.readyState !== 1 || !db) {
    throw new Error('MongoDB connection is not ready');
  }
  await db.admin().ping();
}

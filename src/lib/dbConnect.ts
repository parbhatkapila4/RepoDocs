import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string | undefined;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

declare global {
  var mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

let cached = global.mongooseConn;
if (!cached) {
  cached = global.mongooseConn = { conn: null, promise: null };
}

async function dbConnect(): Promise<void> {
  if (cached!.conn) {
    return;
  }

  if (!cached!.promise) {
    mongoose.set("strictQuery", true);
    cached!.promise = mongoose.connect(MONGODB_URI as string).then((m) => m);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (error) {
    cached!.promise = null;
    throw error;
  }
}

export default dbConnect;

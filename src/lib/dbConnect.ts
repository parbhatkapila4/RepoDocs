import mongoose from "mongoose";

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    console.log("Already Connected to Database");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || " ", {});

    connection.isConnected = db.connections[0].readyState;

    console.log("Database is successfully connected");
  } catch (error) {
    console.log("Database connection is failed", error);
    process.exit(1);
  }
}

export default dbConnect;

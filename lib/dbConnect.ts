// lib/dbConnect.tsx

import _mongoose, { connect } from "mongoose";
import { getCustomClaimsFromToken } from "./auth-utils";

declare global {
  var mongoose: {
    promise: ReturnType<typeof connect> | null;
    conn: typeof _mongoose | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {


  const tenantName = await getCustomClaimsFromToken("tenantName");
  if (tenantName) {
    console.log("tenant name: ", tenantName);
  }else{
    console.log("no tenant name found");
  }


  // Check for tenantId in JWT token
  const tenantId = await getCustomClaimsFromToken("tenantId");
  if (tenantId) {
    console.log("tenant id: ", tenantId);
  }else{
    console.log("no tenant id found");
  }



  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

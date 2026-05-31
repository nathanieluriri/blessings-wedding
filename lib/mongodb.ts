import { MongoClient, type Db } from "mongodb";

// Cache the client across HMR reloads in dev so we don't exhaust connections.
// In production this module is evaluated once per server instance.

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "blessings_wedding";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export function getClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

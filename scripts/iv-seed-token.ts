// Stamps a known ivToken on the most recent RSVP so /iv/<token> can be
// opened locally. Usage: npx tsx --env-file=.env.local scripts/iv-seed-token.ts
import { rsvpsCollection } from "../lib/collections";

const TOKEN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

async function main() {
  const col = await rsvpsCollection();
  const doc = await col.find().sort({ createdAt: -1 }).next();
  if (!doc) throw new Error("No RSVPs in the database — submit one first.");
  await col.updateOne({ _id: doc._id }, { $set: { ivToken: TOKEN } });
  console.log(`Token set on "${doc.name}" → http://localhost:3000/iv/${TOKEN}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

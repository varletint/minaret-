import mongoose from "mongoose";
import dotenv from "dotenv";
import { Station } from "../src/models/Station";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/minaret-backend";

async function checkStations() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const stations = await Station.find({}).select(
      "+icecastCredentials.password +icecastCredentials.username"
    );

    console.log("\n--- Stations Found ---");
    stations.forEach((s) => {
      console.log(`Station: ${s.name}`);
      console.log(`  Mount: ${s.mountPoint}`);
      console.log(`  User:  ${s.icecastCredentials?.username || "(none)"}`);
      console.log(`  Pass:  ${s.icecastCredentials?.password || "(none)"}`);
      console.log("------------------------");
    });

    if (stations.length === 0) {
      console.log("No stations found in DB!");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkStations();

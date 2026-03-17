import mongoose from "mongoose";
import { config } from "./config.js";

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    content: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const SiteContent = mongoose.model("SiteContent", siteContentSchema);

export async function connectDatabase() {
  if (!config.mongodbUri) {
    // eslint-disable-next-line no-console
    console.warn("");
    return;
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(config.mongodbUri, {
    dbName: config.mongodbDb
  });

  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${config.mongodbDb}`);
}

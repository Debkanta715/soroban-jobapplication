import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  authDevMode: process.env.AUTH_DEV_MODE === "true",
  mongodbUri: process.env.MONGODB_URI || "",
  mongodbDb: process.env.MONGODB_DB || "jobfinder",
  network: process.env.STELLAR_NETWORK || "testnet",
  contractId: process.env.STELLAR_CONTRACT_ID || "",
  contractAlias: process.env.STELLAR_CONTRACT_ALIAS || "",
  sourceAccount: process.env.STELLAR_SOURCE_ACCOUNT || "",
  stellarCliPath: process.env.STELLAR_CLI_PATH || "stellar",
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback"
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:4000/api/auth/facebook/callback"
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      callbackUrl: process.env.GITHUB_CALLBACK_URL || "http://localhost:4000/api/auth/github/callback"
    }
  }
};

if (!config.contractId && !config.contractAlias) {
  // eslint-disable-next-line no-console
  console.warn("Missing contract identifier: set STELLAR_CONTRACT_ID or STELLAR_CONTRACT_ALIAS in backend/.env");
}

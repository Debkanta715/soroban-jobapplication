import crypto from "node:crypto";
import { config } from "./config.js";

const STATE_TTL_MS = 5 * 60 * 1000;
const stateStore = new Map();

function cleanupExpiredStates() {
  const now = Date.now();
  for (const [state, record] of stateStore.entries()) {
    if (record.expiresAt <= now) {
      stateStore.delete(state);
    }
  }
}

function getProviderConfig(provider) {
  const providerConfig = config.auth[provider];
  if (!providerConfig) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  if (config.authDevMode) {
    return providerConfig;
  }

  if (!providerConfig.clientId || !providerConfig.clientSecret) {
    throw new Error(`${provider} OAuth is not configured. Add client id/secret in backend/.env`);
  }

  return providerConfig;
}

function saveState(provider, redirectTo) {
  cleanupExpiredStates();
  const state = crypto.randomUUID();

  stateStore.set(state, {
    provider,
    redirectTo,
    expiresAt: Date.now() + STATE_TTL_MS
  });

  return state;
}

function consumeState(provider, state) {
  cleanupExpiredStates();
  const record = stateStore.get(state);

  if (!record) {
    throw new Error("Invalid or expired OAuth state.");
  }

  stateStore.delete(state);

  if (record.provider !== provider) {
    throw new Error("OAuth provider mismatch.");
  }

  return record;
}

function createAuthUrl(provider, redirectTo) {
  const providerConfig = getProviderConfig(provider);
  const state = saveState(provider, redirectTo);

  if (config.authDevMode) {
    const params = new URLSearchParams({
      code: `dev-${provider}`,
      state
    });
    return `${providerConfig.callbackUrl}?${params.toString()}`;
  }

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.callbackUrl,
      response_type: "code",
      scope: "openid profile email",
      state,
      access_type: "offline",
      prompt: "consent"
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === "facebook") {
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.callbackUrl,
      response_type: "code",
      scope: "email,public_profile",
      state
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  if (provider === "github") {
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.callbackUrl,
      scope: "read:user user:email",
      state
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const message = contentType.includes("application/json")
      ? JSON.stringify(await response.json())
      : await response.text();
    throw new Error(`OAuth request failed (${response.status}): ${message}`);
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const bodyText = await response.text();
  return Object.fromEntries(new URLSearchParams(bodyText).entries());
}

async function exchangeGoogleCode(code) {
  const providerConfig = getProviderConfig("google");

  const token = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      redirect_uri: providerConfig.callbackUrl,
      grant_type: "authorization_code"
    })
  });

  const profile = await fetchJson("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` }
  });

  return {
    provider: "google",
    profile: {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      avatar: profile.picture
    }
  };
}

async function exchangeFacebookCode(code) {
  const providerConfig = getProviderConfig("facebook");

  const token = await fetchJson(
    `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      redirect_uri: providerConfig.callbackUrl,
      code
    }).toString()}`
  );

  const profile = await fetchJson(
    `https://graph.facebook.com/me?${new URLSearchParams({
      fields: "id,name,email,picture.type(large)",
      access_token: token.access_token
    }).toString()}`
  );

  return {
    provider: "facebook",
    profile: {
      id: profile.id,
      name: profile.name,
      email: profile.email || "",
      avatar: profile.picture?.data?.url || ""
    }
  };
}

async function exchangeGithubCode(code) {
  const providerConfig = getProviderConfig("github");

  const token = await fetchJson("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      redirect_uri: providerConfig.callbackUrl
    })
  });

  const profile = await fetchJson("https://api.github.com/user", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token.access_token}`,
      "User-Agent": "soroban-jobapplication"
    }
  });

  let email = profile.email || "";
  if (!email) {
    const emails = await fetchJson("https://api.github.com/user/emails", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token.access_token}`,
        "User-Agent": "soroban-jobapplication"
      }
    });

    const primary = Array.isArray(emails) ? emails.find((item) => item.primary) : null;
    email = primary?.email || "";
  }

  return {
    provider: "github",
    profile: {
      id: String(profile.id),
      name: profile.name || profile.login,
      email,
      avatar: profile.avatar_url || ""
    }
  };
}

async function exchangeCode(provider, code) {
  if (config.authDevMode) {
    return {
      provider,
      profile: {
        id: `dev-${provider}-user`,
        name: `${provider.charAt(0).toUpperCase()}${provider.slice(1)} Dev User`,
        email: `${provider}.dev.user@example.com`,
        avatar: ""
      }
    };
  }

  if (provider === "google") return exchangeGoogleCode(code);
  if (provider === "facebook") return exchangeFacebookCode(code);
  if (provider === "github") return exchangeGithubCode(code);

  throw new Error(`Unsupported provider: ${provider}`);
}

export function getProviderStatus() {
  if (config.authDevMode) {
    return {
      google: true,
      facebook: true,
      github: true
    };
  }

  return {
    google: Boolean(config.auth.google.clientId && config.auth.google.clientSecret),
    facebook: Boolean(config.auth.facebook.clientId && config.auth.facebook.clientSecret),
    github: Boolean(config.auth.github.clientId && config.auth.github.clientSecret)
  };
}

export function buildProviderAuthUrl(provider, redirectTo) {
  return createAuthUrl(provider, redirectTo);
}

export async function completeOAuth(provider, { code, state }) {
  const stateRecord = consumeState(provider, state);
  const oauthResult = await exchangeCode(provider, code);

  return {
    redirectTo: stateRecord.redirectTo,
    provider: oauthResult.provider,
    profile: oauthResult.profile
  };
}

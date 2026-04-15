import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const CRICAPI_BASE = "https://api.cricapi.com/v1";
const ENV_KEY_NAMES = ["CRICAPI_KEY", "CRICAPI_KEY_MIT", "CRICAPI_KEY_SARTHAK"] as const;
type CricApiKeyName = (typeof ENV_KEY_NAMES)[number];
type ParsedEnv = Partial<Record<CricApiKeyName, string>>;

const readEnvFileFallback = (): ParsedEnv => {
  const result: ParsedEnv = {};
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../.env"),
  ];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;

    const envRaw = fs.readFileSync(envPath, "utf-8");
    const parsed = dotenv.parse(envRaw) as Record<string, string>;

    for (const keyName of ENV_KEY_NAMES) {
      if (!result[keyName] && parsed[keyName]) {
        result[keyName] = parsed[keyName].trim();
      }
    }

    // Extra-safe fallback parser for unusual dotenv formatting.
    const lines = envRaw.split(/\r?\n/);
    for (const keyName of ENV_KEY_NAMES) {
      if (result[keyName]) continue;
      const line = lines.find((l) => l.trim().startsWith(`${keyName}=`));
      if (!line) continue;
      const value = line.slice(line.indexOf("=") + 1).trim();
      if (value) result[keyName] = value;
    }
  }

  return result;
};

const getKeyValue = (name: CricApiKeyName, fallback: ParsedEnv) => {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;
  return fallback[name]?.trim();
};

const getMask = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

const keyNameValue = (name: CricApiKeyName, fallback: ParsedEnv) => ({
  name,
  value: getKeyValue(name, fallback),
});

const isKeyEntry = (
  k: ReturnType<typeof keyNameValue>
): k is { name: CricApiKeyName; value: string } => Boolean(k.value);

const getKeyEntries = (fallback: ParsedEnv) =>
  ENV_KEY_NAMES.map((name) => keyNameValue(name, fallback)).filter(isKeyEntry);

const logLoadedKeys = (keyEntries: Array<{ name: CricApiKeyName; value: string }>) => {
  const loaded = keyEntries.map((k) => `${k.name}(${getMask(k.value)})`).join(", ");
  console.log(`[cricapi] loaded keys: ${keyEntries.length} -> ${loaded}`);
};

/** Avoid sync .env reads and repeated logging on every BCCI request. */
let cachedKeyEntries: Array<{ name: CricApiKeyName; value: string }> | null = null;

const getCachedKeyEntries = () => {
  if (cachedKeyEntries) return cachedKeyEntries;
  const envFallback = readEnvFileFallback();
  cachedKeyEntries = getKeyEntries(envFallback);
  if (cachedKeyEntries.length > 0) {
    logLoadedKeys(cachedKeyEntries);
  }
  return cachedKeyEntries;
};

const readOffset = (req: Request) =>
  typeof req.query.offset === "string" ? req.query.offset : "0";

export const getCricMatches = async (req: Request, res: Response) => {
  try {
    const keyEntries = getCachedKeyEntries();

    if (keyEntries.length === 0) {
      return res
        .status(500)
        .json({ message: "CricAPI keys are not configured on the server" });
    }

    const offset = readOffset(req);
    let lastFailure: { status: number; data: unknown } | null = null;
    const attempts: Array<{ key: string; status: number; reason?: string }> = [];

    for (const [index, key] of keyEntries.entries()) {
      try {
        // console.log(
        //   `[cricapi] trying key ${index + 1}/${keyEntries.length}: ${key.name} (${getMask(key.value)})`
        // );

        const url = `${CRICAPI_BASE}/currentMatches?apikey=${encodeURIComponent(
          key.value
        )}&offset=${encodeURIComponent(offset)}`;

        const upstream = await fetch(url);
        const raw = await upstream.text();
        let data: {
          status?: string;
          reason?: string;
          message?: string;
          info?: { credits?: number; hitsLimit?: number; hitsToday?: number };
        } | null = null;

        try {
          data = raw ? (JSON.parse(raw) as typeof data) : null;
        } catch {
          data = { message: raw };
        }

        const isFailure =
          !upstream.ok ||
          data?.status === "failure" ||
          Boolean(data?.reason);

        if (!isFailure) {
          res.setHeader("x-cricapi-key-used", key.name);
          return res.status(200).json(data);
        }

        attempts.push({
          key: key.name,
          status: upstream.status || 429,
          reason: data?.reason || data?.message,
        });
        lastFailure = { status: upstream.status || 429, data };
      } catch (error) {
        attempts.push({
          key: key.name,
          status: 502,
          reason: String(error),
        });
        lastFailure = {
          status: 502,
          data: { message: `Key attempt failed: ${String(error)}` },
        };
      }
    }

    return res
      .status(lastFailure?.status || 429)
      .json(
        lastFailure?.data || {
          message: "All CricAPI keys are exhausted",
          attempts,
        }
      );
  } catch (e) {
    console.error("cricapi proxy error:", e);
    return res.status(502).json({ message: "Failed to reach CricAPI" });
  }
};

import { Request, Response } from "express";
import Groq from "groq-sdk";
import playerHistory from "../model/playerHistory.model";

export type ExtraType = "wide" | "no-ball" | "bye" | "leg-bye" | null;
export type WicketType =
  | "bowled"
  | "caught"
  | "lbw"
  | "run-out"
  | "stumped"
  | "hit-wicket"
  | "retired-out";

export interface CommentaryRequestBody {
  batsman: string;
  bowler: string;
  runsScored: number;
  extraType: ExtraType;
  isWicket: boolean;
  wicketType?: WicketType;
  overNumber: number;
  ballNumber: number;
}

interface PlayerOfMatchCandidate {
  playerId: { playername?: string; _id?: string } | null;
  battingRuns?: number;
  battingBalls?: number;
  fours?: number;
  sixes?: number;
  wickets?: number;
  runsConceded?: number;
  catches?: number;
  runOuts?: number;
}

const ALLOWED_EXTRAS = ["wide", "no-ball", "bye", "leg-bye", null];
const ALLOWED_WICKETS = [
  "bowled",
  "caught",
  "lbw",
  "run-out",
  "stumped",
  "hit-wicket",
  "retired-out",
];

let groqClient: Groq | null = null;

const getGroqClient = (): Groq | null => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
};

const getTone = (runsScored: number, isWicket: boolean): string => {
  if (isWicket) return "dramatic";
  if (runsScored === 4 || runsScored === 6) return "exciting";
  if (runsScored === 0) return "calm";
  return "neutral";
};

const normalizeCommentary = (rawCommentary: string): string => {
  const cleanText = rawCommentary.replace(/\s+/g, " ").replace(/["']/g, "").trim();

  const sentenceMatch = cleanText.match(/^[^.!?]*[.!?]?/);
  const singleSentence = (sentenceMatch?.[0] || cleanText).trim();

  const words = singleSentence.split(" ").filter(Boolean).slice(0, 20);
  let finalSentence = words.join(" ").trim();

  if (!finalSentence) {
    return "Good ball, well played by the batter.";
  }

  if (!/[.!?]$/.test(finalSentence)) {
    finalSentence = `${finalSentence}.`;
  }

  return finalSentence;
};

const getFallbackCommentary = (body: CommentaryRequestBody): string => {
  const ballText = `${body.overNumber}.${body.ballNumber}`;

  if (body.isWicket) {
    return normalizeCommentary(
      `Over ${ballText}, ${body.bowler} to ${body.batsman}: OUT! ${body.wicketType || "wicket"} and big moment.`
    );
  }

  if (body.extraType === "wide") {
    return normalizeCommentary(
      `Over ${ballText}, wide from ${body.bowler}; extra run to the batting side.`
    );
  }

  if (body.extraType === "no-ball") {
    return normalizeCommentary(
      `Over ${ballText}, no-ball by ${body.bowler}; free scoring chance for ${body.batsman}.`
    );
  }

  if (body.runsScored === 6) {
    return normalizeCommentary(
      `Over ${ballText}, huge SIX by ${body.batsman} off ${body.bowler}.`
    );
  }

  if (body.runsScored === 4) {
    return normalizeCommentary(
      `Over ${ballText}, crisp FOUR from ${body.batsman} against ${body.bowler}.`
    );
  }

  if (body.runsScored === 0) {
    return normalizeCommentary(
      `Over ${ballText}, dot ball from ${body.bowler}; ${body.batsman} stays watchful.`
    );
  }

  return normalizeCommentary(
    `Over ${ballText}, ${body.bowler} to ${body.batsman}, ${body.runsScored} run${body.runsScored > 1 ? "s" : ""}.`
  );
};

const validateBody = (body: CommentaryRequestBody): string | null => {
  const {
    batsman,
    bowler,
    runsScored,
    extraType,
    isWicket,
    wicketType,
    overNumber,
    ballNumber,
  } = body;

  if (!batsman || !bowler) return "batsman and bowler are required";
  if (typeof runsScored !== "number" || runsScored < 0) return "runsScored must be a valid non-negative number";
  if (!ALLOWED_EXTRAS.includes(extraType)) return "extraType must be wide, no-ball, bye, leg-bye, or null";
  if (typeof isWicket !== "boolean") return "isWicket must be boolean";
  if (typeof overNumber !== "number" || overNumber < 0) return "overNumber must be a valid non-negative number";
  if (typeof ballNumber !== "number" || ballNumber < 0) return "ballNumber must be a valid non-negative number";

  if (isWicket && (!wicketType || !ALLOWED_WICKETS.includes(wicketType))) {
    return "wicketType is required and must be valid when isWicket is true";
  }

  return null;
};

export const generateAiCommentary = async (req: Request, res: Response) => {
  try {
    const body = req.body as CommentaryRequestBody;
    const validationError = validateBody(body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const tone = getTone(body.runsScored, body.isWicket);

    const prompt = `
You are a professional cricket commentator.
Create exactly one short commentary sentence for the delivery.
Rules:
- Max 20 words
- If runs are 4 or 6, tone must be exciting
- If wicket fell, tone must be dramatic
- If dot ball, tone must be calm
- Return only one sentence, no extra text

Delivery:
- Over: ${body.overNumber}.${body.ballNumber}
- Bowler: ${body.bowler}
- Batsman: ${body.batsman}
- Runs: ${body.runsScored}
- Extra type: ${body.extraType ?? "none"}
- Wicket: ${body.isWicket ? "yes" : "no"}
- Wicket type: ${body.wicketType ?? "none"}
- Required tone: ${tone}
`.trim();

    const commentary = await generateAiCommentaryText(body, prompt);

    return res.status(200).json({ commentary });
  } catch (error) {
    const body = req.body as CommentaryRequestBody;
    if (body?.batsman && body?.bowler) {
      return res.status(200).json({ commentary: getFallbackCommentary(body) });
    }
    return res
      .status(500)
      .json({ message: "Failed to generate commentary", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

const fallbackPlayerOfMatch = (scorecard: PlayerOfMatchCandidate[]) => {
  const ranked = scorecard
    .map((entry) => {
      const runs = Number(entry.battingRuns || 0);
      const balls = Number(entry.battingBalls || 0);
      const fours = Number(entry.fours || 0);
      const sixes = Number(entry.sixes || 0);
      const wickets = Number(entry.wickets || 0);
      const runsConceded = Number(entry.runsConceded || 0);
      const catches = Number(entry.catches || 0);
      const runOuts = Number(entry.runOuts || 0);
      const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;

      const score =
        runs * 1.2 +
        fours * 0.8 +
        sixes * 1.3 +
        wickets * 22 +
        catches * 8 +
        runOuts * 10 +
        Math.max(0, (strikeRate - 100) * 0.1) -
        runsConceded * 0.15;

      return { entry, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.entry || null;
};

export const generatePlayerOfTheMatch = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({ message: "matchId is required" });
    }

    const scorecard = (await playerHistory
      .find({ matchId })
      .populate("playerId", "playername")) as unknown as PlayerOfMatchCandidate[];

    if (!scorecard.length) {
      return res.status(404).json({ message: "No scorecard data found for this match" });
    }

    const fallbackWinner = fallbackPlayerOfMatch(scorecard);
    if (!fallbackWinner?.playerId?.playername) {
      return res.status(200).json({ playerName: "Not decided yet", reason: "Insufficient match stats" });
    }

    const client = getGroqClient();
    if (!client) {
      return res.status(200).json({
        playerName: fallbackWinner.playerId.playername,
        reason: "Selected from batting, bowling, and fielding impact.",
      });
    }

    const compactStats = scorecard.map((p) => ({
      name: p.playerId?.playername || "Unknown",
      battingRuns: Number(p.battingRuns || 0),
      battingBalls: Number(p.battingBalls || 0),
      fours: Number(p.fours || 0),
      sixes: Number(p.sixes || 0),
      wickets: Number(p.wickets || 0),
      runsConceded: Number(p.runsConceded || 0),
      catches: Number(p.catches || 0),
      runOuts: Number(p.runOuts || 0),
    }));

    const prompt = `
You are a cricket match analyst.
From the scorecard stats below, select exactly one Player of the Match.

Rules:
- Prefer all-round impact (batting + bowling + fielding)
- Return JSON only in this exact format:
{"playerName":"<name>","reason":"<max 20 words>"}

Scorecard:
${JSON.stringify(compactStats)}
`.trim();

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: "You are a cricket analytics assistant. Return strict JSON only.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({
        playerName: fallbackWinner.playerId.playername,
        reason: "Selected from batting, bowling, and fielding impact.",
      });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as { playerName?: string; reason?: string };
      if (!parsed.playerName) {
        throw new Error("Invalid AI response");
      }
      return res.status(200).json({
        playerName: parsed.playerName,
        reason: parsed.reason || "Best overall impact in the match.",
      });
    } catch {
      return res.status(200).json({
        playerName: fallbackWinner.playerId.playername,
        reason: "Selected from batting, bowling, and fielding impact.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate Player of the Match",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const generateAiCommentaryText = async (
  body: CommentaryRequestBody,
  preparedPrompt?: string,
  groq?: Groq
): Promise<string> => {
  const tone = getTone(body.runsScored, body.isWicket);

  const prompt =
    preparedPrompt ||
    `
You are a professional cricket commentator.
Create exactly one short commentary sentence for the delivery.
Rules:
- Max 20 words
- If runs are 4 or 6, tone must be exciting
- If wicket fell, tone must be dramatic
- If dot ball, tone must be calm
- Return only one sentence, no extra text

Delivery:
- Over: ${body.overNumber}.${body.ballNumber}
- Bowler: ${body.bowler}
- Batsman: ${body.batsman}
- Runs: ${body.runsScored}
- Extra type: ${body.extraType ?? "none"}
- Wicket: ${body.isWicket ? "yes" : "no"}
- Wicket type: ${body.wicketType ?? "none"}
- Required tone: ${tone}
`.trim();

  const client = groq || getGroqClient();
  if (!client) return getFallbackCommentary(body);

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 1.5,
    max_tokens: 60,
    messages: [
      {
        role: "system",
        content: "You generate concise, realistic cricket commentary.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const modelResponse = completion.choices[0]?.message?.content || "";
  return normalizeCommentary(modelResponse || getFallbackCommentary(body));
};

export { generateAiCommentaryText };

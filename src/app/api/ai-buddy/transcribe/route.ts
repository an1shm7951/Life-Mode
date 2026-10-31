import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const authentication = await authenticateRequest(request);
  if (!authentication) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "A valid audio recording is required." }, { status: 400 }); }

  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return NextResponse.json({ error: "No audio recording was received." }, { status: 400 });
  if (audio.size > 20 * 1024 * 1024) return NextResponse.json({ error: "That recording is too large. Please try a shorter message." }, { status: 413 });

  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!openAiKey && !geminiKey) return NextResponse.json({ error: "Voice transcription needs an AI provider key. Add OPENAI_API_KEY or GEMINI_API_KEY to the LifeMode server environment." }, { status: 503 });

  try {
    if (openAiKey) {
      const upstream = new FormData();
      upstream.append("file", audio, audio.name || "lifemode-voice.webm");
      upstream.append("model", "gpt-4o-mini-transcribe");
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: "Bearer " + openAiKey }, body: upstream, signal: AbortSignal.timeout(25_000) });
      const result = await response.json() as { text?: string; error?: { message?: string } };
      if (!response.ok || !result.text?.trim()) return NextResponse.json({ error: result.error?.message || "I could not transcribe that recording. Please try again." }, { status: 502 });
      return NextResponse.json({ text: result.text.trim() }, { headers: { "Cache-Control": "no-store" } });
    }

    const bytes = Buffer.from(await audio.arrayBuffer()).toString("base64");
    const model = process.env.GEMINI_TRANSCRIPTION_MODEL || "gemini-2.5-flash";
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey! },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Transcribe the spoken audio exactly. Return only the words spoken, without commentary. Preserve the language used by the speaker." }, { inlineData: { mimeType: audio.type?.split(";")[0] || "audio/mp4", data: bytes } }] }], generationConfig: { temperature: 0 } }),
      signal: AbortSignal.timeout(25_000),
    });
    const result = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } };
    const transcript = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!response.ok || !transcript) return NextResponse.json({ error: result.error?.message || "I could not transcribe that recording. Please try again." }, { status: 502 });
    return NextResponse.json({ text: transcript }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Voice transcription timed out. Please try again." }, { status: 504 });
  }
}
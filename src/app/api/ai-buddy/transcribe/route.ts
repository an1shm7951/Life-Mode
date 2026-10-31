import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const authentication = await authenticateRequest(request);
  if (!authentication) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Voice transcription is not configured on this LifeMode deployment yet." }, { status: 503 });
  }

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "A valid audio recording is required." }, { status: 400 }); }

  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "No audio recording was received." }, { status: 400 });
  }
  if (audio.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "That recording is too large. Please try a shorter message." }, { status: 413 });
  }

  const upstream = new FormData();
  upstream.append("file", audio, audio.name || "lifemode-voice.webm");
  upstream.append("model", "gpt-4o-mini-transcribe");
  upstream.append("language", "en");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
      signal: AbortSignal.timeout(25_000),
    });
    const result = await response.json() as { text?: string; error?: { message?: string } };
    if (!response.ok || !result.text?.trim()) {
      return NextResponse.json({ error: result.error?.message || "I couldn't transcribe that recording. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ text: result.text.trim() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Voice transcription timed out. Please try again." }, { status: 504 });
  }
}

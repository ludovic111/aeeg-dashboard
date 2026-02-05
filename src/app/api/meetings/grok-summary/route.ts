import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inflateSync } from "node:zlib";

export const runtime = "nodejs";

interface GrokSummaryBody {
  meetingId: string;
}

function extractMessageContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

function decodePdfString(input: string): string {
  let output = "";

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char !== "\\") {
      output += char;
      continue;
    }

    const next = input[i + 1];
    if (!next) break;

    if (next === "n") {
      output += "\n";
      i += 1;
      continue;
    }
    if (next === "r") {
      output += "\r";
      i += 1;
      continue;
    }
    if (next === "t") {
      output += "\t";
      i += 1;
      continue;
    }
    if (next === "b") {
      output += "\b";
      i += 1;
      continue;
    }
    if (next === "f") {
      output += "\f";
      i += 1;
      continue;
    }
    if (next === "(" || next === ")" || next === "\\") {
      output += next;
      i += 1;
      continue;
    }

    if (/[0-7]/.test(next)) {
      let octal = next;
      if (/[0-7]/.test(input[i + 2] || "")) octal += input[i + 2];
      if (/[0-7]/.test(input[i + 3] || "")) octal += input[i + 3];
      output += String.fromCharCode(Number.parseInt(octal, 8));
      i += octal.length;
      continue;
    }

    output += next;
    i += 1;
  }

  return output;
}

function extractTextFromContentStream(content: string): string[] {
  const chunks: string[] = [];

  const tjRegex = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  for (const match of content.matchAll(tjRegex)) {
    const raw = match[0].replace(/\s*Tj$/, "");
    const inner = raw.slice(1, -1);
    const text = decodePdfString(inner).trim();
    if (text) chunks.push(text);
  }

  const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
  for (const match of content.matchAll(tjArrayRegex)) {
    const parts = match[1].match(/\((?:\\.|[^\\)])*\)/g) || [];
    for (const part of parts) {
      const text = decodePdfString(part.slice(1, -1)).trim();
      if (text) chunks.push(text);
    }
  }

  return chunks;
}

function extractPdfText(pdfBuffer: Buffer): string {
  const binary = pdfBuffer.toString("latin1");
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const pieces: string[] = [];

  for (const match of binary.matchAll(streamRegex)) {
    const rawStream = Buffer.from(match[1], "latin1");
    const candidates = [rawStream];

    try {
      candidates.push(inflateSync(rawStream));
    } catch {
      // Not a flate stream; keep raw bytes only.
    }

    for (const candidate of candidates) {
      const content = candidate.toString("latin1");
      pieces.push(...extractTextFromContentStream(content));
    }
  }

  return pieces
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<GrokSummaryBody>;
    const meetingId = body.meetingId?.trim();

    if (!meetingId) {
      return NextResponse.json(
        { error: "Missing required payload" },
        { status: 400 }
      );
    }

    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) {
      return NextResponse.json(
        { error: "XAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const model = process.env.XAI_MODEL || "grok-4-1-fast-reasoning";

    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("id, title, date, agenda_pdf_path")
      .eq("id", meetingId)
      .maybeSingle();

    if (meetingError) {
      return NextResponse.json(
        { error: meetingError.message || "Failed to load meeting" },
        { status: 500 }
      );
    }

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    if (!meeting.agenda_pdf_path) {
      return NextResponse.json(
        { error: "No agenda PDF found for this meeting" },
        { status: 400 }
      );
    }

    const agendaPdfUrl = supabase.storage
      .from("meeting-agendas")
      .getPublicUrl(meeting.agenda_pdf_path).data.publicUrl;

    const pdfResponse = await fetch(agendaPdfUrl);
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: "Unable to download agenda PDF" },
        { status: 502 }
      );
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfText = extractPdfText(Buffer.from(pdfArrayBuffer));

    if (!pdfText) {
      return NextResponse.json(
        { error: "Unable to extract readable text from PDF" },
        { status: 422 }
      );
    }

    const clippedPdfText = pdfText.slice(0, 24000);

    const prompt = [
      "Tu reçois le texte extrait automatiquement d'un ordre du jour PDF.",
      "",
      "Contexte:",
      `- Titre: ${meeting.title}`,
      `- Date: ${meeting.date}`,
      "",
      "Réponds uniquement en markdown en français, avec les sections exactes:",
      "## Résumé",
      "## Décisions et points clés",
      "## To-dos à venir",
      "## Événements et échéances",
      "",
      "Contraintes:",
      "- Utilise des listes à puces courtes.",
      "- Si une information est absente du PDF, écris 'Non précisé' pour cet élément.",
      "- N'invente pas de faits non présents dans le document.",
      "",
      "Texte extrait de l'ODJ:",
      clippedPdfText,
    ].join("\n");

    const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${xaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You extract reliable structured meeting information from agenda documents and return concise markdown.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const grokPayload = (await grokResponse.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    if (!grokResponse.ok) {
      return NextResponse.json(
        {
          error:
            grokPayload.error?.message ||
            "Grok request failed while generating meeting summary",
        },
        { status: 502 }
      );
    }

    const summary = extractMessageContent(
      grokPayload.choices?.[0]?.message?.content
    );

    if (!summary) {
      return NextResponse.json(
        { error: "Empty summary generated by Grok" },
        { status: 502 }
      );
    }

    const { data: updatedMeeting, error: updateError } = await supabase
      .from("meetings")
      .update({ agenda_ai_summary: summary })
      .eq("id", meetingId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to save meeting summary" },
        { status: 500 }
      );
    }

    if (!updatedMeeting) {
      return NextResponse.json(
        { error: "Meeting not found or not writable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while generating Grok summary",
      },
      { status: 500 }
    );
  }
}

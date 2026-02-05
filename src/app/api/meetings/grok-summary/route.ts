import { NextResponse } from "next/server";
import { inflateRawSync } from "node:zlib";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface GrokSummaryBody {
  meetingId: string;
}

interface ZipEntry {
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIR_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50;

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

function findEndOfCentralDirectory(buffer: Buffer): number {
  const start = Math.max(0, buffer.length - 0xffff - 22);

  for (let offset = buffer.length - 22; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === ZIP_EOCD_SIGNATURE) {
      return offset;
    }
  }

  return -1;
}

function findZipEntry(buffer: Buffer, targetName: string): ZipEntry | null {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) {
    return null;
  }

  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

  let offset = centralDirectoryOffset;
  while (offset < centralDirectoryEnd) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== ZIP_CENTRAL_DIR_SIGNATURE) {
      break;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);

    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileName = buffer.slice(fileNameStart, fileNameEnd).toString("utf8");

    if (fileName === targetName) {
      return {
        compressionMethod,
        compressedSize,
        localHeaderOffset,
      };
    }

    offset = fileNameEnd + extraFieldLength + fileCommentLength;
  }

  return null;
}

function readZipEntryData(buffer: Buffer, entry: ZipEntry): Buffer {
  const signature = buffer.readUInt32LE(entry.localHeaderOffset);
  if (signature !== ZIP_LOCAL_FILE_SIGNATURE) {
    throw new Error("Invalid DOCX local file header");
  }

  const fileNameLength = buffer.readUInt16LE(entry.localHeaderOffset + 26);
  const extraFieldLength = buffer.readUInt16LE(entry.localHeaderOffset + 28);
  const dataStart = entry.localHeaderOffset + 30 + fileNameLength + extraFieldLength;
  const dataEnd = dataStart + entry.compressedSize;
  const compressedData = buffer.slice(dataStart, dataEnd);

  if (entry.compressionMethod === 0) {
    return compressedData;
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressedData);
  }

  throw new Error(`Unsupported DOCX compression method: ${entry.compressionMethod}`);
}

function decodeXmlEntities(value: string): string {
  return value.replace(
    /&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g,
    (_match, entity: string) => {
      if (entity === "amp") return "&";
      if (entity === "lt") return "<";
      if (entity === "gt") return ">";
      if (entity === "quot") return '"';
      if (entity === "apos") return "'";

      if (entity.startsWith("#x")) {
        const code = Number.parseInt(entity.slice(2), 16);
        return Number.isNaN(code) ? "" : String.fromCodePoint(code);
      }

      if (entity.startsWith("#")) {
        const code = Number.parseInt(entity.slice(1), 10);
        return Number.isNaN(code) ? "" : String.fromCodePoint(code);
      }

      return "";
    }
  );
}

function extractDocxText(docxBuffer: Buffer): string {
  const documentEntry = findZipEntry(docxBuffer, "word/document.xml");
  if (!documentEntry) {
    throw new Error("word/document.xml not found in DOCX");
  }

  const xmlBuffer = readZipEntryData(docxBuffer, documentEntry);
  const xml = xmlBuffer.toString("utf8");

  const withBreaks = xml
    .replace(/<w:tab\s*\/\s*>/g, "\t")
    .replace(/<w:br[^>]*\/\s*>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tr>/g, "\n");

  const rawText = withBreaks.replace(/<[^>]+>/g, "");

  return decodeXmlEntities(rawText)
    .replace(/\r/g, "")
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
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (!meeting.agenda_pdf_path) {
      return NextResponse.json(
        { error: "No agenda DOCX found for this meeting" },
        { status: 400 }
      );
    }

    if (!meeting.agenda_pdf_path.toLowerCase().endsWith(".docx")) {
      return NextResponse.json(
        { error: "The agenda file must be a .docx document" },
        { status: 400 }
      );
    }

    const agendaFileUrl = supabase.storage
      .from("meeting-agendas")
      .getPublicUrl(meeting.agenda_pdf_path).data.publicUrl;

    const fileResponse = await fetch(agendaFileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Unable to download agenda file" },
        { status: 502 }
      );
    }

    const fileArrayBuffer = await fileResponse.arrayBuffer();
    const docxText = extractDocxText(Buffer.from(fileArrayBuffer));

    if (!docxText) {
      return NextResponse.json(
        { error: "Unable to retrieve text from DOCX" },
        { status: 422 }
      );
    }

    const clippedDocxText = docxText.slice(0, 24000);

    const prompt = [
      "Tu reçois le texte extrait automatiquement d'un ordre du jour DOCX.",
      "",
      "Contexte:",
      `- Titre: ${meeting.title}`,
      `- Date: ${meeting.date}`,
      "",
      "Réponds uniquement en markdown en français, propre et agréable à lire sur mobile et desktop.",
      "Utilise exactement cette structure (titres inclus):",
      "# 🧾 Synthèse de réunion",
      "## 🧠 Résumé exécutif",
      "## ✅ Décisions et points clés",
      "## 📌 To-dos à venir",
      "## 🗓️ Événements et échéances",
      "## ❓ Points à clarifier",
      "",
      "Contraintes de style:",
      "- Utilise des puces courtes et des phrases directes.",
      "- Pour les sections To-dos et Événements, utilise un tableau markdown lisible.",
      "- Ajoute des emojis de manière légère (maximum un emoji par ligne).",
      "- Mets en **gras** les responsabilités, les dates et les priorités importantes.",
      "",
      "Contraintes de fiabilité:",
      "- Si une information est absente du document, écris 'Non précisé'.",
      "- N'invente pas de faits non présents dans le document.",
      "- Si un passage est ambigu, signale-le clairement dans 'Points à clarifier'.",
      "",
      "Texte extrait de l'ODJ:",
      clippedDocxText,
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
              "You are a precise French meeting analyst. Return clean, structured markdown with tasteful emojis and no fabricated facts.",
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

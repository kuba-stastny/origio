// src/app/api/v1/bug-report/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import sharp from "sharp";

export const runtime = "nodejs"; // sharp potřebuje Node runtime

const MAX_FILES = 5;
const MAX_MESSAGE_CHARS = 600;

export async function POST(req: Request) {
  // 1) Načtení form-data
  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    console.error("[bug-report] FormData error:", err);
    return NextResponse.json(
      { error: "Tělo požadavku musí být form-data." },
      { status: 400 }
    );
  }

  const rawMessage = String(form.get("message") || "");
  const message = rawMessage.slice(0, MAX_MESSAGE_CHARS);

  // multiple files => getAll
  const allFiles = form.getAll("files");
  const fileBlobs = allFiles.filter(
    (f): f is File => f instanceof File
  );

  const imageFiles = fileBlobs.slice(0, MAX_FILES);

  if (!message.trim() && imageFiles.length === 0) {
    return NextResponse.json(
      { error: "Musíte poslat minimálně popis nebo alespoň jeden screenshot." },
      { status: 400 }
    );
  }

  const supabase = await supabaseServer();

  // 2) user (kdyby ses rozhodl to párovat)
  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch (err) {
    // pokud Auth selže, report stejně uložíme jako anonymní
    console.warn("[bug-report] getUser failed (pokračuju jako anonym):", err);
  }

  // 3) metadata z hlaviček
  const userAgent = req.headers.get("user-agent");
  const referer = req.headers.get("referer") ?? req.headers.get("origin");

  // 4) Upload screenshotů do bucketu "bugs" + komprese
  const uploadedUrls: string[] = [];

  for (const file of imageFiles) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // Komprese: max ~1600px, JPEG kvalita ~75
      const compressed = await sharp(inputBuffer)
        .resize(1600, 1600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 75 })
        .toBuffer();

      const fileNameSafe =
        file.name?.replace(/[^a-zA-Z0-9.\-_]/g, "_") || "screenshot.jpg";
      const ext = ".jpg"; // po kompresi do JPEG
      const baseName = fileNameSafe.replace(/\.[^.]+$/, "");
      const filePath = `${
        userId ?? "anon"
      }/${Date.now()}-${crypto.randomUUID()}-${baseName}${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("bugs")
        .upload(filePath, compressed, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("[bug-report] Upload error:", uploadError);
        return NextResponse.json(
          { error: "Nepodařilo se nahrát screenshot.", detail: uploadError.message },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("bugs")
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    } catch (err) {
      console.error("[bug-report] Error processing file:", err);
      return NextResponse.json(
        { error: "Chyba při zpracování screenshotu." },
        { status: 500 }
      );
    }
  }

  // 5) Uložení bug reportu do tabulky
  const payload = {
    message: message || null,
    screenshot_urls: uploadedUrls,
    user_id: userId,
    user_agent: userAgent,
    path: referer,
    status: "new" as const,
  };

  console.log("📝 [bug-report] FINAL PAYLOAD:", payload);

  const { error } = await supabase.from("bug_reports").insert(payload);

  if (error) {
    console.error("❌ [bug-report] INSERT ERROR:", error);
    return NextResponse.json(
      { error: "Nepodařilo se uložit hlášení chyby.", detail: error.message },
      { status: 500 }
    );
  }

  console.log("✅ [bug-report] INSERT OK");
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  // jednoduchý healthcheck jako u analytics
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.path.join("/");
    const filePath = join(process.cwd(), "playwright", "screenshots", filename);

    // ファイルが存在するかチェック
    try {
      await stat(filePath);
    } catch (error) {
      return new NextResponse("File not found", { status: 404 });
    }

    // ファイルを読み込み
    const fileBuffer = await readFile(filePath);

    // MIMEタイプを決定
    const mimeType = filename.toLowerCase().endsWith(".png")
      ? "image/png"
      : filename.toLowerCase().endsWith(".jpg") ||
        filename.toLowerCase().endsWith(".jpeg")
      ? "image/jpeg"
      : filename.toLowerCase().endsWith(".webp")
      ? "image/webp"
      : "application/octet-stream";

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving screenshot:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

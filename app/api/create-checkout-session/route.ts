import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // forward the Firebase ID token to Functions
  const auth = req.headers.get("authorization") || "";
  const body = await req.json();

  // IMPORTANT: this must include protocol, host, projectId and region
  // Example value (in .env.local):
  // NEXT_PUBLIC_FUNCTIONS_URL=http://127.0.0.1:5001/dodo-ketan/asia-south1
  const base = process.env.NEXT_PUBLIC_FUNCTIONS_URL;
  if (!base) {
    return NextResponse.json({ error: "NEXT_PUBLIC_FUNCTIONS_URL is not set" }, { status: 500 });
  }

  const resp = await fetch(`${base}/createCheckoutSession`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify(body),
  });

  // Read as text first so we can surface plain-text errors (like "Not Found")
  const text = await resp.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    // Return the raw text so you see the real server message
    return NextResponse.json({ error: text || "Upstream returned non-JSON" }, { status: resp.status });
  }
  return NextResponse.json(data, { status: resp.status });
}

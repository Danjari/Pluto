import { NextRequest, NextResponse } from "next/server";

// Email functionality temporarily disabled
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Email functionality is temporarily disabled" },
    { status: 503 }
  );
}

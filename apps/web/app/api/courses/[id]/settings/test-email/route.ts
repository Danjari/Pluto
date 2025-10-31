import { NextResponse } from "next/server";

// Email functionality temporarily disabled
export async function POST() {
  return NextResponse.json(
    { error: "Email functionality is temporarily disabled" },
    { status: 503 }
  );
}

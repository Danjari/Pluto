import { NextResponse } from "next/server";

// Cron job and email functionality temporarily disabled

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Cron job and email functionality is temporarily disabled",
      timestamp: new Date().toISOString()
    },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Cron job and email functionality is temporarily disabled",
      timestamp: new Date().toISOString()
    },
    { status: 503 }
  );
}

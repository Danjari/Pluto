import { NextRequest, NextResponse } from "next/server";

// Cron job and email functionality temporarily disabled

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      message: "Cron job and email functionality is temporarily disabled",
      timestamp: new Date().toISOString()
    },
    { status: 503 }
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      message: "Cron job and email functionality is temporarily disabled",
      timestamp: new Date().toISOString()
    },
    { status: 503 }
  );
}

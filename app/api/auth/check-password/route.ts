import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const correctPassword = process.env.DASHBOARD_PASSWORD

    if (!correctPassword) {
      return NextResponse.json(
        { success: false, error: "Password not configured" },
        { status: 500 }
      )
    }

    if (password === correctPassword) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false }, { status: 401 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    )
  }
}


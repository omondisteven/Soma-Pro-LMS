import { NextResponse } from 'next/server'

export async function POST() {
  // Since we're using localStorage on the client, we just return success
  // The client will clear the token from localStorage
  return NextResponse.json({ success: true })
}
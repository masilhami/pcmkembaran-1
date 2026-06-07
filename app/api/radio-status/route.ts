import { NextResponse } from 'next/server'

const START_HOUR = 6

export async function GET() {
  const now = new Date()

  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    START_HOUR,
    0,
    0,
    0
  )

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - startToday.getTime()) / 1000)
  )

  return NextResponse.json({
    live: true,

    // sementara dummy
    trackIndex: 0,

    // sementara offset sejak jam 06:00
    trackOffset: elapsedSeconds,
  })
}
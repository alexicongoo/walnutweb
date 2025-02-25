import { AssemblyAI } from 'assemblyai'
import { NextRequest, NextResponse } from 'next/server'

// Initialize AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_AI_API_KEY || ''
})

export async function POST(request: NextRequest) {
  try {
    // Check if the request has the correct content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('audio/')) {
      return NextResponse.json(
        { error: 'Request must include audio data' },
        { status: 400 }
      )
    }

    // Get the audio data as ArrayBuffer
    const audioData = await request.arrayBuffer()

    // Upload the audio file first
    const uploadUrl = await client.files.upload(Buffer.from(audioData))

    // Create and wait for transcription
    const transcript = await client.transcripts.transcribe({
      audio_url: uploadUrl,
      language_code: 'en', // You can make this configurable
    })

    // Return the transcription result
    return NextResponse.json({
      text: transcript.text,
      confidence: transcript.confidence,
      language: transcript.language_code,
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}

// Configure the API route to handle larger files
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}

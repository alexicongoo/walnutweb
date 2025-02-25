import { AssemblyAI } from 'assemblyai'
import { NextResponse } from 'next/server'

// Initialize AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_AI_API_KEY || ''
})

// Create a transcriber instance
const transcriber = client.realtime.transcriber({
  sampleRate: 16_000,
})

export async function POST(request: Request) {
  try {
    // Get the audio data from the request
    const audioData = await request.arrayBuffer()
    
    if (!audioData) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      )
    }

    // Set up event handlers
    transcriber.on('transcript', (transcript) => {
      if (!transcript.text) return

      if (transcript.message_type === 'FinalTranscript') {
        return NextResponse.json({ 
          type: 'final',
          text: transcript.text 
        })
      } else {
        return NextResponse.json({ 
          type: 'partial',
          text: transcript.text 
        })
      }
    })

    transcriber.on('error', (error) => {
      console.error('Transcription error:', error)
      return NextResponse.json(
        { error: 'Transcription failed' },
        { status: 500 }
      )
    })

    // Connect to the transcription service
    await transcriber.connect()

    // Send the audio data for transcription
    // @ts-ignore - Ignoring type error as the API accepts Uint8Array despite type definition
    transcriber.sendAudio(new Uint8Array(audioData));

    return NextResponse.json({ message: 'Processing audio' })

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Transcription service ready' })
}

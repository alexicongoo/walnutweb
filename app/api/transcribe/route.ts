import type { NextApiRequest, NextApiResponse } from 'next';
import { AssemblyAI } from 'assemblyai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Grab the 'fileUrl' from the request body
    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ error: 'fileUrl is required' });
    }

    // Create a new AssemblyAI client with your API key
    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY || '',
    });

    // Here is the object that tells AssemblyAI which audio to transcribe
    const data = {
      audio: fileUrl, // You can also pass local file path if your server can access it
    };

    // Use the client to transcribe
    const transcript = await client.transcripts.transcribe(data);
    // transcript.text will contain the transcribed text

    return res.status(200).json({
      text: transcript.text,
      transcript: transcript, // If you want to see the full object
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

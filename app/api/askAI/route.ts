import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { content } = await req.json();

    const response = await fetch('https://lloajmbpspozzoevmcot.supabase.co/functions/v1/open-ai', {  
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content }]
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from edge function');
    }

    return new NextResponse(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/markdown',
        'X-Question-Tokens': response.headers.get('X-Question-Tokens') || '0'
      }
    });

  } catch (error) {
    console.error('Error in /api/askAI route:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
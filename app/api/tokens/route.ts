import { NextResponse } from 'next/server';
import { getUserTokens, deductTokens, addTokens } from '@/components/askai_tools/tokens';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); // Get authenticated user

    if (!user) {
      console.log("User not authenticated");
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = user.id;
    const tokens = await getUserTokens(userId); // Fetch tokens using user ID

    console.log("Fetched tokens:", tokens);

    return NextResponse.json({ tokens }); // Return valid JSON response
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { action, amount } = await request.json();

    if (!action || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const userId = user.id;
    let result;

    if (action === 'deduct') {
      result = await deductTokens(userId, amount);
    } else if (action === 'add') {
      result = await addTokens(userId, amount);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (result === false) {
      return NextResponse.json({ error: "Operation failed" }, { status: 400 });
    }

    const updatedTokens = await getUserTokens(userId);
    return NextResponse.json({ success: true, tokens: updatedTokens });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
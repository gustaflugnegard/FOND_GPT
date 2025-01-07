import { createClient } from "@/utils/supabase/server";


/** Fetch the user's tokens */
export async function getUserTokens(userId: string): Promise<number> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('get_user_tokens', {
        user_id: userId
      });
      
    if (error) {
      console.error('Error fetching tokens:', error);
      return 0;
    }
    
    return data ?? 0;
  }


/** Deduct tokens after a successful question */
export async function deductTokens(userId: string, tokensToDeduct: number): Promise<boolean> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('deduct_user_tokens', {
        user_id: userId,
        tokens_to_deduct: tokensToDeduct
      });
      
    if (error) {
      console.error('Error deducting tokens:', error);
      return false;
    }
    
    return data || false;
  }

  export async function addTokens(userId: string, tokensToAdd: number): Promise<boolean> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('add_user_tokens', {
        user_id: userId,
        tokens_to_add: tokensToAdd
      });
      
    if (error) {
      console.error('Error adding tokens:', error);
      return false;
    }
    
    return data || false;
  }

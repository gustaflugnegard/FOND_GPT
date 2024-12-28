import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch additional user profile details
  const { data: profileData, error } = await supabase
    .from('profiles')  // Assuming you have a 'profiles' table
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-gray-500 dark:text-gray-400">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {user?.email}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {user?.created_at 
                  ? `Joined ${new Date(user.created_at).toLocaleDateString()}` 
                  : "Member"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Account Details</h3>
            <div className="space-y-2">
                <div>
                <span className="font-medium">Email:</span> {user?.email}
                {profileData?.display_name && (
                    <div>
                    <span className="font-medium">Name:</span> {profileData.display_name}
                    </div>
                )}
                <div>
                    <span className="font-medium">Tokens:</span> {profileData?.tokens}
                </div>
                </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <Button variant="outline">Edit Profile</Button>
          <Button variant="destructive">Delete Account</Button>
        </div>
      </div>
    </div>
  );
}
'use client'; // This is necessary to make the component a client component

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server"; // Supabase client for client-side

function ProfileClientComponent({ user, profileData }) {
  const [name, setName] = useState(profileData?.display_name || "");
  const [file, setFile] = useState(null); // For profile picture upload
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleProfileUpdate = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      let profilePictureUrl = profileData?.profile_picture_url;

      if (file) {
        // Upload profile picture to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('avatars') // The storage bucket name
          .upload(`public/${user?.id}/profile_picture.jpg`, file);

        if (uploadError) throw uploadError;

        // Get public URL
        profilePictureUrl = supabase.storage
          .from('avatars')
          .getPublicUrl(`public/${user?.id}/profile_picture.jpg`).publicURL;
      }

      // Update profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: user?.id, display_name: name, profile_picture_url: profilePictureUrl });

      if (updateError) throw updateError;

      setLoading(false);
      alert('Profile updated successfully!');
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.message || 'An error occurred while updating your profile.');
    }
  };

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
              <h2 className="text-xl font-semibold">{name}</h2>
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
                {name && (
                  <div>
                    <span className="font-medium">Name:</span> {name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <Button variant="outline" onClick={handleProfileUpdate}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
          <Button variant="destructive">Delete Account</Button>
        </div>
      </div>
    </div>
  );
}

export default ProfileClientComponent;

import ProfilePage from "@/components/profile";

import TokenTester from "@/components/askai_tools/TokenTester";

export default async function ProtectedPage() {
    
    return (
      <div className="flex-1 w-full flex flex-col gap-12">
        < TokenTester />
        < ProfilePage />
      </div>
    );
  }

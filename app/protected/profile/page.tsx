import ProfilePage from "@/components/profile";


export default async function ProtectedPage() {
    
    return (
      <div className="flex-1 w-full flex flex-col gap-12">
        < ProfilePage />
      </div>
    );
  }

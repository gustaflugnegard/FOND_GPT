import QuestionForm from "@/components/chat";

export default async function Index() {
  return (
    <>
      <main className="flex-1 flex flex-col gap-6 px-4">
        < QuestionForm />       
      </main>
    </>
  );
}

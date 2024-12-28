'use client';

import { useState, ChangeEvent } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Alert, AlertDescription } from "@/components/ui/index";
import { Loader2 } from "lucide-react";
import Link from 'next/link'; 


const AskAInonfunc = () => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear previous error
    setResponse(''); // Clear previous response

    try {
      // Simulate API call with setTimeout
      setTimeout(() => {
        setIsLoading(false);
        setError('Vänligen logga in för att använda denna funktionen'); // Set the error message
      }, 300); // Simulate network delay
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
      setError('Failed to get a response.');
    }
  };

  return (
    <div className="space-y-4 sm:px-0">
      <Card className="sm:max-w-4xl mx-auto w-full">
        <CardHeader className="relative">
          <div className="flex justify-center">
            <CardTitle className="text-2xl font-bold">
              Q/A Svenska Fonder
            </CardTitle>
          </div>
          <CardDescription className="text-center w-full mt-2">
            Ställ dina frågor om Svenska fonder och deras innehav, landfördelning, sektorer och mm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Input
                  type="text"
                  value={question}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                  placeholder="E.g., 'Vilka länder investerar Avanza Zero i?'"
                  className="w-full"
                  required
                  aria-label="Question input"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !question.trim()}
                aria-label={isLoading ? "Loading..." : "Submit question"}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Hämtar...
                  </>
                ) : (
                  'Fråga'
                )}
              </Button>
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription className="flex justify-between items-center">
                <div>
                  {error}
                  <Link href="/sign-up" className="font-semibold ml-2 h-auto">
                    Skapa ett konto
                  </Link>
                  <span> / </span>
                  <Link href="/sign-in" className="font-semibold h-auto">
                    Logga in
                  </Link>
                </div>
                <Button variant="link" className="p-0 ml-2 h-auto" onClick={() => setError('')}>
                  Avfärda
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {response && (
            <div className="mt-4">
              <CardTitle className="text-xl font-semibold">Response:</CardTitle>
              <p>{response}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AskAInonfunc;

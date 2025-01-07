'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import React, { ReactNode } from 'react';
import remarkGfm from 'remark-gfm';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Alert,
  AlertDescription,
} from "@/components/ui/index";
import { Loader2 } from "lucide-react";
import { estimateTokensForQuestion } from './askai_tools/token_estimation'; 

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}

const CustomCodeComponent = ({ node, className, children, ...props }: CodeProps) => {
  return (
    <pre className="p-6 mb-6 rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap break-words">
      <code {...props} className={`text-sm ${className || ''}`}>
        {children}
      </code>
    </pre>
  );
};

const AskAI = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [questionTokens, setQuestionTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [edgeFunction, setEdgeFunction] = useState('edge2');
  const [availableTokens, setAvailableTokens] = useState<number | null>(null);
  const [estimatedTokens, setEstimatedTokens] = useState(0);

  // Fetch available tokens on mount
  useEffect(() => {
    fetchTokens();
  }, []);

  // Update estimated tokens when question changes
  useEffect(() => {
    const tokens = estimateTokensForQuestion(question);
    setEstimatedTokens(tokens);
  }, [question]);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens');
      const data = await res.json();
      setAvailableTokens(data.tokens);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      setError('Failed to fetch token balance');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Token validation checks
    if (availableTokens === null) {
      setError('Loading token balance...');
      return;
    }

    if (estimatedTokens > availableTokens) {
      setError('Insufficient tokens for this question');
      return;
    }

    setIsLoading(true);
    setResponse('');
    setQuestionTokens(0);
    setError('');

    try {

      // proceed with the question
      const edgeUrl = edgeFunction === 'edge1' ? '/api/askAI' : '/api/askDOCS';
      const res = await fetch(edgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: question }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader?.read() || {};
        if (done) break;
        const decodedChunk = decoder.decode(value, { stream: true });
        setResponse((prev) => prev + decodedChunk);
      }

      // Get actual tokens used and adjust if needed
      const actualTokens = Number(res.headers.get('X-Question-Tokens')) || 0;
      setQuestionTokens(actualTokens);

      if (actualTokens > availableTokens) {
        setError(
          'Your token balance is low. Top up your account to continue asking questions.'
        );
      }

      const tokensToDeduct = actualTokens > availableTokens ? availableTokens : actualTokens;

      // First deduct the estimated tokens
      const deductRes = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deduct',
          amount: tokensToDeduct,
        }),
      });

      if (!deductRes.ok) {
        throw new Error('Failed to deduct tokens');
      }

      // Fetch updated token balance
      await fetchTokens();

    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get a response from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:px-0">
      <Card className="sm:max-w-5xl mx-auto w-full">
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <select
              value={edgeFunction}
              onChange={(e) => setEdgeFunction(e.target.value)}
              className="p-2 border rounded-md w-40"
            >
              <option value="edge2">Fond Databas</option>
              <option value="edge1">GPT Knowledge</option>
            </select>
            <div className="text-sm text-gray-600">
              Available Tokens: {availableTokens ?? 'Loading...'}
            </div>
          </div>
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
                  maxLength={600}  // Set your desired character limit
                />
              </div>
              <Button
                type="submit"
                disabled={
                  isLoading || 
                  !question.trim() || 
                  (availableTokens !== null && estimatedTokens > availableTokens)
                }
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
            <div className="flex justify-between text-sm text-gray-500 px-2">
              <span>Estimated Tokens: {estimatedTokens}</span>
              {questionTokens > 0 && <span>Actual Tokens Used: {questionTokens}</span>}
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                {error}
                <Button variant="link" className="p-0 ml-2 h-auto" onClick={() => setError('')}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {response && (
            <div className="">
              <CardTitle className="flex items-center justify-between">
              </CardTitle>
              <div className="prose prose-sm max-w-none dark:prose-invert mt-4 leading-relaxed space-y-2">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: CustomCodeComponent,
                  }}
                >
                  {response}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AskAI;
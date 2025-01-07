'use client'

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from '../ui/textarea';
import { estimateTokensForQuestion } from './token_estimation'; 

const TokenTester = () => {
  const [tokens, setTokens] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [estimatedTokens, setEstimatedTokens] = useState<number>(0);

  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    const tokens = estimateTokensForQuestion(inputText);
    setEstimatedTokens(tokens);
  }, [inputText]);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens', {
        method: 'GET',
      });

      const responseText = await res.text();
      console.log('Response Text:', responseText);

      if (res.ok) {
        const data = responseText ? JSON.parse(responseText) : { tokens: 0 };
        setTokens(data.tokens);
        setError(null);
      } else {
        const data = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
        setError(data.error);
      }
    } catch (error) {
      console.error('Request failed:', error);
      setError('Failed to fetch tokens');
    }
  };

  const handleTokenOperation = async (action: 'add' | 'deduct', amount: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          amount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTokens(data.tokens);
        setError(null);
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error(`Failed to ${action} tokens:`, error);
      setError(`Failed to ${action} tokens`);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text first');
      return;
    }

    if (tokens === null) {
      setError('Loading token balance...');
      return;
    }

    if (estimatedTokens > tokens) {
      setError('Insufficient tokens for this question');
      return;
    }

    setLoading(true);
    try {
      // Deduct the estimated tokens
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deduct',
          amount: estimatedTokens,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTokens(data.tokens);
        setError(null);
        // Here you could add the actual API call to process the question
        console.log('Question processed successfully');
        setInputText(''); // Clear the input after successful processing
      } else {
        setError(data.error || 'Failed to process question');
      }
    } catch (error) {
      console.error('Failed to process question:', error);
      setError('Failed to process question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className='text-center'>Token Management Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && (
          <div className="p-3 rounded bg-red-100 text-red-700">
            Error: {error}
          </div>
        )}
        
        <div className="text-center text-xl font-semibold">
          {tokens !== null ? (
            <div>Current Tokens: {tokens}</div>
          ) : (
            <div>Loading tokens...</div>
          )}
        </div>

        {/*<div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Test Text Input
          </label>
          <Textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to estimate tokens..."
            className="w-full"
            rows={4}
          />
          <div className="text-sm text-gray-600">
            Estimated tokens: {estimatedTokens}
          </div>
        </div> */}

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => handleTokenOperation('add', 15)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            Add 5 Tokens
          </Button>
          
          <Button
            onClick={() => handleTokenOperation('deduct', 10)}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            Deduct 10 Tokens
          </Button>

          {/*<Button
            onClick={handleAsk}
            disabled={loading || !inputText.trim() || (tokens !== null && estimatedTokens > tokens)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ask
          </Button> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenTester;
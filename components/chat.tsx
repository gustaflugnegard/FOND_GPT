'use client'

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, HelpCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { askQuestion } from "@/utils/api";

interface FormattedResponse {
  answer: string;
  sources: string[];
  confidence: number | null;
  metadata: Record<string, unknown>;
}

const QuestionForm: React.FC = () => {
  const [question, setQuestion] = useState<string>("");
  const [response, setResponse] = useState<FormattedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const result = await askQuestion(question);
      setResponse({
        answer: result.answer || '',
        sources: result.sources || [],
        confidence: result.confidence || null,
        metadata: result.metadata || {}
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatConfidence = (confidence: number): string => {
    const percentage = (confidence * 100).toFixed(1);
    if (parseFloat(percentage) >= 90) return `High (${percentage}%)`;
    if (parseFloat(percentage) >= 70) return `Medium (${percentage}%)`;
    return `Low (${percentage}%)`;
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Q/A Svenska Fonder
          </CardTitle>
          <CardDescription className="text-center">
            Ask questions about Swedish funds and their investments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                value={question}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
                placeholder="E.g., 'Which funds have the highest US exposure?'"
                className="flex-1"
                required
                aria-label="Question input"
              />
              <Button 
                type="submit" 
                disabled={loading || !question.trim()}
                aria-label={loading ? "Loading..." : "Submit question"}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              className="p-0 ml-2 h-auto" 
              onClick={() => setError("")}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Answer</span>
              {response.confidence && (
                <span className="text-sm font-normal text-gray-500">
                  Confidence: {formatConfidence(response.confidence)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                className="space-y-4"
                components={{
                  h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-6 mb-2" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                  p: ({node, ...props}) => <p className="my-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 my-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-2" {...props} />,
                  li: ({node, ...props}) => <li className="my-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-separate border-spacing-0 rounded-lg border border-gray-200 dark:border-gray-700" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => (
                    <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
                  ),
                  th: ({node, ...props}) => (
                    <th 
                      className="sticky top-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100" 
                      {...props}
                    />
                  ),
                  td: ({node, ...props}) => (
                    <td 
                      className="border-b border-gray-200 dark:border-gray-700 px-6 py-3 text-sm"
                      {...props}
                    />
                  ),
                  tr: ({node, ...props}) => (
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      {...props}
                    />
                  ),
                  code: ({node, inline, ...props}) => (
                    inline ? 
                      <code className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm" {...props} /> :
                      <pre className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-x-auto">
                        <code className="text-sm" {...props} />
                      </pre>
                  ),
                }}
              >
                {response.answer || 'No answer available.'}
              </ReactMarkdown>
            </div>
            
            {response.sources && response.sources.length > 0 && (
              <div className="border-t mt-4 pt-4">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  Sources
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </h3>
                <ul className="text-sm text-gray-500 list-disc pl-4">
                  {response.sources.map((source, idx) => (
                    <li key={idx}>{source}</li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(response.metadata).length > 0 && (
              <div className="border-t mt-4 pt-4">
                <h3 className="text-sm font-medium mb-2">Additional Information</h3>
                <pre className="text-sm text-gray-500 overflow-x-auto">
                  {JSON.stringify(response.metadata, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionForm;
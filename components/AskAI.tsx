'use client';
import { useState, ChangeEvent } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CustomCodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}
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

const CustomCodeComponent: Components['code'] = (props) => {
  const { className, children, ...rest } = props;
  const isInline = !className?.includes('language-');

  return isInline ? (
    <code
      className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm"
      {...rest}
    >
      {children}
    </code>
  ) : (
    <pre className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap break-words">
      <code className="text-sm" {...rest}>
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
  const [edgeFunction, setEdgeFunction] = useState('edge2'); // State to store selected edge function

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse('');
    setQuestionTokens(0);
    setError('');

    try {
      // Dynamically set the API route based on selected edge function
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

      // Extract question tokens from headers if needed
      const tokens = res.headers.get('X-Question-Tokens');
      setQuestionTokens(Number(tokens) || 0);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get a response from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="relative flex flex-col items-center justify-center sm:flex-row">
            <select
              value={edgeFunction}
              onChange={(e) => setEdgeFunction(e.target.value)}
              className="p-2 border rounded-md mb-4 sm:mb-0 sm:mr-4"
            >
              <option value="edge2">Fund Database</option>
              <option value="edge1">GPT Knowledge</option>
            </select>
            <CardTitle className="text-2xl font-bold text-center">Q/A Svenska Fonder</CardTitle>
          </div>
          <CardDescription className="text-center w-full">
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
                disabled={isLoading || !question.trim()}
                aria-label={isLoading ? "Loading..." : "Submit question"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
            <small className="text-gray-500">Question Tokens: {questionTokens}</small>


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
            <div className="mt-4">
              <CardTitle className="flex items-center justify-between">
                <span>Answer</span>
              </CardTitle>
              <div className="prose prose-sm max-w-none dark:prose-invert mt-2 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: CustomCodeComponent
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
};

export default AskAI;
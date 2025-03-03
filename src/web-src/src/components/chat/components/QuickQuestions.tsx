import React, { useState, useEffect } from 'react';
import { Button } from '@/ui/button.tsx';
import { Skeleton } from '@/ui/skeleton.tsx';
import { apiService } from '@/services/ApiService.ts';
import { useToast } from '@/hooks/use-toast.ts';

// Interface for quick question items
interface QuickQuestion {
  id: string;
  text: string;
}

// Interface for potential response formats
interface QuickQuestionsResponse {
  questions: QuickQuestion[];
}

interface QuickQuestionsProps {
  onSendMessage: (content: string) => void;
}

const QuickQuestions: React.FC<QuickQuestionsProps> = ({ onSendMessage }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuickQuestion[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuickQuestions = async () => {
      try {
        setLoading(true);
        const response = await apiService.getQuickQuestions();
        
        // Check if the response is an array
        if (Array.isArray(response)) {
          setQuestions(response);
        } else if (response && typeof response === 'object') {
          // Handle case where response is wrapped in an object with a 'questions' property
          const responseObj = response as unknown as QuickQuestionsResponse;
          if ('questions' in responseObj && Array.isArray(responseObj.questions)) {
            setQuestions(responseObj.questions);
          } else {
            console.error('Response does not contain a valid questions array:', response);
            setQuestions([]);
          }
        } else {
          console.error('Unexpected response format:', response);
          setQuestions([]);
        }
      } catch (error) {
        console.error('Error fetching quick questions:', error);
        toast({
          title: 'Failed to load quick questions',
          description: 'Please try refreshing the page.',
          variant: 'destructive',
        });
        // Set empty array on error
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuickQuestions();
  }, [toast]);

  // Render loading skeletons during API call
  if (loading) {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {[...Array(4)].map((_, index) => (
            <Skeleton
              key={index}
              className="h-10 w-full"
            />
          ))}
        </div>
      </div>
    );
  }

  // Return empty div if no questions available
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return null;
  }

  return (
    <div>
      <div className={`grid grid-cols-1 ${
        questions.length <= 4 
          ? 'md:grid-cols-2 lg:grid-cols-4' 
          : 'md:grid-cols-3 lg:grid-cols-6'
      } gap-2 ${
        questions.length > 6 ? 'overflow-x-auto pb-2 flex-nowrap' : ''
      }`}>
        {questions.map((question) => (
          <Button
            key={question.id || `question-${Math.random()}`}
            variant="outline"
            className="h-auto py-2 px-3 justify-start text-left whitespace-normal text-sm"
            onClick={() => onSendMessage(question.text)}
          >
            {question.text}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickQuestions;

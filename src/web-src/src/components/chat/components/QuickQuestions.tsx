
import React from 'react';
import { Button } from '@/ui/button.tsx';

// Predefined questions - reduced to 4 total questions
const predefinedQuestions = [
  "How do I integrate Sealights Java Agent?",
  "How to set up Cucumber.js with Sealights Node Agent?",
  "What is LabId and how can I use it?",
  "What is TIA and how can I use it?",
];

interface QuickQuestionsProps {
  onSendMessage: (content: string) => void;
}

const QuickQuestions: React.FC<QuickQuestionsProps> = ({ onSendMessage }) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {predefinedQuestions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto py-2 px-3 justify-start text-left whitespace-normal text-sm"
            onClick={() => onSendMessage(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickQuestions;

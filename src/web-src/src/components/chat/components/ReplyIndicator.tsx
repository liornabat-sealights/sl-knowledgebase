import React from 'react';
import { X, XCircle, MessageSquareQuote, Quote } from 'lucide-react';
import { Button } from '@/ui/button.tsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { format } from 'date-fns';

// Define the reply reference type
interface ReplyReference {
  messageId: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

interface ReplyIndicatorProps {
  hasReplyContent: boolean;
  replyContent?: string;
  onClearReply?: (messageId?: string) => void;
  // New prop for multiple references
  replyReferences?: ReplyReference[];
}

const ReplyIndicator: React.FC<ReplyIndicatorProps> = ({
                                                         hasReplyContent,
                                                         replyContent = "",
                                                         onClearReply,
                                                         replyReferences = []
                                                       }) => {
  // Return null if no reply content and no references
  if (!hasReplyContent && replyReferences.length === 0) return null;

  // Extract the actual message content - remove the quote formatting if present
  const cleanContent = replyContent.startsWith('> ') 
    ? replyContent.replace(/^> /gm, '') // Remove quote markers
    : replyContent;

  // If we have references, use those. Otherwise use the single replyContent (for backward compatibility)
  const showMultipleReferences = replyReferences.length > 0;

  return (
      <div className="flex flex-col rounded-lg border border-blue-200 dark:border-blue-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 px-3 py-2 border-b border-blue-200 dark:border-blue-900">
          <Quote size={14} className="text-blue-500" />
          <span className="text-muted-foreground flex-1">
            {showMultipleReferences 
              ? `Referencing ${replyReferences.length} message${replyReferences.length > 1 ? 's' : ''}`
              : 'Referencing message'
            }
          </span>
          {onClearReply && !showMultipleReferences && (
              <Button
                  onClick={() => onClearReply()}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <XCircle size={14} />
              </Button>
          )}
          {onClearReply && showMultipleReferences && (
              <Button
                  onClick={() => onClearReply()}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <span className="mr-1">Clear all</span>
                <XCircle size={14} />
              </Button>
          )}
        </div>
        
        {/* Multiple Message References */}
        {showMultipleReferences ? (
          <div className="max-h-[30vh] overflow-y-auto">
            {replyReferences.map((reference) => (
              <div 
                key={reference.messageId}
                className="px-3 py-2 bg-background/50 border-b border-blue-100 dark:border-blue-900/50"
              >
                {/* Reference header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">
                      {reference.isUser ? 'You' : 'Knowledge Base'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      at {format(new Date(reference.timestamp), 'HH:mm:ss')}
                    </span>
                  </div>
                  
                  {/* Remove single reference button */}
                  {onClearReply && (
                    <Button
                      onClick={() => onClearReply(reference.messageId)}
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 rounded-full"
                    >
                      <X size={12} className="text-muted-foreground" />
                    </Button>
                  )}
                </div>
                
                {/* Reference content */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {reference.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single Message Content with Markdown (for backward compatibility) */
          <div 
            className="px-3 py-2 bg-background/50 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
            style={{ maxHeight: '30vh' }} // Limit height to 30% of viewport height
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
  );
};

export default ReplyIndicator;
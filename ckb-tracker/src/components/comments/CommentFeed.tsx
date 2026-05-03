import { useState, useCallback } from 'react';
import { CommentCard } from './CommentCard';
import { CommentThread } from './CommentThread';
import { CommentInput } from './CommentInput';
import { commentsApi } from '@/lib/api';
import type { Comment, User } from '@/types';

interface CommentFeedProps {
  comments: Comment[];
  currentUser: User;
  isLoading: boolean;
  onRefresh: () => void;
  onReplySubmit: (parentId: number, content: string) => Promise<void>;
}

export function CommentFeed({ comments, currentUser, isLoading, onRefresh, onReplySubmit }: CommentFeedProps) {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const handleReply = useCallback(async (content: string) => {
    if (!replyingTo) return;
    await onReplySubmit(replyingTo, content);
    setReplyingTo(null);
  }, [replyingTo, onReplySubmit]);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const canReply = (comment: Comment): boolean => {
    const isAuthor = comment.author?.user_uuid === currentUser.user_uuid;
    const isTarget = comment.target_user?.user_uuid === currentUser.user_uuid;
    return isAuthor || isTarget;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading comments...</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <p className="text-lg">No comments yet</p>
        <p className="text-sm mt-1">When teachers leave feedback, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.comment_uuid} className="space-y-0">
          <CommentCard
            comment={comment}
            currentUser={currentUser}
            onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
            isReplying={replyingTo === comment.id}
            canReply={canReply(comment)}
          />
          {replyingTo === comment.id && (
            <div className="ml-12 mt-2">
              <CommentInput
                onSubmit={handleReply}
                onCancel={cancelReply}
                placeholder={`Reply to ${comment.author?.first_name || 'comment'}...`}
                autoFocus
              />
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-12">
              <CommentThread
                replies={comment.replies}
                currentUser={currentUser}
                onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
                isReplyingTo={replyingTo}
              />
              {replyingTo && comment.replies.some(r => r.id === replyingTo) && (
                <CommentInput
                  onSubmit={handleReply}
                  onCancel={cancelReply}
                  placeholder="Write a reply..."
                  autoFocus
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

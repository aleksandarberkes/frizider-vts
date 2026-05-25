import './feedbackState.css';

type EmptyStateProps = {
  message: string;
  className?: string;
};

function EmptyState({ message, className = '' }: EmptyStateProps) {
  const classes = ['feedback-state', 'feedback-state-empty', className].filter(Boolean).join(' ');

  return <p className={classes}>{message}</p>;
}

export default EmptyState;

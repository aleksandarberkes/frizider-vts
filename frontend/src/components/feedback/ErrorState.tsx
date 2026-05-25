import './feedbackState.css';

type ErrorStateProps = {
  message: string;
  className?: string;
};

function ErrorState({ message, className = '' }: ErrorStateProps) {
  const classes = ['feedback-state', 'feedback-state-error', className].filter(Boolean).join(' ');

  return <p className={classes}>{message}</p>;
}

export default ErrorState;

import './feedbackState.css';

type LoadingStateProps = {
  message?: string;
  className?: string;
};

function LoadingState({ message, className = '' }: LoadingStateProps) {
  const classes = ['feedback-state', 'feedback-state-loading', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status" aria-live="polite">
      <span className="feedback-loader feedback-loader-beat" aria-hidden="true">
        <span className="feedback-loader-dot" />
        <span className="feedback-loader-dot" />
        <span className="feedback-loader-dot" />
      </span>
      {message ? <span className="feedback-state-message feedback-state-message-sr">{message}</span> : null}
    </div>
  );
}

export default LoadingState;

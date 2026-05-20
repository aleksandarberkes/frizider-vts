import { FormEvent } from 'react';
import { RecipeComment } from '../types';
import { formatDate, getCommentAuthor } from '../utils';
import './RecipeCommentsSection.css';

type RecipeCommentsSectionProps = {
  comments: RecipeComment[];
  commentDraft: string;
  commentSaving: boolean;
  currentUserRating?: number;
  ratingBusy: boolean;
  isLoggedIn: boolean;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  onPromptLogin: () => void;
  onRateRecipe: (rating: number) => void;
};

function RecipeCommentsSection({
  comments,
  commentDraft,
  commentSaving,
  currentUserRating,
  ratingBusy,
  isLoggedIn,
  onCommentDraftChange,
  onSubmitComment,
  onPromptLogin,
  onRateRecipe,
}: RecipeCommentsSectionProps) {
  const ratingValues = [1, 2, 3, 4, 5];

  return (
    <section className="recipe-comments">
      <h2>Komentari ({comments.length})</h2>

      <div className="recipe-comments-composer">
        <h3>Dodaj Komentar</h3>
        <p>Vasa Ocena</p>

        <div className="recipe-comments-rating">
          {ratingValues.map((value) => (
            <button
              key={value}
              type="button"
              className={
                (currentUserRating ?? 0) >= value
                  ? 'recipe-comments-star recipe-comments-star-active'
                  : 'recipe-comments-star'
              }
              onClick={() => (isLoggedIn ? onRateRecipe(value) : onPromptLogin())}
              disabled={ratingBusy}
            >
              ★
            </button>
          ))}
        </div>

        {isLoggedIn ? (
          <form className="recipe-comments-form" onSubmit={onSubmitComment}>
            <textarea
              value={commentDraft}
              onChange={(event) => onCommentDraftChange(event.target.value)}
              placeholder="Podelite vase misljenje o receptu..."
              rows={4}
              required
            />
            <button type="submit" disabled={commentSaving}>
              {commentSaving ? 'Objavljivanje...' : 'Objavi Komentar'}
            </button>
          </form>
        ) : (
          <button type="button" className="recipe-comments-login" onClick={onPromptLogin}>
            Uloguj se za komentarisanje
          </button>
        )}
      </div>

      <div className="recipe-comments-list">
        {comments.map((comment) => (
          <article key={comment.id} className="recipe-comments-item">
            <div className="recipe-comments-avatar">
              {getCommentAuthor(comment)
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="recipe-comments-body">
              <div className="recipe-comments-head">
                <strong>{getCommentAuthor(comment)}</strong>
                <span>{formatDate(comment.created_at)}</span>
              </div>
              <div className="recipe-comments-stars" aria-label={`Ocena: ${comment.rating ?? 0} od 5`}>
                {ratingValues.map((value) => (
                  <span
                    key={value}
                    className={
                      (comment.rating ?? 0) >= value
                        ? 'recipe-comments-comment-star recipe-comments-comment-star-active'
                        : 'recipe-comments-comment-star'
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <p>{comment.content}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RecipeCommentsSection;

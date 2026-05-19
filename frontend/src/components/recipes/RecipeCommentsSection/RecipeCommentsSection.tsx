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

      <div className="recipe-comments__composer">
        <h3>Dodaj Komentar</h3>
        <p>Vasa Ocena</p>

        <div className="recipe-comments__rating">
          {ratingValues.map((value) => (
            <button
              key={value}
              type="button"
              className={
                (currentUserRating ?? 0) >= value
                  ? 'recipe-comments__star recipe-comments__star--active'
                  : 'recipe-comments__star'
              }
              onClick={() => (isLoggedIn ? onRateRecipe(value) : onPromptLogin())}
              disabled={ratingBusy}
            >
              ★
            </button>
          ))}
        </div>

        {isLoggedIn ? (
          <form className="recipe-comments__form" onSubmit={onSubmitComment}>
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
          <button type="button" className="recipe-comments__login" onClick={onPromptLogin}>
            Uloguj se za komentarisanje
          </button>
        )}
      </div>

      <div className="recipe-comments__list">
        {comments.map((comment) => (
          <article key={comment.id} className="recipe-comments__item">
            <div className="recipe-comments__avatar">
              {getCommentAuthor(comment)
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="recipe-comments__body">
              <div className="recipe-comments__head">
                <strong>{getCommentAuthor(comment)}</strong>
                <span>{formatDate(comment.created_at)}</span>
              </div>
              <div className="recipe-comments__stars" aria-label={`Ocena: ${comment.rating ?? 0} od 5`}>
                {ratingValues.map((value) => (
                  <span
                    key={value}
                    className={
                      (comment.rating ?? 0) >= value
                        ? 'recipe-comments__comment-star recipe-comments__comment-star--active'
                        : 'recipe-comments__comment-star'
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

import { FormEvent } from 'react';
import ReactStars from 'react-rating-stars-component';
import { RecipeComment } from '../types';
import { formatDate, getCommentAuthor } from '../utils';
import './RecipeCommentsSection.css';

type RecipeCommentsSectionProps = {
  comments: RecipeComment[];
  commentDraft: string;
  commentSaving: boolean;
  commentNotice?: string | null;
  currentUserRating?: number;
  ratingBusy: boolean;
  isLoggedIn: boolean;
  alreadyCommented?: boolean;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  onPromptLogin: () => void;
  onRateRecipe: (rating: number) => void;
};

function RecipeCommentsSection({
  comments,
  commentDraft,
  commentSaving,
  commentNotice,
  currentUserRating,
  ratingBusy,
  isLoggedIn,
  alreadyCommented,
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
          <ReactStars
            classNames="recipe-comments-react-stars"
            count={5}
            value={currentUserRating ?? 0}
            onChange={onRateRecipe}
            size={24}
            char="★"
            isHalf={false}
            color="#d0d5dd"
            edit={isLoggedIn && !ratingBusy}
            activeColor="#ffd700"
            a11y
          />
        </div>

        {!isLoggedIn ? (
          <button type="button" className="recipe-comments-login" onClick={onPromptLogin}>
            Uloguj se za komentarisanje
          </button>
        ) : alreadyCommented ? (
          <p className="recipe-comments-notice">Vec ste komentarisali ovaj recept.</p>
        ) : (
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
            {commentNotice ? <p className="recipe-comments-notice">{commentNotice}</p> : null}
          </form>
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

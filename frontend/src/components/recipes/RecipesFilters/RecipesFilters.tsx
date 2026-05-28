import { useState } from 'react';
import { Category, PriceFilter, RatingFilter, SortBy } from '../types';
import './RecipesFilters.css';

type RecipesFiltersProps = {
  categories: Category[];
  searchTerm: string;
  selectedCategoryId: number | 'all';
  priceFilter: PriceFilter;
  ratingFilter: RatingFilter;
  sortBy: SortBy;
  favoritesOnly: boolean;
  canFilterFavorites: boolean;
  onSearchTermChange: (value: string) => void;
  onSelectedCategoryChange: (value: number | 'all') => void;
  onPriceFilterChange: (value: PriceFilter) => void;
  onRatingFilterChange: (value: RatingFilter) => void;
  onSortByChange: (value: SortBy) => void;
  onFavoritesOnlyChange: () => void;
  onReset: () => void;
};

function RecipesFilters({
  categories,
  searchTerm,
  selectedCategoryId,
  priceFilter,
  ratingFilter,
  sortBy,
  favoritesOnly,
  canFilterFavorites,
  onSearchTermChange,
  onSelectedCategoryChange,
  onPriceFilterChange,
  onRatingFilterChange,
  onSortByChange,
  onFavoritesOnlyChange,
  onReset,
}: RecipesFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <section className={isMobileOpen ? 'recipes-filters recipes-filters-open' : 'recipes-filters'}>
      <button
        type="button"
        className="recipes-filters-toggle"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen((current) => !current)}
      >
        <span className="recipes-filters-toggle-icon" aria-hidden="true" />
        Filteri
      </button>

      <div className="recipes-filters-panel">
        <div className="recipes-filters-heading">
          <span className="recipes-filters-heading-icon" aria-hidden="true" />
          <h2>Filteri</h2>
        </div>

        <label className="recipes-filters-search">
          <span>Naziv recepta</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="npr. Pasta"
          />
        </label>

        <fieldset className="recipes-filters-group">
          <legend>Kategorija</legend>
          <label className="recipes-filters-option">
            <input
              type="checkbox"
              checked={selectedCategoryId === 'all'}
              onChange={() => onSelectedCategoryChange('all')}
            />
            <span>Svi recepti</span>
          </label>
          {categories.map((category) => (
            <label key={category.id} className="recipes-filters-option">
              <input
                type="checkbox"
                checked={selectedCategoryId === category.id}
                onChange={() => onSelectedCategoryChange(category.id)}
              />
              <span>{category.name}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="recipes-filters-group">
          <legend>Cenovni rang</legend>
          <label className="recipes-filters-option">
            <input
              type="radio"
              name="price-filter"
              checked={priceFilter === 'all'}
              onChange={() => onPriceFilterChange('all')}
            />
            <span>Sve</span>
          </label>
          <label className="recipes-filters-option">
            <input
              type="radio"
              name="price-filter"
              checked={priceFilter === 'budget'}
              onChange={() => onPriceFilterChange('budget')}
            />
            <span>do 400 RSD</span>
          </label>
          <label className="recipes-filters-option">
            <input
              type="radio"
              name="price-filter"
              checked={priceFilter === 'mid'}
              onChange={() => onPriceFilterChange('mid')}
            />
            <span>401-800 RSD</span>
          </label>
          <label className="recipes-filters-option">
            <input
              type="radio"
              name="price-filter"
              checked={priceFilter === 'premium'}
              onChange={() => onPriceFilterChange('premium')}
            />
            <span>800+ RSD</span>
          </label>
        </fieldset>

        <fieldset className="recipes-filters-group">
          <legend>Ocena</legend>
          <label className="recipes-filters-option">
            <input
              type="radio"
              name="rating-filter"
              checked={ratingFilter === 'all'}
              onChange={() => onRatingFilterChange('all')}
            />
            <span>Sve ocene</span>
          </label>
          <label className="recipes-filters-option">
            <input
              type="radio"
              name="rating-filter"
              checked={ratingFilter === '4plus'}
              onChange={() => onRatingFilterChange('4plus')}
            />
            <span>4.0+</span>
          </label>
          <label className="recipes-filters-option">
            <input
              type="radio"
              name="rating-filter"
              checked={ratingFilter === '45plus'}
              onChange={() => onRatingFilterChange('45plus')}
            />
            <span>4.5+</span>
          </label>
        </fieldset>

        <label className="recipes-filters-select">
          <span>Sortiranje</span>
          <select value={sortBy} onChange={(event) => onSortByChange(event.target.value as SortBy)}>
            <option value="popular">Najpopularnije</option>
            <option value="newest">Najnovije</option>
            <option value="priceAsc">Cena rastuce</option>
            <option value="priceDesc">Cena opadajuce</option>
            <option value="name">Naziv A-Z</option>
          </select>
        </label>

        {canFilterFavorites ? (
          <label className="recipes-filters-option recipes-filters-favorites">
            <input type="checkbox" checked={favoritesOnly} onChange={onFavoritesOnlyChange} />
            <span>Moji omiljeni</span>
          </label>
        ) : null}

        <button type="button" className="recipes-filters-reset" onClick={onReset}>
          Ponisti filtere
        </button>
      </div>
    </section>
  );
}

export default RecipesFilters;

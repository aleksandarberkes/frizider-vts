import { SortBy } from '../types';
import './RecipesToolbar.css';

type RecipesToolbarProps = {
  count: number;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
};

function RecipesToolbar({ count, sortBy, onSortByChange }: RecipesToolbarProps) {
  return (
    <div className="recipes-toolbar">
      <p>
        Pronadjeno <strong>{count}</strong> recepata
      </p>

      <label className="recipes-toolbar__sort">
        <span>Sortiranje</span>
        <select value={sortBy} onChange={(event) => onSortByChange(event.target.value as SortBy)}>
          <option value="popular">Najpopularnije</option>
          <option value="newest">Najnovije</option>
          <option value="priceAsc">Cena rastuce</option>
          <option value="priceDesc">Cena opadajuce</option>
          <option value="name">Naziv A-Z</option>
        </select>
      </label>
    </div>
  );
}

export default RecipesToolbar;

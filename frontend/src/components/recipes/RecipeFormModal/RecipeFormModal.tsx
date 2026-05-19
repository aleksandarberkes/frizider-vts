import { FormEvent } from 'react';
import { Category, IngredientOption, RecipeFormState } from '../types';
import './RecipeFormModal.css';

type RecipeFormModalProps = {
  isOpen: boolean;
  editingRecipeId: number | null;
  recipeForm: RecipeFormState;
  categories: Category[];
  ingredientsCatalog: IngredientOption[];
  recipeFormError: string | null;
  recipeFormSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof RecipeFormState, value: string | number[]) => void;
  onIngredientRowChange: (
    index: number,
    field: 'ingredient_id' | 'quantity',
    value: string,
  ) => void;
  onAddIngredientRow: () => void;
  onRemoveIngredientRow: (index: number) => void;
  onToggleCategory: (categoryId: number) => void;
};

function RecipeFormModal({
  isOpen,
  editingRecipeId,
  recipeForm,
  categories,
  ingredientsCatalog,
  recipeFormError,
  recipeFormSaving,
  onClose,
  onSubmit,
  onFieldChange,
  onIngredientRowChange,
  onAddIngredientRow,
  onRemoveIngredientRow,
  onToggleCategory,
}: RecipeFormModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="recipe-form-modal__overlay" onClick={onClose} role="presentation">
      <div
        className="recipe-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="recipe-form-modal__header">
          <div>
            <p>{editingRecipeId ? 'Izmena recepta' : 'Novi recept'}</p>
            <h2 id="recipe-form-title">
              {editingRecipeId ? 'Azuriraj svoj recept' : 'Dodaj novi recept'}
            </h2>
          </div>

          <button type="button" onClick={onClose}>
            Zatvori
          </button>
        </div>

        <form className="recipe-form-modal__form" onSubmit={onSubmit}>
          <div className="recipe-form-modal__grid">
            <label>
              <span>Naziv recepta</span>
              <input
                type="text"
                value={recipeForm.name}
                onChange={(event) => onFieldChange('name', event.target.value)}
                required
              />
            </label>

            <label>
              <span>Okvirna cena</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={recipeForm.estimated_price}
                onChange={(event) => onFieldChange('estimated_price', event.target.value)}
              />
            </label>

            <label className="recipe-form-modal__full">
              <span>Slika recepta</span>
              <input
                type="text"
                value={recipeForm.image_path}
                onChange={(event) => onFieldChange('image_path', event.target.value)}
                placeholder="Unesi URL ili naziv fajla"
              />
            </label>

            <label className="recipe-form-modal__full">
              <span>Opis</span>
              <textarea
                rows={4}
                value={recipeForm.description}
                onChange={(event) => onFieldChange('description', event.target.value)}
              />
            </label>
          </div>

          <div className="recipe-form-modal__section">
            <h3>Kategorije</h3>
            <div className="recipe-form-modal__chips">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={
                    recipeForm.categories.includes(category.id)
                      ? 'recipe-form-modal__chip recipe-form-modal__chip--active'
                      : 'recipe-form-modal__chip'
                  }
                  onClick={() => onToggleCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="recipe-form-modal__section">
            <div className="recipe-form-modal__section-header">
              <h3>Namirnice</h3>
              <button type="button" onClick={onAddIngredientRow}>
                Dodaj namirnicu
              </button>
            </div>

            <div className="recipe-form-modal__ingredients">
              {recipeForm.ingredients.map((row, index) => (
                <div key={`ingredient-row-${index}`} className="recipe-form-modal__ingredient-row">
                  <select
                    value={row.ingredient_id}
                    onChange={(event) =>
                      onIngredientRowChange(index, 'ingredient_id', event.target.value)
                    }
                  >
                    <option value="">Izaberi namirnicu</option>
                    {ingredientsCatalog.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({ingredient.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.quantity}
                    onChange={(event) => onIngredientRowChange(index, 'quantity', event.target.value)}
                    placeholder="Kolicina"
                  />

                  <button type="button" onClick={() => onRemoveIngredientRow(index)}>
                    Ukloni
                  </button>
                </div>
              ))}
            </div>
          </div>

          {recipeFormError ? <p className="recipe-form-modal__error">{recipeFormError}</p> : null}

          <div className="recipe-form-modal__actions">
            <button type="button" className="recipe-form-modal__ghost" onClick={onClose}>
              Odustani
            </button>
            <button type="submit" className="recipe-form-modal__submit" disabled={recipeFormSaving}>
              {recipeFormSaving ? 'Cuvanje...' : editingRecipeId ? 'Sacuvaj izmene' : 'Objavi recept'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecipeFormModal;

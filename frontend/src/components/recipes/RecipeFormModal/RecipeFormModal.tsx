import { ChangeEvent, DragEvent, FormEvent, useRef } from 'react';
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
  imagePreviewUrl: string;
  hasSelectedImage: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof RecipeFormState, value: string | number[]) => void;
  onImageFileChange: (file: File | null) => void;
  onIngredientRowChange: (
    index: number,
    field: 'ingredient_id' | 'ingredient_name' | 'unit' | 'quantity',
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
  imagePreviewUrl,
  hasSelectedImage,
  onClose,
  onSubmit,
  onFieldChange,
  onImageFileChange,
  onIngredientRowChange,
  onAddIngredientRow,
  onRemoveIngredientRow,
  onToggleCategory,
}: RecipeFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0] ?? null;
    onImageFileChange(file);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onImageFileChange(file);
    event.target.value = '';
  };

  return (
    <div className="recipe-form-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="recipe-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="recipe-form-modal-header">
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

        <form className="recipe-form-modal-form" onSubmit={onSubmit}>
          <div className="recipe-form-modal-grid">
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

            <label className="recipe-form-modal-full">
              <span>Slika recepta</span>
              <label
                className="recipe-form-modal-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileInput}
                  hidden
                />

                {imagePreviewUrl ? (
                  <img className="recipe-form-modal-preview" src={imagePreviewUrl} alt="Pregled recepta" />
                ) : (
                  <div className="recipe-form-modal-dropzone-copy">
                    <strong>Prevuci sliku ovde</strong>
                    <p>Ili klikni da izaberes fajl sa racunara</p>
                  </div>
                )}

                <div className="recipe-form-modal-dropzone-actions">
                  <button type="button" onClick={() => fileInputRef.current?.click()}>
                    Izaberi sliku
                  </button>
                  {hasSelectedImage ? (
                    <button type="button" onClick={() => onImageFileChange(null)}>
                      Ukloni sliku
                    </button>
                  ) : null}
                </div>
              </label>
            </label>

            <label className="recipe-form-modal-full">
              <span>Ili unesi URL slike</span>
              <input
                type="text"
                value={recipeForm.image_path}
                onChange={(event) => onFieldChange('image_path', event.target.value)}
                placeholder="https://... ili ostavi prazno ako uploadujes fajl"
              />
            </label>

            <label className="recipe-form-modal-full">
              <span>Opis</span>
              <textarea
                rows={4}
                value={recipeForm.description}
                onChange={(event) => onFieldChange('description', event.target.value)}
              />
            </label>
          </div>

          <div className="recipe-form-modal-section">
            <h3>Kategorije</h3>
            <div className="recipe-form-modal-chips">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={
                    recipeForm.categories.includes(category.id)
                      ? 'recipe-form-modal-chip recipe-form-modal-chip-active'
                      : 'recipe-form-modal-chip'
                  }
                  onClick={() => onToggleCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="recipe-form-modal-section">
            <div className="recipe-form-modal-section-header">
              <h3>Namirnice</h3>
              <button type="button" onClick={onAddIngredientRow}>
                Dodaj namirnicu
              </button>
            </div>

            <div className="recipe-form-modal-ingredients">
              <datalist id="recipe-form-ingredient-suggestions">
                {ingredientsCatalog.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.name}>
                    {ingredient.unit}
                  </option>
                ))}
              </datalist>

              {recipeForm.ingredients.map((row, index) => (
                <div key={`ingredient-row-${index}`} className="recipe-form-modal-ingredient-row">
                  <input
                    type="text"
                    list="recipe-form-ingredient-suggestions"
                    value={row.ingredient_name}
                    onChange={(event) =>
                      onIngredientRowChange(index, 'ingredient_name', event.target.value)
                    }
                    placeholder="Naziv namirnice"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.quantity}
                    onChange={(event) => onIngredientRowChange(index, 'quantity', event.target.value)}
                    placeholder="Kolicina"
                  />

                  <input
                    type="text"
                    value={row.unit}
                    onChange={(event) => onIngredientRowChange(index, 'unit', event.target.value)}
                    placeholder="Jedinica mere"
                  />

                  <button type="button" onClick={() => onRemoveIngredientRow(index)}>
                    Ukloni
                  </button>
                </div>
              ))}
            </div>
          </div>

          {recipeFormError ? <p className="recipe-form-modal-error">{recipeFormError}</p> : null}

          <div className="recipe-form-modal-actions">
            <button type="button" className="recipe-form-modal-ghost" onClick={onClose}>
              Odustani
            </button>
            <button type="submit" className="recipe-form-modal-submit" disabled={recipeFormSaving}>
              {recipeFormSaving ? 'Cuvanje...' : editingRecipeId ? 'Sacuvaj izmene' : 'Objavi recept'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecipeFormModal;

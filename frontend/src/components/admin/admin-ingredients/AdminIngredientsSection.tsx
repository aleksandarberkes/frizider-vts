import { FormEvent } from 'react';
import EmptyState from '../../feedback/EmptyState';
import LoadingState from '../../feedback/LoadingState';
import { IngredientOption } from '../../recipes/types';

type AdminIngredientsSectionProps = {
  ingredients: IngredientOption[];
  loading: boolean;
  ingredientName: string;
  ingredientUnit: string;
  editingIngredientId: number | null;
  ingredientSubmitting: boolean;
  ingredientDeletingId: number | null;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onStartEdit: (ingredient: IngredientOption) => void;
  onDelete: (ingredientId: number) => void;
};

function AdminIngredientsSection({
  ingredients,
  loading,
  ingredientName,
  ingredientUnit,
  editingIngredientId,
  ingredientSubmitting,
  ingredientDeletingId,
  onNameChange,
  onUnitChange,
  onSubmit,
  onReset,
  onStartEdit,
  onDelete,
}: AdminIngredientsSectionProps) {
  return (
    <article className="admin-dashboard-card">
      <div className="admin-dashboard-card-head">
        <div>
          <h2>Namirnice</h2>
          <p>Dodavanje, izmena i brisanje namirnica (naziv i jedinica mere).</p>
        </div>
      </div>

      <form className="admin-dashboard-form" onSubmit={onSubmit}>
        <label className="admin-dashboard-field">
          <span>Naziv namirnice</span>
          <input
            type="text"
            value={ingredientName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="npr. Brasno"
            disabled={ingredientSubmitting}
          />
        </label>
        <label className="admin-dashboard-field">
          <span>Jedinica mere</span>
          <input
            type="text"
            value={ingredientUnit}
            onChange={(event) => onUnitChange(event.target.value)}
            placeholder="npr. g, kom, ml"
            disabled={ingredientSubmitting}
          />
        </label>

        <div className="admin-dashboard-form-actions">
          <button type="submit" className="admin-dashboard-primary" disabled={ingredientSubmitting}>
            {ingredientSubmitting
              ? editingIngredientId
                ? 'Cuvanje...'
                : 'Dodavanje...'
              : editingIngredientId
                ? 'Sacuvaj izmenu'
                : 'Dodaj namirnicu'}
          </button>
          {editingIngredientId ? (
            <button
              type="button"
              className="admin-dashboard-secondary"
              onClick={onReset}
              disabled={ingredientSubmitting}
            >
              Odustani
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <LoadingState className="admin-dashboard-empty" message="Ucitavanje namirnica..." />
      ) : ingredients.length === 0 ? (
        <EmptyState className="admin-dashboard-empty" message="Nema unetih namirnica." />
      ) : (
        <table className="admin-dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Naziv</th>
              <th>Jedinica</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ingredient) => (
              <tr key={ingredient.id}>
                <td>{ingredient.id}</td>
                <td>{ingredient.name}</td>
                <td>{ingredient.unit}</td>
                <td className="admin-dashboard-row-actions">
                  <button
                    type="button"
                    className="admin-dashboard-secondary"
                    onClick={() => onStartEdit(ingredient)}
                    disabled={ingredientSubmitting || ingredientDeletingId === ingredient.id}
                  >
                    Izmeni
                  </button>
                  <button
                    type="button"
                    className="admin-dashboard-danger"
                    onClick={() => onDelete(ingredient.id)}
                    disabled={ingredientDeletingId === ingredient.id}
                  >
                    {ingredientDeletingId === ingredient.id ? 'Brisem...' : 'Obrisi'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}

export default AdminIngredientsSection;

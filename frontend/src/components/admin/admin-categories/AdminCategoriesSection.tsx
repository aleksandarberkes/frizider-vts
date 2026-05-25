import { FormEvent } from 'react';
import { Category } from '../../recipes/types';

type AdminCategoriesSectionProps = {
  categories: Category[];
  loading: boolean;
  categoryName: string;
  editingCategoryId: number | null;
  categorySubmitting: boolean;
  categoryDeletingId: number | null;
  onCategoryNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onStartEdit: (category: Category) => void;
  onDelete: (categoryId: number) => void;
};

function AdminCategoriesSection({
  categories,
  loading,
  categoryName,
  editingCategoryId,
  categorySubmitting,
  categoryDeletingId,
  onCategoryNameChange,
  onSubmit,
  onReset,
  onStartEdit,
  onDelete,
}: AdminCategoriesSectionProps) {
  return (
    <article className="admin-dashboard-card">
      <div className="admin-dashboard-card-head">
        <div>
          <h2>Kategorije recepata</h2>
          <p>Dodavanje, izmena i brisanje kategorija koje koriste recepti i filteri.</p>
        </div>
      </div>

      <form className="admin-dashboard-form" onSubmit={onSubmit}>
        <label className="admin-dashboard-field">
          <span>Naziv kategorije</span>
          <input
            type="text"
            value={categoryName}
            onChange={(event) => onCategoryNameChange(event.target.value)}
            placeholder="npr. Dorucak"
            disabled={categorySubmitting}
          />
        </label>

        <div className="admin-dashboard-form-actions">
          <button type="submit" className="admin-dashboard-primary" disabled={categorySubmitting}>
            {categorySubmitting
              ? editingCategoryId
                ? 'Cuvanje...'
                : 'Dodavanje...'
              : editingCategoryId
                ? 'Sacuvaj izmenu'
                : 'Dodaj kategoriju'}
          </button>
          {editingCategoryId ? (
            <button
              type="button"
              className="admin-dashboard-secondary"
              onClick={onReset}
              disabled={categorySubmitting}
            >
              Odustani
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <p className="admin-dashboard-empty">Ucitavanje kategorija...</p>
      ) : categories.length === 0 ? (
        <p className="admin-dashboard-empty">Nema unetih kategorija.</p>
      ) : (
        <table className="admin-dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Naziv</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td className="admin-dashboard-row-actions">
                  <button
                    type="button"
                    className="admin-dashboard-secondary"
                    onClick={() => onStartEdit(category)}
                    disabled={categorySubmitting || categoryDeletingId === category.id}
                  >
                    Izmeni
                  </button>
                  <button
                    type="button"
                    className="admin-dashboard-danger"
                    onClick={() => onDelete(category.id)}
                    disabled={categoryDeletingId === category.id}
                  >
                    {categoryDeletingId === category.id ? 'Brisem...' : 'Obrisi'}
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

export default AdminCategoriesSection;

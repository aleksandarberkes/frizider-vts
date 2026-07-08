import { useCallback, useEffect, useState } from 'react';
import { recipesApi } from '../services/recipesApi';
import {
  mealPlansApi,
  WeeklyMenu,
  WeeklyMenuItemPayload,
  WeeklyMenuSummary,
} from '../services/mealPlansApi';
import { Recipe } from '../components/recipes/types';
import './WeeklyPlan.css';

const dayOptions = [
  { value: 1, label: 'Ponedeljak' },
  { value: 2, label: 'Utorak' },
  { value: 3, label: 'Sreda' },
  { value: 4, label: 'Četvrtak' },
  { value: 5, label: 'Petak' },
  { value: 6, label: 'Subota' },
  { value: 7, label: 'Nedelja' },
];

type FormRow = {
  day_of_week: string;
  recipe_id: string;
};

const emptyRow = (): FormRow => ({
  day_of_week: '1',
  recipe_id: '',
});

function WeeklyPlan() {
  const [menus, setMenus] = useState<WeeklyMenuSummary[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenu | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [name, setName] = useState('');
  const [rows, setRows] = useState<FormRow[]>([emptyRow()]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillFormFromMenu = useCallback((menu: WeeklyMenu) => {
    setEditingId(menu.id);
    setName(menu.name);

    const nextRows = menu.days.flatMap((day) =>
      day.recipes.map((item) => ({
        day_of_week: String(day.day_of_week),
        recipe_id: String(item.recipe_id),
      })),
    );

    setRows(nextRows.length > 0 ? nextRows : [emptyRow()]);
  }, []);

  const loadMenu = useCallback(async (menuId: number) => {
    const menu = await mealPlansApi.get(menuId);
    setSelectedMenu(menu);
    fillFormFromMenu(menu);
  }, [fillFormFromMenu]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [menusResponse, recipesResponse] = await Promise.all([
        mealPlansApi.list(),
        recipesApi.list(),
      ]);

      setMenus(menusResponse);
      setRecipes(recipesResponse);

      if (menusResponse[0]) {
        await loadMenu(menusResponse[0].id);
      } else {
        setSelectedMenu(null);
        setEditingId(null);
        setName('');
        setRows([emptyRow()]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Učitavanje jelovnika nije uspelo.');
    } finally {
      setLoading(false);
    }
  }, [loadMenu]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const startNewMenu = () => {
    setSelectedMenu(null);
    setEditingId(null);
    setName('');
    setRows([emptyRow()]);
    setError(null);
  };

  const updateRow = (index: number, field: keyof FormRow, value: string) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const removeRow = (index: number) => {
    setRows((current) => {
      const nextRows = current.filter((_, rowIndex) => rowIndex !== index);
      return nextRows.length > 0 ? nextRows : [emptyRow()];
    });
  };

  const buildPayloadItems = (): WeeklyMenuItemPayload[] =>
    rows
      .filter((row) => row.recipe_id !== '')
      .map((row) => ({
        day_of_week: Number(row.day_of_week),
        recipe_id: Number(row.recipe_id),
      }));

  const saveMenu = async () => {
    const cleanedName = name.trim();
    const items = buildPayloadItems();

    if (!cleanedName) {
      setError('Naziv jelovnika je obavezan.');
      return;
    }

    if (items.length === 0) {
      setError('Dodajte bar jedan recept u jelovnik.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const savedMenu = editingId
        ? await mealPlansApi.update(editingId, { name: cleanedName, items })
        : await mealPlansApi.create({ name: cleanedName, items });

      const nextMenus = await mealPlansApi.list();
      setMenus(nextMenus);
      setSelectedMenu(savedMenu);
      fillFormFromMenu(savedMenu);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Čuvanje jelovnika nije uspelo.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMenu = async () => {
    if (!selectedMenu) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await mealPlansApi.delete(selectedMenu.id);
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brisanje jelovnika nije uspelo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="fridge-content-card">
        <p>Učitavanje jelovnika...</p>
      </section>
    );
  }

  return (
    <section className="weekly-plan-page">
      <header className="weekly-plan-header">
        <h2>Nedeljni jelovnik</h2>
        <p>Kreirajte jelovnik po danima. Za svaki dan birate jedan ili više recepata.</p>

        <div className="weekly-plan-actions">
          <button type="button" className="weekly-plan-button" onClick={startNewMenu}>
            Novi jelovnik
          </button>
        </div>
      </header>

      {error ? <p className="weekly-plan-error">{error}</p> : null}

      <div className="weekly-plan-layout">
        <aside className="weekly-plan-card">
          <h3>Moji jelovnici</h3>

          <div className="weekly-plan-menu-list">
            {menus.length === 0 ? (
              <p className="weekly-plan-empty">Još nema kreiranih jelovnika.</p>
            ) : (
              menus.map((menu) => (
                <button
                  type="button"
                  key={menu.id}
                  className={selectedMenu?.id === menu.id ? 'active' : ''}
                  onClick={() => void loadMenu(menu.id)}
                >
                  <strong>{menu.name}</strong>
                  <span>{menu.recipe_count} recepta</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="weekly-plan-card">
          <h3>{selectedMenu ? selectedMenu.name : 'Novi jelovnik'}</h3>

          {selectedMenu ? (
            <div className="weekly-plan-days">
              {selectedMenu.days.map((day) => (
                <article className="weekly-plan-day" key={day.day_of_week}>
                  <h4>{day.day_name}</h4>

                  {day.recipes.length === 0 ? (
                    <p className="weekly-plan-empty">Nema recepata za ovaj dan.</p>
                  ) : (
                    <ul>
                      {day.recipes.map((item) => (
                        <li key={item.item_id}>{item.recipe.name}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="weekly-plan-message">Popunite formu ispod da dodate novi jelovnik.</p>
          )}

          <div className="weekly-plan-form">
            <label className="weekly-plan-field">
              <span>Naziv jelovnika</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Npr. Moj nedeljni jelovnik"
              />
            </label>

            {rows.map((row, index) => (
              <div className="weekly-plan-form-row" key={`${index}-${row.day_of_week}-${row.recipe_id}`}>
                <label className="weekly-plan-field">
                  <span>Dan</span>
                  <select
                    value={row.day_of_week}
                    onChange={(event) => updateRow(index, 'day_of_week', event.target.value)}
                  >
                    {dayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="weekly-plan-field">
                  <span>Recept</span>
                  <select
                    value={row.recipe_id}
                    onChange={(event) => updateRow(index, 'recipe_id', event.target.value)}
                  >
                    <option value="">Izaberite recept</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="weekly-plan-button secondary"
                  onClick={() => removeRow(index)}
                >
                  Ukloni
                </button>
              </div>
            ))}

            <div className="weekly-plan-actions">
              <button
                type="button"
                className="weekly-plan-button secondary"
                onClick={() => setRows((current) => [...current, emptyRow()])}
              >
                Dodaj dan/recept
              </button>

              <button
                type="button"
                className="weekly-plan-button"
                onClick={() => void saveMenu()}
                disabled={saving}
              >
                {editingId ? 'Sačuvaj izmene' : 'Sačuvaj jelovnik'}
              </button>

              {selectedMenu ? (
                <button
                  type="button"
                  className="weekly-plan-button danger"
                  onClick={() => void deleteMenu()}
                  disabled={saving}
                >
                  Obriši jelovnik
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WeeklyPlan;

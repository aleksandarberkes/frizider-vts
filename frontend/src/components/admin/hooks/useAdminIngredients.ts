import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IngredientOption } from '../../recipes/types';
import { ingredientsApi } from '../../../services/ingredientsApi';
import { mapAdminError } from './mapAdminError';

const sortByName = (list: IngredientOption[]) =>
  [...list].sort((left, right) => left.name.localeCompare(right.name, 'sr'));

function useAdminIngredients() {
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(null);
  const [ingredientSubmitting, setIngredientSubmitting] = useState(false);
  const [ingredientDeletingId, setIngredientDeletingId] = useState<number | null>(null);

  const loadIngredients = useCallback(async () => {
    setLoadingIngredients(true);

    try {
      const response = await ingredientsApi.list();
      setIngredients(sortByName(response));
      setIngredientsError(null);
    } catch (err) {
      setIngredientsError(mapAdminError(err, 'Ucitavanje namirnica nije uspelo.'));
    } finally {
      setLoadingIngredients(false);
    }
  }, []);

  useEffect(() => {
    void loadIngredients();
  }, [loadIngredients]);

  const resetIngredientForm = useCallback(() => {
    setIngredientName('');
    setIngredientUnit('');
    setEditingIngredientId(null);
  }, []);

  const submitIngredient = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const name = ingredientName.trim();
      const unit = ingredientUnit.trim();
      if (!name || !unit) {
        setIngredientsError('Naziv i jedinica mere su obavezni.');
        return;
      }

      setIngredientSubmitting(true);
      setIngredientsError(null);

      try {
        if (editingIngredientId) {
          const updated = await ingredientsApi.update(editingIngredientId, name, unit);
          setIngredients((current) =>
            sortByName(current.map((item) => (item.id === editingIngredientId ? updated : item))),
          );
        } else {
          const created = await ingredientsApi.create(name, unit);
          setIngredients((current) => sortByName([...current, created]));
        }
        resetIngredientForm();
      } catch (err) {
        setIngredientsError(
          mapAdminError(
            err,
            editingIngredientId ? 'Izmena namirnice nije uspela.' : 'Dodavanje namirnice nije uspelo.',
          ),
        );
      } finally {
        setIngredientSubmitting(false);
      }
    },
    [ingredientName, ingredientUnit, editingIngredientId, resetIngredientForm],
  );

  const startEditIngredient = useCallback((ingredient: IngredientOption) => {
    setIngredientName(ingredient.name);
    setIngredientUnit(ingredient.unit);
    setEditingIngredientId(ingredient.id);
    setIngredientsError(null);
  }, []);

  const deleteIngredient = useCallback(
    async (ingredientId: number) => {
      setIngredientDeletingId(ingredientId);
      setIngredientsError(null);

      try {
        await ingredientsApi.remove(ingredientId);
        setIngredients((current) => current.filter((item) => item.id !== ingredientId));
        if (editingIngredientId === ingredientId) {
          resetIngredientForm();
        }
      } catch (err) {
        setIngredientsError(mapAdminError(err, 'Brisanje namirnice nije uspelo.'));
      } finally {
        setIngredientDeletingId(null);
      }
    },
    [editingIngredientId, resetIngredientForm],
  );

  return {
    ingredients,
    loadingIngredients,
    ingredientsError,
    ingredientName,
    ingredientUnit,
    editingIngredientId,
    ingredientSubmitting,
    ingredientDeletingId,
    setIngredientName,
    setIngredientUnit,
    loadIngredients,
    submitIngredient,
    resetIngredientForm,
    startEditIngredient,
    deleteIngredient,
  };
}

export default useAdminIngredients;

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Category } from '../../recipes/types';
import { categoriesApi } from '../../../services/categoriesApi';
import { mapAdminError } from './mapAdminError';

function useAdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryDeletingId, setCategoryDeletingId] = useState<number | null>(null);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);

    try {
      const categoriesResponse = await categoriesApi.list();
      setCategories(categoriesResponse);
      setCategoriesError(null);
    } catch (err) {
      setCategoriesError(mapAdminError(err, 'Ucitavanje kategorija nije uspelo.'));
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const resetCategoryForm = useCallback(() => {
    setCategoryName('');
    setEditingCategoryId(null);
  }, []);

  const submitCategory = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = categoryName.trim();
      if (!trimmedName) {
        setCategoriesError('Naziv kategorije je obavezan.');
        return;
      }

      setCategorySubmitting(true);
      setCategoriesError(null);

      try {
        if (editingCategoryId) {
          const updatedCategory = await categoriesApi.update(editingCategoryId, trimmedName);
          setCategories((current) =>
            current
              .map((category) => (category.id === editingCategoryId ? updatedCategory : category))
              .sort((left, right) => left.name.localeCompare(right.name, 'sr')),
          );
        } else {
          const createdCategory = await categoriesApi.create(trimmedName);
          setCategories((current) =>
            [...current, createdCategory].sort((left, right) => left.name.localeCompare(right.name, 'sr')),
          );
        }

        resetCategoryForm();
      } catch (err) {
        setCategoriesError(
          mapAdminError(
            err,
            editingCategoryId ? 'Izmena kategorije nije uspela.' : 'Dodavanje kategorije nije uspelo.',
          ),
        );
      } finally {
        setCategorySubmitting(false);
      }
    },
    [categoryName, editingCategoryId, resetCategoryForm],
  );

  const startEditCategory = useCallback((category: Category) => {
    setCategoryName(category.name);
    setEditingCategoryId(category.id);
    setCategoriesError(null);
  }, []);

  const deleteCategory = useCallback(
    async (categoryId: number) => {
      setCategoryDeletingId(categoryId);
      setCategoriesError(null);

      try {
        await categoriesApi.delete(categoryId);
        setCategories((current) => current.filter((category) => category.id !== categoryId));

        if (editingCategoryId === categoryId) {
          resetCategoryForm();
        }
      } catch (err) {
        setCategoriesError(mapAdminError(err, 'Brisanje kategorije nije uspelo.'));
      } finally {
        setCategoryDeletingId(null);
      }
    },
    [editingCategoryId, resetCategoryForm],
  );

  return {
    categories,
    loadingCategories,
    categoriesError,
    categoryName,
    editingCategoryId,
    categorySubmitting,
    categoryDeletingId,
    setCategoryName,
    loadCategories,
    submitCategory,
    resetCategoryForm,
    startEditCategory,
    deleteCategory,
  };
}

export default useAdminCategories;

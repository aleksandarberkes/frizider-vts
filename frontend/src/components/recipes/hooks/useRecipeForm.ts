import { FormEvent, useEffect, useState } from 'react';
import { User } from '../../../auth/types';
import { ingredientsApi } from '../../../services/ingredientsApi';
import { RecipePayload, recipesApi } from '../../../services/recipesApi';
import { mapApiError } from '../../../utils/mapApiError';
import {
  IngredientOption,
  Recipe,
  RecipeFormIngredient,
  RecipeFormState,
} from '../types';
import {
  emptyRecipeForm,
  emptyRecipeIngredientRow,
  findIngredientByName,
} from '../utils';

type UseRecipeFormParams = {
  user: User | null;
  ingredientsCatalog: IngredientOption[];
  onIngredientsCreated: (ingredients: IngredientOption[]) => void;
  onSaved: () => Promise<void> | void;
  onLoginRequired: () => void;
  saveRecipe: (payload: RecipePayload, editingRecipeId: number | null) => Promise<void>;
};

const recipeToFormState = (recipe: Recipe): RecipeFormState => ({
  name: recipe.name,
  description: recipe.description ?? '',
  image_path: recipe.image_path ?? '',
  estimated_price: recipe.estimated_price?.toString() ?? '',
  categories: recipe.categories
    .map((category) =>
      typeof category.category_id === 'number' ? category.category_id : category.id,
    )
    .filter((categoryId): categoryId is number => typeof categoryId === 'number'),
  ingredients:
    recipe.ingredients.length > 0
      ? recipe.ingredients.map((ingredient) => ({
          ingredient_id: ingredient.ingredient_id.toString(),
          ingredient_name: ingredient.name,
          unit: ingredient.unit,
          quantity: ingredient.quantity?.toString() ?? '',
        }))
      : [emptyRecipeIngredientRow()],
});

export function useRecipeForm({
  user,
  ingredientsCatalog,
  onIngredientsCreated,
  onSaved,
  onLoginRequired,
  saveRecipe,
}: UseRecipeFormParams) {
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [recipeForm, setRecipeForm] = useState<RecipeFormState>(emptyRecipeForm);
  const [recipeFormError, setRecipeFormError] = useState<string | null>(null);
  const [recipeFormSaving, setRecipeFormSaving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  useEffect(() => {
    if (!selectedImageFile) {
      setImagePreviewUrl(recipeForm.image_path.trim());
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImageFile, recipeForm.image_path]);

  const openCreateRecipeForm = () => {
    if (!user) {
      onLoginRequired();
      return;
    }

    setEditingRecipeId(null);
    setRecipeForm(emptyRecipeForm());
    setSelectedImageFile(null);
    setImagePreviewUrl('');
    setRecipeFormError(null);
    setShowRecipeForm(true);
  };

  const openEditRecipeForm = (recipe: Recipe | null) => {
    if (!recipe) {
      return;
    }

    setEditingRecipeId(recipe.id);
    setRecipeForm(recipeToFormState(recipe));
    setSelectedImageFile(null);
    setImagePreviewUrl(recipe.image_path ?? '');
    setRecipeFormError(null);
    setShowRecipeForm(true);
  };

  const closeRecipeForm = () => {
    setShowRecipeForm(false);
    setEditingRecipeId(null);
    setSelectedImageFile(null);
    setImagePreviewUrl('');
    setRecipeFormError(null);
  };

  const updateRecipeFormField = (field: keyof RecipeFormState, value: string | number[]) => {
    if (field === 'image_path' && selectedImageFile) {
      setSelectedImageFile(null);
    }
    setRecipeForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateRecipeImageFile = (file: File | null) => {
    if (!file) {
      setSelectedImageFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setRecipeFormError('Mozes da dodas samo sliku za recept.');
      return;
    }

    setRecipeFormError(null);
    setRecipeForm((current) => ({
      ...current,
      image_path: '',
    }));
    setSelectedImageFile(file);
  };

  const handleIngredientRowChange = (
    index: number,
    field: keyof RecipeFormIngredient,
    value: string,
  ) => {
    const nextRows = recipeForm.ingredients.map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row;
      }

      const nextRow = { ...row, [field]: value };
      if (field === 'ingredient_name') {
        const matchedIngredient = findIngredientByName(ingredientsCatalog, value);
        nextRow.ingredient_id = matchedIngredient ? matchedIngredient.id.toString() : '';
        if (matchedIngredient && nextRow.unit.trim() === '') {
          nextRow.unit = matchedIngredient.unit;
        }
      }

      return nextRow;
    });
    setRecipeForm((current) => ({
      ...current,
      ingredients: nextRows,
    }));
  };

  const addIngredientRow = () => {
    setRecipeForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, emptyRecipeIngredientRow()],
    }));
  };

  const removeIngredientRow = (index: number) => {
    const nextRows = recipeForm.ingredients.filter((_, rowIndex) => rowIndex !== index);
    setRecipeForm((current) => ({
      ...current,
      ingredients: nextRows.length > 0 ? nextRows : [emptyRecipeIngredientRow()],
    }));
  };

  const toggleFormCategory = (categoryId: number) => {
    const hasCategory = recipeForm.categories.includes(categoryId);
    setRecipeForm((current) => ({
      ...current,
      categories: hasCategory
        ? current.categories.filter((id) => id !== categoryId)
        : [...current.categories, categoryId],
    }));
  };

  const submitRecipeForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      onLoginRequired();
      return;
    }

    const ingredientRows = recipeForm.ingredients.filter(
      (row) => row.ingredient_name.trim() !== '' || row.quantity.trim() !== '' || row.unit.trim() !== '',
    );

    if (ingredientRows.length === 0) {
      setRecipeFormError('Dodaj barem jednu namirnicu za recept.');
      return;
    }

    setRecipeFormSaving(true);
    setRecipeFormError(null);

    try {
      const createdIngredients: IngredientOption[] = [];
      const cleanedIngredients = [];

      for (const row of ingredientRows) {
        const ingredientName = row.ingredient_name.trim();
        const unit = row.unit.trim();

        if (ingredientName === '') {
          setRecipeFormError('Svaka namirnica mora da ima naziv.');
          return;
        }

        if (unit === '') {
          setRecipeFormError(`Unesi jedinicu mere za "${ingredientName}".`);
          return;
        }

        const matchedIngredient = findIngredientByName(
          [...ingredientsCatalog, ...createdIngredients],
          ingredientName,
        );

        let ingredientId: number;
        if (matchedIngredient) {
          ingredientId = matchedIngredient.id;
        } else {
          const createdIngredient = await ingredientsApi.create(ingredientName, unit);
          createdIngredients.push(createdIngredient);
          ingredientId = createdIngredient.id;
        }

        cleanedIngredients.push({
          ingredient_id: ingredientId,
          quantity: row.quantity.trim() === '' ? null : Number(row.quantity),
        });
      }

      let imagePath = recipeForm.image_path.trim();
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('image', selectedImageFile);
        const uploadResponse = await recipesApi.uploadImage(formData);
        imagePath = uploadResponse.path;
      }

      await saveRecipe(
        {
          name: recipeForm.name.trim(),
          description: recipeForm.description.trim(),
          image_path: imagePath,
          estimated_price:
            recipeForm.estimated_price.trim() === '' ? null : Number(recipeForm.estimated_price),
          ingredients: cleanedIngredients,
          categories: recipeForm.categories,
        },
        editingRecipeId,
      );

      if (createdIngredients.length > 0) {
        onIngredientsCreated(createdIngredients);
      }

      closeRecipeForm();
      await onSaved();
    } catch (err) {
      setRecipeFormError(mapApiError(err, 'Cuvanje recepta nije uspelo.'));
    } finally {
      setRecipeFormSaving(false);
    }
  };

  return {
    showRecipeForm,
    editingRecipeId,
    recipeForm,
    recipeFormError,
    recipeFormSaving,
    imagePreviewUrl,
    hasSelectedImage: !!selectedImageFile || recipeForm.image_path.trim() !== '',
    openCreateRecipeForm,
    openEditRecipeForm,
    closeRecipeForm,
    submitRecipeForm,
    updateRecipeFormField,
    updateRecipeImageFile,
    handleIngredientRowChange,
    addIngredientRow,
    removeIngredientRow,
    toggleFormCategory,
  };
}

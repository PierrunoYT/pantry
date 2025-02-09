import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

export type ApiRecipe = {
  id: string;
  title: string;
  description: string | null;
  instructions: string;
  imageUrl: string | null;
  ingredients: {
    quantity: number;
    unit: string;
    ingredient: {
      name: string;
    };
  }[];
  categories: {
    category: {
      name: string;
    };
  }[];
};

interface RecipeFormProps {
  onClose: () => void;
  initialData?: ApiRecipe;
}

const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
});

const recipeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().min(1, 'Instructions are required'),
  imageUrl: z.union([
    z.string().url('Invalid URL format'),
    z.string().length(0),
    z.null()
  ]).optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
  categories: z.array(z.string().min(1, 'Category name is required')).min(1, 'At least one category is required'),
});

type RecipeFormData = z.infer<typeof recipeFormSchema>;

export function RecipeForm({ onClose, initialData }: RecipeFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RecipeFormData>(() => {
    if (initialData) {
      return {
        title: initialData.title,
        description: initialData.description || '',
        instructions: initialData.instructions,
        imageUrl: initialData.imageUrl || '',
        ingredients: initialData.ingredients.map(ing => ({
          name: ing.ingredient.name,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
        categories: initialData.categories.map(cat => cat.category.name),
      };
    }
    return {
      title: '',
      description: '',
      instructions: '',
      imageUrl: '',
      ingredients: [{ name: '', quantity: 0, unit: '' }],
      categories: [''],
    };
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createRecipeMutation = useMutation({
    mutationFn: async (data: RecipeFormData) => {
      try {
        const endpoint = initialData 
          ? `${API_URL}/api/recipes/${initialData.id}`
          : `${API_URL}/api/recipes`;
        
        const method = initialData ? 'PUT' : 'POST';
        
        // Transform the data to match the API format
        const apiData = {
          ...data,
          imageUrl: data.imageUrl || null,
          ingredients: data.ingredients.map(ing => ({
            quantity: ing.quantity,
            unit: ing.unit,
            ingredient: {
              name: ing.name,
            },
          })),
          categories: data.categories.map(cat => ({
            category: {
              name: cat,
            },
          })),
        };
        
        const response = await axios({
          method,
          url: endpoint,
          data: apiData,
          timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
        });

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message;
          console.error('Recipe operation failed:', {
            status: error.response?.status,
            data: error.response?.data,
            message: errorMessage
          });
          throw new Error(errorMessage || `Failed to ${initialData ? 'update' : 'create'} recipe`);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      onClose();
    },
    onError: (err: Error) => {
      console.error('Mutation error:', err);
      setError(err.message || `Failed to ${initialData ? 'update' : 'create'} recipe`);
    },
  });

  const validateField = (field: keyof RecipeFormData, value: unknown) => {
    try {
      if (field === 'ingredients') {
        z.array(ingredientSchema).parse(value);
      } else if (field === 'categories') {
        z.array(z.string().min(1, 'Category name is required')).parse(value);
      } else if (field === 'imageUrl') {
        if (value) {
          z.string().url().parse(value);
        }
      } else {
        recipeFormSchema.shape[field].parse(value);
      }
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: err.errors[0].message,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    try {
      const validatedData = recipeFormSchema.parse(formData);
      await createRecipeMutation.mutateAsync(validatedData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach(error => {
          const field = error.path[0] as string;
          errors[field] = error.message;
        });
        setValidationErrors(errors);
      } else {
        setError('Failed to create recipe');
      }
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: 0, unit: '' }],
    }));
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        ingredients: newIngredients,
      }));
      validateField('ingredients', newIngredients);
    }
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, ''],
    }));
  };

  const removeCategory = (index: number) => {
    if (formData.categories.length > 1) {
      const newCategories = formData.categories.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        categories: newCategories,
      }));
      validateField('categories', newCategories);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'Edit Recipe' : 'Add New Recipe'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, title: value }));
                  validateField('title', value);
                }}
                className={`form-input ${validationErrors.title ? 'border-red-500' : ''}`}
                placeholder="Recipe title"
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, description: value }));
                }}
                className="form-textarea"
                rows={3}
                placeholder="Brief description of the recipe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, instructions: value }));
                  validateField('instructions', value);
                }}
                className={`form-textarea ${validationErrors.instructions ? 'border-red-500' : ''}`}
                rows={5}
                placeholder="Step by step instructions"
              />
              {validationErrors.instructions && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.instructions}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Image URL (optional)</label>
              <input
                type="url"
                value={formData.imageUrl || ''}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, imageUrl: value }));
                  if (value) validateField('imageUrl', value);
                }}
                className={`form-input ${validationErrors.imageUrl ? 'border-red-500' : ''}`}
                placeholder="https://example.com/image.jpg"
              />
              {validationErrors.imageUrl && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.imageUrl}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Ingredients</label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + Add Ingredient
                </button>
              </div>
              <div className="space-y-3">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={e => {
                        const newIngredients = [...formData.ingredients];
                        newIngredients[index] = { ...ingredient, name: e.target.value };
                        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
                        validateField('ingredients', newIngredients);
                      }}
                      className={`form-input flex-1 ${
                        validationErrors[`ingredients.${index}.name`] ? 'border-red-500' : ''
                      }`}
                      placeholder="Ingredient name"
                    />
                    <input
                      type="number"
                      value={ingredient.quantity}
                      onChange={e => {
                        const newIngredients = [...formData.ingredients];
                        newIngredients[index] = {
                          ...ingredient,
                          quantity: parseFloat(e.target.value) || 0,
                        };
                        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
                        validateField('ingredients', newIngredients);
                      }}
                      className={`form-input w-24 ${
                        validationErrors[`ingredients.${index}.quantity`] ? 'border-red-500' : ''
                      }`}
                      placeholder="Amount"
                      min="0"
                      step="0.1"
                    />
                    <input
                      type="text"
                      value={ingredient.unit}
                      onChange={e => {
                        const newIngredients = [...formData.ingredients];
                        newIngredients[index] = { ...ingredient, unit: e.target.value };
                        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
                        validateField('ingredients', newIngredients);
                      }}
                      className={`form-input w-24 ${
                        validationErrors[`ingredients.${index}.unit`] ? 'border-red-500' : ''
                      }`}
                      placeholder="Unit"
                    />
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {validationErrors.ingredients && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.ingredients}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Categories</label>
                <button
                  type="button"
                  onClick={addCategory}
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + Add Category
                </button>
              </div>
              <div className="space-y-3">
                {formData.categories.map((category, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={category}
                      onChange={e => {
                        const newCategories = [...formData.categories];
                        newCategories[index] = e.target.value;
                        setFormData(prev => ({ ...prev, categories: newCategories }));
                        validateField('categories', newCategories);
                      }}
                      className={`form-input flex-1 ${
                        validationErrors[`categories.${index}`] ? 'border-red-500' : ''
                      }`}
                      placeholder="Category name"
                    />
                    {formData.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {validationErrors.categories && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.categories}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRecipeMutation.isPending}
                className="primary-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createRecipeMutation.isPending 
                  ? (initialData ? 'Updating...' : 'Creating...') 
                  : (initialData ? 'Update Recipe' : 'Create Recipe')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
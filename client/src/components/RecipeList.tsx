import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { RecipeDetails } from './RecipeDetails';
import { RecipeForm, type ApiRecipe } from './RecipeForm';
import { ConfirmDialog } from './ConfirmDialog';
import { debounce } from 'lodash';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PaginatedResponseSchema = z.object({
  recipes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    instructions: z.string(),
    ingredients: z.array(z.object({
      quantity: z.number(),
      unit: z.string(),
      ingredient: z.object({
        id: z.string(),
        name: z.string()
      })
    })),
    categories: z.array(z.object({
      category: z.object({
        id: z.string(),
        name: z.string()
      })
    }))
  })),
  pagination: z.object({
    total: z.number(),
    pages: z.number(),
    currentPage: z.number(),
    limit: z.number()
  })
});

export function RecipeList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState<ApiRecipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<ApiRecipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<ApiRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const limit = 9; // Number of recipes per page

  const debouncedSearch = useMemo(() => debounce((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, 300), []);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const deleteRecipeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      await axios.delete(`${API_URL}/api/recipes/${recipeId}`);
    },
    onMutate: () => {
      setError(null); // Clear any existing errors
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setDeletingRecipe(null);
    },
    onError: (error) => {
      console.error('Failed to delete recipe:', error);
      setError('Failed to delete recipe. Please try again.');
    },
  });

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['recipes', currentPage, searchTerm, selectedCategory],
    queryFn: async () => {
      setError(null);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
        });

        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('category', selectedCategory);

        const response = await axios.get(`${API_URL}/api/recipes?${params}`);
        const validatedData = PaginatedResponseSchema.parse(response.data);
        return validatedData;
      } catch (err) {
        if (err instanceof AxiosError) {
          throw new Error(err.response?.data?.message || 'Failed to load recipes');
        }
        if (err instanceof z.ZodError) {
          console.error('Data validation error:', err.errors);
          throw new Error('Invalid data received from server');
        }
        throw new Error('An unexpected error occurred');
      }
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const allCategories = useMemo(() => {
    return Array.from(new Set(data?.recipes.flatMap(recipe => recipe.categories.map(c => c.category.name)) || [])).sort();
  }, [data]);

  if (isLoading) return (
    <div className="flex items-center justify-center p-8" role="status" aria-label="Loading">
      <div className="loading-spinner" />
    </div>
  );

  if (queryError) return (
    <div className="error-message" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span>{queryError instanceof Error ? queryError.message : 'Failed to load recipes'}</span>
    </div>
  );

  return (
    <div className="space-y-8" role="main" aria-label="Recipe List">
      <div className="space-y-4">
        <div className="max-w-md">
          <label htmlFor="search-recipes" className="sr-only">Search recipes</label>
          <input
            id="search-recipes"
            type="text"
            placeholder="Search recipes..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="form-input"
            role="searchbox"
            aria-label="Search recipes"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Recipe categories">
          <button
            role="tab"
            aria-selected={!selectedCategory}
            onClick={() => {
              setSelectedCategory(null);
              setCurrentPage(1);
            }}
            className={`category-btn ${!selectedCategory ? 'category-btn-active' : ''}`}
          >
            All
          </button>
          {allCategories.map((category) => (
            <button
              key={category}
              role="tab"
              aria-selected={selectedCategory === category}
              onClick={() => {
                setSelectedCategory(category);
                setCurrentPage(1);
              }}
              className={`category-btn ${
                selectedCategory === category ? 'category-btn-active' : ''
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {deleteRecipeMutation.isPending && (
        <div className="flex items-center justify-center p-8" role="status" aria-label="Processing">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-message" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Recipe grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="grid"
        aria-label="Recipe cards"
      >
        {data?.recipes.map((recipe) => (
          <div key={recipe.id} className="recipe-card" role="gridcell">
            {recipe.imageUrl && (
              <div className="relative h-48 overflow-hidden">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}
            <div className="p-5">
              <h3 className="recipe-card-title">
                {recipe.title}
              </h3>
              {recipe.description && (
                <p className="recipe-card-description mt-2">
                  {recipe.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.categories.map(({ category }) => (
                  <span
                    key={category.id}
                    className="recipe-card-tag"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Ingredients:
                </h4>
                <ul className="space-y-1">
                  {recipe.ingredients.slice(0, 3).map(({ quantity, unit, ingredient }) => (
                    <li key={`${recipe.id}-${ingredient.id}`} className="recipe-card-ingredients">
                      {quantity} {unit} {ingredient.name}
                    </li>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <li key={`${recipe.id}-more`} className="text-sm text-blue-500 dark:text-blue-400">
                      +{recipe.ingredients.length - 3} more ingredients
                    </li>
                  )}
                </ul>
              </div>
              <div className="recipe-card-actions">
                <button 
                  onClick={() => setDeletingRecipe(recipe)}
                  className="recipe-delete-btn flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete
                </button>
                <button 
                  onClick={() => setEditingRecipe(recipe)}
                  className="recipe-edit-btn flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit
                </button>
                <button 
                  onClick={() => setSelectedRecipe(recipe)}
                  className="recipe-action-btn flex-1"
                >
                  View
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`pagination-btn ${
                page === currentPage ? 'pagination-btn-active' : ''
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === data.pagination.pages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {data?.recipes.length === 0 && (
        <div className="text-center py-8">
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No recipes found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetails
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {editingRecipe && (
        <RecipeForm
          initialData={editingRecipe}
          onClose={() => setEditingRecipe(null)}
        />
      )}

      {deletingRecipe && (
        <ConfirmDialog
          title="Delete Recipe"
          message={`Are you sure you want to delete "${deletingRecipe.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDestructive={true}
          onConfirm={() => {
            setError(null);
            deleteRecipeMutation.mutate(deletingRecipe.id);
          }}
          onCancel={() => setDeletingRecipe(null)}
        />
      )}
    </div>
  );
} 
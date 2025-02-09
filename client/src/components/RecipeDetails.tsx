import type { ApiRecipe } from './RecipeForm';

interface RecipeDetailsProps {
  recipe: ApiRecipe;
  onClose: () => void;
}

export function RecipeDetails({ recipe, onClose }: RecipeDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{recipe.title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {recipe.imageUrl && (
            <div className="mb-6">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {recipe.description && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-300">{recipe.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.categories.map(({ category }) => (
                <span
                  key={category.name}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ingredients</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              {recipe.ingredients.map(({ ingredient, quantity, unit }) => (
                <li key={ingredient.name}>
                  {quantity} {unit} {ingredient.name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Instructions</h3>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
              {recipe.instructions.split('\n').map((instruction, index) => (
                <p key={index}>{instruction}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
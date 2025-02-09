import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecipeList } from './components/RecipeList';
import { RecipeForm } from './components/RecipeForm';
import { DarkModeToggle } from './components/DarkModeToggle';

const queryClient = new QueryClient();

function App() {
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white m-0">Pantry</h1>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <button 
                onClick={() => setIsAddRecipeOpen(true)}
                className="primary-btn flex items-center gap-1 py-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Recipe
              </button>
            </div>
          </div>
          <RecipeList />
          {isAddRecipeOpen && <RecipeForm onClose={() => setIsAddRecipeOpen(false)} />}
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;

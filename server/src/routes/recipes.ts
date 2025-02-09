import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Input validation schemas
const getPaginatedRecipesSchema = z.object({
  page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 10),
  search: z.string().optional(),
  category: z.string().optional(),
});

const recipeInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  instructions: z.string().min(1, 'Instructions are required'),
  imageUrl: z.string().nullable(),
  ingredients: z.array(z.object({
    quantity: z.number().min(0, 'Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    ingredient: z.object({
      name: z.string().min(1, 'Ingredient name is required'),
    }),
  })).min(1, 'At least one ingredient is required'),
  categories: z.array(z.object({
    category: z.object({
      name: z.string().min(1, 'Category name is required'),
    }),
  })).min(1, 'At least one category is required'),
});

type GetPaginatedRecipesQuery = z.infer<typeof getPaginatedRecipesSchema>;
type RecipeInput = z.infer<typeof recipeInputSchema>;

// Get all recipes with pagination
router.get('/', async (req: Request<{}, {}, {}, GetPaginatedRecipesQuery>, res: Response) => {
  try {
    const { page, limit, search, category } = getPaginatedRecipesSchema.parse(req.query);
    
    // Build where clause
    let whereClause: Prisma.RecipeWhereInput = {};

    if (search) {
      whereClause = {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      };
    }

    if (category) {
      whereClause = {
        ...whereClause,
        categories: {
          some: {
            category: {
              name: category
            }
          }
        }
      };
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ingredients: {
            include: {
              ingredient: true
            }
          },
          categories: {
            include: {
              category: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.recipe.count({ where: whereClause })
    ]);

    res.json({
      recipes,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid query parameters',
        details: error.errors 
      });
    }
    console.error('Failed to fetch recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Get single recipe
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: req.params.id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    console.error('Failed to fetch recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// Create recipe
router.post('/', async (req: Request<{}, {}, RecipeInput>, res: Response) => {
  try {
    const validatedData = recipeInputSchema.parse(req.body);

    const recipe = await prisma.recipe.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        imageUrl: validatedData.imageUrl,
        ingredients: {
          create: validatedData.ingredients.map((ing) => ({
            quantity: ing.quantity,
            unit: ing.unit,
            ingredient: {
              connectOrCreate: {
                where: { name: ing.ingredient.name },
                create: { name: ing.ingredient.name }
              }
            }
          }))
        },
        categories: {
          create: validatedData.categories.map((cat) => ({
            category: {
              connectOrCreate: {
                where: { name: cat.category.name },
                create: { name: cat.category.name }
              }
            }
          }))
        }
      },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    res.status(201).json(recipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid recipe data',
        details: error.errors 
      });
    }
    console.error('Failed to create recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Update recipe
router.put('/:id', async (req: Request<{ id: string }, {}, RecipeInput>, res: Response) => {
  try {
    const validatedData = recipeInputSchema.parse(req.body);

    // Check if recipe exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: req.params.id }
    });

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Delete existing relationships
    await prisma.$transaction([
      prisma.recipeIngredient.deleteMany({
        where: { recipeId: req.params.id }
      }),
      prisma.recipeCategory.deleteMany({
        where: { recipeId: req.params.id }
      })
    ]);

    // Update the recipe
    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        imageUrl: validatedData.imageUrl,
        ingredients: {
          create: validatedData.ingredients.map((ing) => ({
            quantity: ing.quantity,
            unit: ing.unit,
            ingredient: {
              connectOrCreate: {
                where: { name: ing.ingredient.name },
                create: { name: ing.ingredient.name }
              }
            }
          }))
        },
        categories: {
          create: validatedData.categories.map((cat) => ({
            category: {
              connectOrCreate: {
                where: { name: cat.category.name },
                create: { name: cat.category.name }
              }
            }
          }))
        }
      },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    res.json(recipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid recipe data',
        details: error.errors 
      });
    }
    console.error('Failed to update recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete recipe
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    // Delete the recipe and all its relations
    await prisma.$transaction([
      prisma.recipeIngredient.deleteMany({
        where: { recipeId: req.params.id }
      }),
      prisma.recipeCategory.deleteMany({
        where: { recipeId: req.params.id }
      }),
      prisma.recipe.delete({
        where: { id: req.params.id }
      })
    ]);

    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    console.error('Failed to delete recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

export const recipeRoutes = router; 
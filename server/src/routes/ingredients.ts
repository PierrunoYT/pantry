import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all ingredients
router.get('/', async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

// Create ingredient
router.post('/', authenticateToken, async (req, res) => {
  const { name } = req.body;

  try {
    const ingredient = await prisma.ingredient.create({
      data: { name }
    });
    res.status(201).json(ingredient);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ingredient already exists' });
    }
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// Update ingredient
router.put('/:id', authenticateToken, async (req, res) => {
  const { name } = req.body;

  try {
    const ingredient = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: { name }
    });
    res.json(ingredient);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ingredient name already exists' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// Delete ingredient
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.ingredient.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

export const ingredientRoutes = router; 
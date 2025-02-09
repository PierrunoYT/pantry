import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user's shopping lists
router.get('/', authenticateToken, async (req, res) => {
  try {
    const shoppingLists = await prisma.shoppingList.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        items: {
          include: {
            ingredient: true
          }
        }
      }
    });
    res.json(shoppingLists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shopping lists' });
  }
});

// Create shopping list
router.post('/', authenticateToken, async (req, res) => {
  const { name, items } = req.body;

  try {
    const shoppingList = await prisma.shoppingList.create({
      data: {
        name,
        userId: req.user!.id,
        items: {
          create: items.map((item: any) => ({
            quantity: item.quantity,
            unit: item.unit,
            ingredient: {
              connectOrCreate: {
                where: { name: item.ingredientName },
                create: { name: item.ingredientName }
              }
            }
          }))
        }
      },
      include: {
        items: {
          include: {
            ingredient: true
          }
        }
      }
    });
    res.status(201).json(shoppingList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shopping list' });
  }
});

// Update shopping list
router.put('/:id', authenticateToken, async (req, res) => {
  const { name, items } = req.body;

  try {
    // Check if shopping list exists and belongs to user
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!existingList) {
      return res.status(404).json({ error: 'Shopping list not found or unauthorized' });
    }

    // Delete existing items
    await prisma.shoppingListItem.deleteMany({
      where: { shoppingListId: req.params.id }
    });

    // Update shopping list
    const shoppingList = await prisma.shoppingList.update({
      where: { id: req.params.id },
      data: {
        name,
        items: {
          create: items.map((item: any) => ({
            quantity: item.quantity,
            unit: item.unit,
            purchased: item.purchased || false,
            ingredient: {
              connectOrCreate: {
                where: { name: item.ingredientName },
                create: { name: item.ingredientName }
              }
            }
          }))
        }
      },
      include: {
        items: {
          include: {
            ingredient: true
          }
        }
      }
    });
    res.json(shoppingList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shopping list' });
  }
});

// Delete shopping list
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if shopping list exists and belongs to user
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      }
    });

    if (!existingList) {
      return res.status(404).json({ error: 'Shopping list not found or unauthorized' });
    }

    await prisma.shoppingList.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shopping list' });
  }
});

// Update item status (mark as purchased/unpurchased)
router.patch('/:listId/items/:itemId', authenticateToken, async (req, res) => {
  const { purchased } = req.body;

  try {
    // Check if shopping list exists and belongs to user
    const existingList = await prisma.shoppingList.findFirst({
      where: {
        id: req.params.listId,
        userId: req.user!.id
      }
    });

    if (!existingList) {
      return res.status(404).json({ error: 'Shopping list not found or unauthorized' });
    }

    const item = await prisma.shoppingListItem.update({
      where: { id: req.params.itemId },
      data: { purchased },
      include: {
        ingredient: true
      }
    });

    res.json(item);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(500).json({ error: 'Failed to update item' });
  }
});

export const shoppingListRoutes = router; 
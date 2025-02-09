import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User'
      }
    });

    // Create some basic ingredients
    const ingredients = await Promise.all([
      prisma.ingredient.create({ data: { name: 'Salt' } }),
      prisma.ingredient.create({ data: { name: 'Pepper' } }),
      prisma.ingredient.create({ data: { name: 'Olive Oil' } }),
      prisma.ingredient.create({ data: { name: 'Garlic' } }),
      prisma.ingredient.create({ data: { name: 'Onion' } }),
      prisma.ingredient.create({ data: { name: 'Tomato' } }),
    ]);

    // Create some categories
    const categories = await Promise.all([
      prisma.category.create({ data: { name: 'Main Course' } }),
      prisma.category.create({ data: { name: 'Appetizer' } }),
      prisma.category.create({ data: { name: 'Dessert' } }),
      prisma.category.create({ data: { name: 'Vegetarian' } }),
      prisma.category.create({ data: { name: 'Quick & Easy' } }),
    ]);

    // Create a sample recipe
    await prisma.recipe.create({
      data: {
        title: 'Simple Tomato Pasta',
        description: 'A quick and easy pasta dish with fresh tomatoes and garlic',
        instructions: '1. Boil pasta according to package instructions\n2. Sauté garlic in olive oil\n3. Add chopped tomatoes\n4. Season with salt and pepper\n5. Toss with pasta',
        userId: user.id,
        ingredients: {
          create: [
            {
              quantity: 2,
              unit: 'cloves',
              ingredient: {
                connect: { name: 'Garlic' }
              }
            },
            {
              quantity: 2,
              unit: 'tablespoons',
              ingredient: {
                connect: { name: 'Olive Oil' }
              }
            },
            {
              quantity: 2,
              unit: 'whole',
              ingredient: {
                connect: { name: 'Tomato' }
              }
            },
            {
              quantity: 1,
              unit: 'teaspoon',
              ingredient: {
                connect: { name: 'Salt' }
              }
            },
            {
              quantity: 0.5,
              unit: 'teaspoon',
              ingredient: {
                connect: { name: 'Pepper' }
              }
            }
          ]
        },
        categories: {
          create: [
            {
              category: {
                connect: { name: 'Main Course' }
              }
            },
            {
              category: {
                connect: { name: 'Vegetarian' }
              }
            },
            {
              category: {
                connect: { name: 'Quick & Easy' }
              }
            }
          ]
        }
      }
    });

    console.log('Database initialized with sample data');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 
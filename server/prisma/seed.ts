import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  // Create some categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Main Course' },
      update: {},
      create: { name: 'Main Course' },
    }),
    prisma.category.upsert({
      where: { name: 'Dessert' },
      update: {},
      create: { name: 'Dessert' },
    }),
    prisma.category.upsert({
      where: { name: 'Vegetarian' },
      update: {},
      create: { name: 'Vegetarian' },
    }),
  ]);

  // Create a sample recipe
  const spaghetti = await prisma.recipe.create({
    data: {
      title: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta dish with eggs, cheese, pancetta, and black pepper',
      instructions: `
1. Bring a large pot of salted water to boil
2. Cook spaghetti according to package instructions
3. Meanwhile, in a large bowl, whisk together eggs, cheese, and pepper
4. Cook pancetta until crispy
5. Drain pasta, reserving some pasta water
6. Quickly toss hot pasta with egg mixture and pancetta
7. Add pasta water as needed for creamy sauce
8. Serve immediately with extra cheese and black pepper
      `.trim(),
      userId: user.id,
      ingredients: {
        create: [
          {
            quantity: 400,
            unit: 'g',
            ingredient: {
              create: {
                name: 'spaghetti',
              },
            },
          },
          {
            quantity: 4,
            unit: 'large',
            ingredient: {
              create: {
                name: 'eggs',
              },
            },
          },
          {
            quantity: 100,
            unit: 'g',
            ingredient: {
              create: {
                name: 'pancetta',
              },
            },
          },
          {
            quantity: 100,
            unit: 'g',
            ingredient: {
              create: {
                name: 'Pecorino Romano cheese',
              },
            },
          },
        ],
      },
      categories: {
        create: [
          {
            category: {
              connect: {
                id: categories[0].id, // Main Course
              },
            },
          },
        ],
      },
    },
  });

  console.log('Seed data created:');
  console.log('- User:', user.email);
  console.log('- Categories:', categories.map(c => c.name).join(', '));
  console.log('- Recipe:', spaghetti.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
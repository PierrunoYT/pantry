import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Recipe Routes', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create a test user and generate auth token
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@recipes.com',
        password: hashedPassword,
        name: 'Test User',
      },
    });
    userId = user.id;
    authToken = sign({ id: user.id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  describe('GET /api/recipes', () => {
    it('should return an empty list when no recipes exist', async () => {
      const response = await request(app).get('/api/recipes');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        recipes: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: 1,
          limit: 10,
        },
      });
    });

    it('should return recipes when they exist', async () => {
      // Create a test recipe
      await prisma.recipe.create({
        data: {
          title: 'Test Recipe',
          description: 'Test Description',
          instructions: 'Test Instructions',
          userId,
          ingredients: {
            create: [
              {
                quantity: 1,
                unit: 'piece',
                ingredient: {
                  create: {
                    name: 'test ingredient',
                  },
                },
              },
            ],
          },
          categories: {
            create: [
              {
                category: {
                  create: {
                    name: 'test category',
                  },
                },
              },
            ],
          },
        },
      });

      const response = await request(app).get('/api/recipes');
      
      expect(response.status).toBe(200);
      expect(response.body.recipes).toHaveLength(1);
      expect(response.body.recipes[0]).toMatchObject({
        title: 'Test Recipe',
        description: 'Test Description',
      });
    });
  });

  describe('POST /api/recipes', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          title: 'New Recipe',
          instructions: 'Test Instructions',
          ingredients: [{ name: 'ingredient', quantity: 1, unit: 'piece' }],
          categories: ['test'],
        });

      expect(response.status).toBe(401);
    });

    it('should create a new recipe when authenticated', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Recipe',
          description: 'Test Description',
          instructions: 'Test Instructions',
          ingredients: [{ name: 'ingredient', quantity: 1, unit: 'piece' }],
          categories: ['test'],
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: 'New Recipe',
        description: 'Test Description',
      });
    });
  });
}); 
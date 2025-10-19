import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Media } from '../media/entities/image.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let mockCategoryRepo: any;
  let mockMediaRepo: any;
  let mockDataSource: any;
  let mockTreeRepo: any;

  beforeEach(async () => {
    // Mock repositories
    mockTreeRepo = {
      findOne: jest.fn(),
      findTrees: jest.fn(),
      findDescendantsTree: jest.fn(),
    };

    mockCategoryRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    };

    mockMediaRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockDataSource = {
      getTreeRepository: jest.fn().mockReturnValue(mockTreeRepo),
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepo,
        },
        {
          provide: getRepositoryToken(Media),
          useValue: mockMediaRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  describe('findOne', () => {
    it('should return a category when found', async () => {
      const mockCategory = { id: 1, title: 'Test Category' } as Category;
      mockTreeRepo.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCategory);
      expect(mockTreeRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when category not found', async () => {
      mockTreeRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a root category successfully', async () => {
      const createDto = {
        title: 'New Category',
        slug: 'new-category',
        parentId: 0,
      };

      mockCategoryRepo.findOne.mockResolvedValue(null); // No duplicates

      // Mock transaction
      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          create: jest.fn((entity, data) => ({ ...data, id: 1 })),
          save: jest.fn((entity, data) => Promise.resolve(data)),
          update: jest.fn(),
        };
        return callback(manager);
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.title).toBe(createDto.title);
    });

    it('should throw BadRequestException for duplicate title', async () => {
      const createDto = {
        title: 'Duplicate Title',
        slug: 'duplicate-slug',
      };

      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue({ id: 1, title: 'Duplicate Title' }),
        };
        return callback(manager);
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when parent not found', async () => {
      const createDto = {
        title: 'Child Category',
        slug: 'child-category',
        parentId: 999,
      };

      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {
          findOne: jest.fn()
            .mockResolvedValueOnce(null) // No duplicate title
            .mockResolvedValueOnce(null), // No duplicate slug
        };
        mockTreeRepo.findOne.mockResolvedValue(null); // Parent not found
        return callback(manager);
      });

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should calculate correct level for child category', async () => {
      const parentCategory = { id: 1, level: 1 } as Category;
      const createDto = {
        title: 'Child Category',
        slug: 'child-category',
        parentId: 1,
      };

      mockTreeRepo.findOne.mockResolvedValue(parentCategory);

      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          create: jest.fn((entity, data) => data),
          save: jest.fn((entity, data) => Promise.resolve({ ...data, id: 2 })),
        };
        return callback(manager);
      });

      const result = await service.create(createDto);

      expect(result.level).toBe(2); // Parent level + 1
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const existingCategory = {
        id: 1,
        title: 'Old Title',
        slug: 'old-slug',
        level: 1,
      } as Category;

      const updateDto = {
        title: 'New Title',
      };

      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {
          findOne: jest.fn()
            .mockResolvedValueOnce(existingCategory) // Find existing
            .mockResolvedValueOnce(null), // No duplicate
          merge: jest.fn((entity, existing, data) => ({ ...existing, ...data })),
          save: jest.fn((entity, data) => Promise.resolve(data)),
        };
        return callback(manager);
      });

      const result = await service.update(1, updateDto);

      expect(result.title).toBe(updateDto.title);
    });

    it('should prevent circular parent relationship', async () => {
      const category = { id: 1, level: 1 } as Category;
      const updateDto = {
        parentId: 1, // Trying to set itself as parent
      };

      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(category),
        };
        mockTreeRepo.findOne.mockResolvedValue(category);
        return callback(manager);
      });

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should recalculate level when parent changes', async () => {
      const existingCategory = { id: 2, level: 1, parent: null } as Category;
      const newParent = { id: 1, level: 2 } as Category;
      const updateDto = {
        parentId: 1,
      };

      mockTreeRepo.findOne.mockResolvedValue(newParent);

      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(existingCategory),
          merge: jest.fn((entity, existing, data) => ({ ...existing, ...data })),
          save: jest.fn((entity, data) => Promise.resolve(data)),
        };
        return callback(manager);
      });

      const result = await service.update(2, updateDto);

      expect(result.level).toBe(3); // New parent level + 1
    });
  });

  describe('remove', () => {
    it('should delete category when it has no children', async () => {
      const category = {
        id: 1,
        children: [],
        products: [],
      } as unknown as Category;

      mockTreeRepo.findOne.mockResolvedValue(category);
      mockTreeRepo.findDescendantsTree.mockResolvedValue(category);

      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          delete: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return callback(manager);
      });

      const result = await service.remove(1);

      expect(result).toHaveProperty('message');
    });

    it('should throw BadRequestException when category has children', async () => {
      const category = {
        id: 1,
        children: [{ id: 2 }],
      } as Category;

      mockTreeRepo.findOne.mockResolvedValue(category);
      mockTreeRepo.findDescendantsTree.mockResolvedValue(category);

      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {};
        return callback(manager);
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockTreeRepo.findOne.mockResolvedValue(null);

      mockDataSource.transaction = jest.fn((callback) => {
        const manager = {};
        return callback(manager);
      });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllTree', () => {
    it('should return all categories as tree', async () => {
      const mockCategories = [
        {
          id: 1,
          title: 'Parent',
          children: [
            { id: 2, title: 'Child' },
          ],
        },
      ] as Category[];

      mockTreeRepo.findTrees.mockResolvedValue(mockCategories);

      const result = await service.findAllTree();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockTreeRepo.findTrees).toHaveBeenCalled();
    });
  });

  describe('findByIdWithDescendants', () => {
    it('should return category with all descendants', async () => {
      const mockCategory = {
        id: 1,
        title: 'Parent',
        children: [
          { id: 2, title: 'Child 1' },
          { id: 3, title: 'Child 2' },
        ],
      } as Category;

      mockTreeRepo.findOne.mockResolvedValue(mockCategory);
      mockTreeRepo.findDescendantsTree.mockResolvedValue(mockCategory);

      const result = await service.findByIdWithDescendants(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.children.length).toBe(2);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockTreeRepo.findOne.mockResolvedValue(null);

      await expect(service.findByIdWithDescendants(999)).rejects.toThrow(NotFoundException);
    });
  });
});

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORIES = [
  { name: 'Anklets', code: 'ANK', description: 'Silver payal, daily wear and bridal anklets' },
  { name: 'Rings', code: 'RNG', description: 'Silver finger rings, adjustable and solitaire bands' },
  { name: 'Chains', code: 'CHN', description: 'Sterling silver chains, hollow and solid links' },
  { name: 'Bangles & Bracelets', code: 'BNG', description: 'Kadas, charm bracelets and bridal bangles' },
  { name: 'Necklaces', code: 'NCK', description: 'Traditional and modern silver necklaces' },
  { name: 'Earrings & Studs', code: 'EAR', description: 'Jhumkas, studs, drops and hoop earrings' },
  { name: 'Utensils', code: 'UTN', description: '800 silver plates, tumblers, bowls and dinner sets' },
  { name: 'Pooja Articles', code: 'PJA', description: 'Diyas, bell, panchamrutham, agarbatti stands' },
  { name: 'Idols', code: 'IDL', description: 'Ganesha, Lakshmi, Venkateswara silver idols' },
  { name: 'Coins & Bars', code: 'CON', description: '999 fine silver coins, silver biscuits and bars' },
  { name: 'Giftware', code: 'GFT', description: 'Silver gift items, baby sets, frames and novelties' },
];

export async function GET() {
  try {
    const categoryDelegate = (prisma as any).category;
    let dbCategories: any[] = [];

    if (categoryDelegate) {
      try {
        dbCategories = await categoryDelegate.findMany({
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });

        // If empty, auto-seed defaults into DB
        if (dbCategories.length === 0) {
          let seedOrder = 0;
          for (const def of DEFAULT_CATEGORIES) {
            try {
              await categoryDelegate.create({
                data: {
                  name: def.name,
                  code: def.code,
                  description: def.description,
                  isDefault: true,
                  sortOrder: seedOrder++,
                },
              });
            } catch (seedErr) {}
          }
          dbCategories = await categoryDelegate.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          });
        }
      } catch (catFindErr) {
        console.warn('Prisma category findMany failed, falling back to defaults:', catFindErr);
      }
    }

    // If still empty (e.g. table not ready), use default static list
    if (!dbCategories || dbCategories.length === 0) {
      dbCategories = DEFAULT_CATEGORIES.map((cat, i) => ({
        id: `cat-default-${i + 1}`,
        name: cat.name,
        code: cat.code,
        description: cat.description,
        isDefault: true,
        sortOrder: i,
      }));
    }

    // Fetch product counts for each category
    const products = await prisma.product.findMany({
      select: { category: true },
    });

    const countMap: Record<string, number> = {};
    for (const p of products) {
      if (p.category) {
        countMap[p.category] = (countMap[p.category] || 0) + 1;
      }
    }

    const categoriesWithCount = dbCategories.map((c) => ({
      ...c,
      productCount: countMap[c.name] || 0,
    }));

    return NextResponse.json(categoriesWithCount);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      DEFAULT_CATEGORIES.map((cat, i) => ({
        id: `cat-fallback-${i + 1}`,
        name: cat.name,
        code: cat.code,
        description: cat.description,
        isDefault: true,
        productCount: 0,
      }))
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedCode = code ? code.trim().toUpperCase() : trimmedName.slice(0, 3).toUpperCase();
    const trimmedDesc = description ? description.trim() : null;

    const categoryDelegate = (prisma as any).category;
    if (!categoryDelegate) {
      return NextResponse.json({ error: 'Database category service unavailable' }, { status: 500 });
    }

    // Check if category name already exists
    const existing = await categoryDelegate.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Category "${trimmedName}" already exists` },
        { status: 409 }
      );
    }

    let nextSortOrder = 0;
    try {
      const lastCategory = await categoryDelegate.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      if (lastCategory && typeof lastCategory.sortOrder === 'number') {
        nextSortOrder = lastCategory.sortOrder + 1;
      }
    } catch (orderErr) {}

    const newCategory = await categoryDelegate.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        description: trimmedDesc,
        isDefault: false,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds must be a non-empty array of category IDs' }, { status: 400 });
    }

    const categoryDelegate = (prisma as any).category;
    if (!categoryDelegate) {
      return NextResponse.json({ error: 'Database category service unavailable' }, { status: 500 });
    }

    // Update each category's sortOrder
    await Promise.all(
      orderedIds.map((id: string, index: number) =>
        categoryDelegate.update({
          where: { id },
          data: { sortOrder: index },
        }).catch((err: any) => {
          console.warn(`Failed to update sortOrder for category ${id}:`, err);
        })
      )
    );

    // Fetch refreshed categories with counts
    const updatedCategories = await categoryDelegate.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const products = await prisma.product.findMany({
      select: { category: true },
    });
    const countMap: Record<string, number> = {};
    for (const p of products) {
      if (p.category) {
        countMap[p.category] = (countMap[p.category] || 0) + 1;
      }
    }

    const result = updatedCategories.map((c: any) => ({
      ...c,
      productCount: countMap[c.name] || 0,
    }));

    return NextResponse.json({ success: true, categories: result });
  } catch (error: any) {
    console.error('Error reordering categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to reorder categories' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, code, description, oldName } = body;

    if (!id && !oldName) {
      return NextResponse.json({ error: 'Category ID or Name is required for update' }, { status: 400 });
    }

    const trimmedName = name ? name.trim() : undefined;
    const trimmedCode = code !== undefined ? (code ? code.trim().toUpperCase() : null) : undefined;
    const trimmedDesc = description !== undefined ? (description ? description.trim() : null) : undefined;

    const categoryDelegate = (prisma as any).category;
    if (!categoryDelegate) {
      return NextResponse.json({ error: 'Database category service unavailable' }, { status: 500 });
    }

    // Find the existing record
    const existing = id
      ? await categoryDelegate.findUnique({ where: { id } })
      : await categoryDelegate.findFirst({ where: { name: oldName } });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const previousName = existing.name;

    // If changing name, check conflict
    if (trimmedName && trimmedName.toLowerCase() !== previousName.toLowerCase()) {
      const conflict = await categoryDelegate.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          id: { not: existing.id },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: `Another category named "${trimmedName}" already exists` },
          { status: 409 }
        );
      }
    }

    const updated = await categoryDelegate.update({
      where: { id: existing.id },
      data: {
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(trimmedCode !== undefined ? { code: trimmedCode } : {}),
        ...(trimmedDesc !== undefined ? { description: trimmedDesc } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) } : {}),
      },
    });

    // If the category name was changed, cascade update all existing products with this category
    if (trimmedName && trimmedName !== previousName) {
      try {
        await prisma.product.updateMany({
          where: { category: previousName },
          data: { category: trimmedName },
        });
      } catch (prodUpdateErr) {
        console.warn('Could not cascade update products category:', prodUpdateErr);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const force = searchParams.get('force') === 'true';

    if (!id && !name) {
      return NextResponse.json({ error: 'Category ID or Name required for deletion' }, { status: 400 });
    }

    const categoryDelegate = (prisma as any).category;
    if (!categoryDelegate) {
      return NextResponse.json({ error: 'Database category service unavailable' }, { status: 500 });
    }

    const category = id
      ? await categoryDelegate.findUnique({ where: { id } })
      : await categoryDelegate.findFirst({ where: { name } });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if products exist in this category
    const productCount = await prisma.product.count({
      where: { category: category.name },
    });

    if (productCount > 0 && !force) {
      return NextResponse.json(
        {
          error: `Cannot delete "${category.name}" because ${productCount} product(s) are assigned to it. Please reassign them first or confirm deletion.`,
          productCount,
        },
        { status: 400 }
      );
    }

    // If force delete, reassign products to 'General' or keep
    if (productCount > 0 && force) {
      await prisma.product.updateMany({
        where: { category: category.name },
        data: { category: 'Other' },
      });
    }

    await categoryDelegate.delete({
      where: { id: category.id },
    });

    return NextResponse.json({ success: true, message: `Category "${category.name}" removed successfully.` });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}

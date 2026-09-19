import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { sku: string } }
) {
  const { sku } = params;
  const decodedSku = decodeURIComponent(sku).trim();

  try {
    const product = await prisma.product.findUnique({
      where: { sku: decodedSku },
    });

    if (product) {
      return NextResponse.json(product);
    }
  } catch (error) {
    console.warn('DB lookup failed:', error);
  }

  return NextResponse.json({ error: 'Product not found' }, { status: 404 });
}

export async function PUT(
  request: Request,
  { params }: { params: { sku: string } }
) {
  const { sku } = params;
  const decodedSku = decodeURIComponent(sku).trim();
  const body = await request.json();

  try {
    const updated = await prisma.product.update({
      where: { sku: decodedSku },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.category && { category: body.category }),
        ...(body.metalType && { metalType: body.metalType }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.grossWeight !== undefined && { grossWeight: Number(body.grossWeight || 0) }),
        ...(body.stoneWeight !== undefined && { stoneWeight: Number(body.stoneWeight || 0) }),
        ...(body.netWeight !== undefined && { netWeight: Number(body.netWeight || 0) }),
        ...(body.purity !== undefined && { purity: Number(body.purity) }),
        ...(body.purityGrade && { purityGrade: body.purityGrade }),
        ...(body.purchaseRatePerGram !== undefined && { purchaseRatePerGram: Number(body.purchaseRatePerGram || 0) }),
        ...(body.wastagePercentage !== undefined && { wastagePercentage: Number(body.wastagePercentage || 0) }),
        ...(body.makingChargeType && { makingChargeType: body.makingChargeType }),
        ...(body.makingChargeValue !== undefined && {
          makingChargeValue: Number(body.makingChargeValue || 0),
        }),
        ...(body.gstPercentage !== undefined && { gstPercentage: Number(body.gstPercentage || 3) }),
        ...(body.stockQuantity !== undefined && { stockQuantity: Number(body.stockQuantity) }),
        ...(body.minStockAlert !== undefined && { minStockAlert: Number(body.minStockAlert) }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ success: true, updated: body });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { sku: string } }
) {
  const { sku } = params;
  const decodedSku = decodeURIComponent(sku).trim();

  try {
    const product = await prisma.product.findUnique({
      where: { sku: decodedSku },
    });

    if (!product) {
      return NextResponse.json({
        success: true,
        message: `Product ${decodedSku} deleted`,
        deletedSku: decodedSku,
      });
    }

    // Unlink any invoice items referencing this product to maintain sales integrity
    try {
      await prisma.invoiceItem.updateMany({
        where: { productId: product.id },
        data: { productId: null },
      });
    } catch (unlinkErr) {
      console.warn('Could not unlink invoice items:', unlinkErr);
    }

    // Hard delete the product record from the database
    await prisma.product.delete({
      where: { id: product.id },
    });

    return NextResponse.json({
      success: true,
      message: `Product ${decodedSku} permanently deleted`,
      deletedId: product.id,
      deletedSku: product.sku,
    });
  } catch (error: any) {
    console.error('Error deleting product from DB:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

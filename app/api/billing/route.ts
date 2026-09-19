import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateProductQRCode } from '@/lib/qr';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invoiceNumber = searchParams.get('inv') || '';

  try {
    const invoices = await prisma.invoice.findMany({
      where: invoiceNumber ? { invoiceNumber } : {},
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoiceNumber =
      body.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Prepare items with QR codes
    const itemsWithQRs = await Promise.all(
      body.items.map(async (item: any) => {
        const qrCodeUrl = await generateProductQRCode(item.productSku);
        return {
          ...item,
          qrCodeUrl,
        };
      })
    );

    const grandTotal = Number(Number(body.grandTotal).toFixed(2));
    const cardCharge = Number(Number(body.cardCharge || 0).toFixed(2));
    const paidAmount =
      body.paidAmount !== undefined
        ? Number(Number(body.paidAmount).toFixed(2))
        : grandTotal;
    const dueAmount =
      body.dueAmount !== undefined
        ? Number(Number(body.dueAmount).toFixed(2))
        : Number(Math.max(0, grandTotal - paidAmount).toFixed(2));
    const paymentStatus =
      body.paymentStatus || (dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'DUE');
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    // 2. Perform DB Transaction: Create customer/update, create invoice, deduct stock
    try {
      // Find or create customer with unique phone constraint
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone: body.customerPhone },
      });

      let customer;
      if (existingCustomer) {
        customer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            address: body.customerAddress || existingCustomer.address,
            totalSpend: { increment: grandTotal },
            totalBills: { increment: 1 },
            ...(dueAmount > 0 ? { outstandingBalance: { increment: dueAmount } } : {}),
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            name: body.customerName,
            phone: body.customerPhone,
            address: body.customerAddress || null,
            totalSpend: grandTotal,
            totalBills: 1,
            outstandingBalance: dueAmount,
          },
        });
      }

      // Create Invoice & InvoiceItems
      const createdInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          invoiceType: body.invoiceType || 'ESTIMATE_QUOTATION',
          taxType: body.taxType || (body.invoiceType === 'TAX_INVOICE' ? 'INTRA_STATE' : 'NONE'),
          customerId: customer.id,
          customerName: customer.name || body.customerName,
          customerPhone: customer.phone,
          subtotal: Number(body.subtotal),
          makingCharges: Number(body.makingCharges || 0),
          discount: Number(body.discount || 0),
          oldSilverWeight: Number(body.oldSilver?.grossWeight || 0),
          oldSilverRate: Number(body.oldSilver?.meltRatePerGram || 0),
          oldSilverValue: Number(body.oldSilver?.totalValue || 0),
          taxableAmount: Number(body.taxableAmount),
          cgst: Number(body.cgst || 0),
          sgst: Number(body.sgst || 0),
          igst: Number(body.igst || 0),
          cardCharge,
          grandTotal,
          paymentMode: body.paymentMode || 'UPI',
          paymentStatus,
          paidAmount,
          dueAmount,
          dueDate,
          notes: body.notes || null,
          items: {
            create: itemsWithQRs.map((item: any) => ({
              productSku: item.productSku,
              productName: item.productName,
              grossWeight: Number(item.grossWeight || 0),
              netWeight: Number(item.netWeight || 0),
              purity: Number(item.purity),
              silverRateApplied: Number(item.silverRateApplied),
              makingCharge: Number(item.makingCharge || 0),
              totalPrice: Number(item.totalPrice),
              qrCodeUrl: item.qrCodeUrl,
            })),
          },
        } as any,
        include: { items: true },
      });

      // Record Khata transaction if there is credit/due amount
      if (dueAmount > 0) {
        try {
          await prisma.khataTransaction.create({
            data: {
              customerId: customer.id,
              type: 'BILL_DEBIT',
              amount: dueAmount,
              paymentMode: body.paymentMode || 'KHATA',
              referenceInvoice: invoiceNumber,
              notes: body.dueDate
                ? `Due balance on Bill #${invoiceNumber}. Promised repayment: ${new Date(body.dueDate).toLocaleDateString('en-IN')}`
                : `Due balance on Bill #${invoiceNumber}`,
            },
          });
        } catch (khataErr) {
          console.warn('Could not record khata debit transaction:', khataErr);
        }
      }

      // Decrement stock quantities for each product
      for (const item of body.items) {
        try {
          await prisma.product.updateMany({
            where: { sku: item.productSku },
            data: {
              stockQuantity: {
                decrement: item.quantity || 1,
              },
            },
          });
        } catch (stockErr) {
          console.warn('Could not auto-decrement stock in DB:', stockErr);
        }
      }

      return NextResponse.json(createdInvoice, { status: 201 });
    } catch (dbErr) {
      console.warn('Database error during billing, returning constructed invoice:', dbErr);
    }

    // Fallback response if DB not connected
    const fallbackInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      invoiceType: body.invoiceType || 'ESTIMATE_QUOTATION',
      taxType: body.taxType || (body.invoiceType === 'TAX_INVOICE' ? 'INTRA_STATE' : 'NONE'),
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      date: new Date().toISOString(),
      subtotal: body.subtotal,
      makingCharges: body.makingCharges,
      discount: body.discount,
      oldSilver: body.oldSilver,
      taxableAmount: body.taxableAmount,
      cgst: body.cgst || 0,
      sgst: body.sgst || 0,
      igst: body.igst || 0,
      cardCharge,
      grandTotal,
      paymentMode: body.paymentMode,
      paymentStatus,
      paidAmount,
      dueAmount,
      dueDate: body.dueDate || null,
      items: itemsWithQRs,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(fallbackInvoice, { status: 201 });
  } catch (error: any) {
    console.error('Billing API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { invoiceNumber, newDueDate, paidAmountToAdd } = body;

    if (!invoiceNumber) {
      return NextResponse.json({ error: 'Missing invoiceNumber' }, { status: 400 });
    }

    if (newDueDate !== undefined) {
      const updated = await prisma.invoice.update({
        where: { invoiceNumber },
        data: {
          dueDate: newDueDate ? new Date(newDueDate) : null,
        },
      });
      return NextResponse.json({ success: true, invoice: updated });
    }

    if (paidAmountToAdd !== undefined) {
      const inv = await prisma.invoice.findUnique({ where: { invoiceNumber } });
      if (inv) {
        const numAdd = Number(Number(paidAmountToAdd).toFixed(2));
        const newPaid = Math.min(inv.grandTotal, Number((inv.paidAmount + numAdd).toFixed(2)));
        const newDue = Math.max(0, Number((inv.grandTotal - newPaid).toFixed(2)));
        const updated = await prisma.invoice.update({
          where: { invoiceNumber },
          data: {
            paidAmount: newPaid,
            dueAmount: newDue,
            paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL',
          },
        });
        return NextResponse.json({ success: true, invoice: updated });
      }
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 });
  } catch (err: any) {
    console.error('Billing patch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const inv = searchParams.get('inv');
  const all = searchParams.get('all');

  try {
    if (all === 'true') {
      await prisma.invoiceItem.deleteMany();
      await prisma.invoice.deleteMany();
      return NextResponse.json({ success: true, message: 'All invoices cleared' });
    }

    if (!inv) {
      return NextResponse.json({ error: 'Invoice number required' }, { status: 400 });
    }

    await prisma.invoiceItem.deleteMany({
      where: { invoice: { invoiceNumber: inv } },
    });
    await prisma.invoice.delete({
      where: { invoiceNumber: inv },
    });

    return NextResponse.json({ success: true, message: `Invoice ${inv} deleted` });
  } catch (err: any) {
    console.error('Invoice delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


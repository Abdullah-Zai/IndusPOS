/**
 * PrintReceipt.js
 * Shared 80mm thermal printer receipt generator for Indus Cuisine POS
 * Used by Billing.jsx (dine-in settle) and Pos.jsx (takeaway/POS checkout)
 */

export function printThermalReceipt({
  billNumber,
  orderNumber,
  orderType,
  tableNo,
  paymentMethod,
  items = [],
  subtotal = 0,
  discount = 0,
  tax = 0,
  totalAmount = 0,
  cashierName = '',
  createdAt = new Date().toISOString(),
}) {
  const now = createdAt ? new Date(createdAt) : new Date();
  const dateStr = now.toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const invoiceRef = billNumber
    ? `INV-${String(billNumber).padStart(5, '0')}`
    : `ORD-${String(orderNumber || 0).padStart(5, '0')}`;

  const orderTypeLabel =
    orderType === 'dine_in' ? 'Dine-In' :
    orderType === 'delivery' ? 'Delivery' :
    'Takeaway';

  // Build items rows
  const itemRows = items.map(it => {
    const qty = it.quantity || it.qty || 1;
    const name = it.item_name || it.name || '';
    const variant = it.variant ? ` (${it.variant})` : '';
    const price = Number(it.price_at_time || it.price || 0);
    const lineTotal = (price * qty).toLocaleString();
    const unitPrice = price.toLocaleString();
    return `
      <tr>
        <td style="padding:2px 0;font-size:12px;word-break:break-word;">${name}${variant}</td>
        <td style="padding:2px 4px;font-size:12px;text-align:center;">${qty}</td>
        <td style="padding:2px 0;font-size:12px;text-align:right;">${unitPrice}</td>
        <td style="padding:2px 0;font-size:12px;text-align:right;font-weight:700;">${lineTotal}</td>
      </tr>`;
  }).join('');

  const discountRow = discount > 0 ? `
    <tr>
      <td colspan="3" style="padding:2px 0;font-size:12px;text-align:right;color:#c0392b;">Discount:</td>
      <td style="padding:2px 0;font-size:12px;text-align:right;color:#c0392b;">-${Number(discount).toLocaleString()}</td>
    </tr>` : '';

  const taxRow = tax > 0 ? `
    <tr>
      <td colspan="3" style="padding:2px 0;font-size:12px;text-align:right;">GST Tax:</td>
      <td style="padding:2px 0;font-size:12px;text-align:right;">+${Number(tax).toLocaleString()}</td>
    </tr>` : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${invoiceRef}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #000;
      background: #fff;
      width: 80mm;
      padding: 5mm 4mm 8mm 4mm;
    }
    .header { text-align: center; margin-bottom: 6px; }
    .logo-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2.5px solid #000;
      margin-bottom: 5px;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .brand-name {
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .brand-sub {
      font-size: 9px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #444;
      margin-top: 2px;
    }
    .dashed { border: none; border-top: 1px dashed #000; margin: 5px 0; }
    .solid  { border: none; border-top: 1px solid  #000; margin: 5px 0; }
    .double { border: none; border-top: 3px double #000; margin: 6px 0; }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 1.5px 0;
    }
    .info-label { color: #555; }
    .info-value { font-weight: 700; text-align: right; }
    .items-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    .items-table thead tr th {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 0;
      border-bottom: 1px solid #000;
      text-align: left;
    }
    .items-table thead tr th:nth-child(2) { text-align: center; }
    .items-table thead tr th:nth-child(3),
    .items-table thead tr th:nth-child(4) { text-align: right; }
    .items-table tbody tr td { vertical-align: top; }
    .totals-table { width: 100%; border-collapse: collapse; margin-top: 3px; }
    .totals-table td { padding: 2px 0; font-size: 12px; }
    .grand-row td { font-size: 14px; font-weight: 900; padding-top: 4px; }
    .payment-badge {
      display: inline-block;
      border: 1.5px solid #000;
      padding: 2px 10px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .footer { text-align: center; margin-top: 8px; }
    .footer-thanks { font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
    .footer-address { font-size: 10px; line-height: 1.7; color: #333; margin-top: 4px; }
    .footer-powered { font-size: 9px; color: #888; margin-top: 5px; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="logo-circle">IL</div>
    <div class="brand-name">Indus Legacy</div>
    <div class="brand-sub">Hotel &amp; Restaurant</div>
  </div>

  <hr class="double">

  <!-- INVOICE INFO -->
  <div class="info-row">
    <span class="info-label">Invoice #</span>
    <span class="info-value">${invoiceRef}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Date</span>
    <span class="info-value">${dateStr}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Time</span>
    <span class="info-value">${timeStr}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Order Type</span>
    <span class="info-value">${orderTypeLabel}</span>
  </div>
  ${tableNo ? `
  <div class="info-row">
    <span class="info-label">${orderType === 'delivery' ? 'Rider' : 'Table'}</span>
    <span class="info-value">${tableNo}</span>
  </div>` : ''}
  ${cashierName ? `
  <div class="info-row">
    <span class="info-label">Cashier</span>
    <span class="info-value">${cashierName}</span>
  </div>` : ''}

  <hr class="dashed">

  <!-- ORDER ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:42%">Item</th>
        <th style="width:10%">Qty</th>
        <th style="width:22%">Price</th>
        <th style="width:26%">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <hr class="dashed">

  <!-- SUBTOTAL / DISCOUNT / TAX -->
  <table class="totals-table">
    <tbody>
      <tr>
        <td style="text-align:right;color:#555;">Subtotal:</td>
        <td style="text-align:right;width:36%;">Rs. ${Number(subtotal).toLocaleString()}</td>
      </tr>
      ${discountRow}
      ${taxRow}
    </tbody>
  </table>

  <hr class="solid">

  <!-- GRAND TOTAL -->
  <table class="totals-table">
    <tbody>
      <tr class="grand-row">
        <td style="text-align:right;">TOTAL PAYABLE:</td>
        <td style="text-align:right;width:36%;">Rs. ${Number(totalAmount).toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <hr class="dashed">

  <!-- PAYMENT METHOD -->
  <div style="text-align:center;margin:4px 0;">
    <span class="payment-badge">PAID VIA: ${paymentMethod || 'Cash'}</span>
  </div>

  <hr class="double">

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-thanks">*** Thank You! Come Again ***</div>
    <div class="footer-address">
      Indus Legacy Hotel &amp; Restaurant<br>
      Karachi Bypass Road, Indus Town<br>
      Karachi, Pakistan
    </div>
    <div class="footer-powered">Powered by Indus Legacy</div>
  </div>

</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=340,height=650,toolbar=0,scrollbars=1,status=0');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups to print receipts.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 350);
}

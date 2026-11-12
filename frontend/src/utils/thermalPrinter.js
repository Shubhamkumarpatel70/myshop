const ESC = 0x1B;
const GS = 0x1D;

const encoder = new TextEncoder();
const money = value => `INR ${Number(value || 0).toFixed(2)}`;
const clean = value => String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();

const wrap = (value, width) => {
    const words = clean(value).split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        if (!word) continue;
        if (word.length > width) {
            if (line) lines.push(line);
            line = '';
            for (let i = 0; i < word.length; i += width) lines.push(word.slice(i, i + width));
            continue;
        }
        if (line && (line.length + word.length + 1) > width) {
            lines.push(line);
            line = word;
        } else {
            line = line ? `${line} ${word}` : word;
        }
    }
    if (line) lines.push(line);
    return lines;
};

const padRow = (left, right, width) => {
    const a = clean(left).slice(0, width);
    const b = clean(right).slice(0, width);
    return a + ' '.repeat(Math.max(1, width - a.length - b.length)) + b;
};

export const isThermalPrinterSupported = () =>
    typeof window !== 'undefined' && !!navigator.serial && window.isSecureContext;

export const connectThermalPrinter = async () => {
    if (!isThermalPrinterSupported()) {
        throw new Error('Direct printer connection needs Chrome or Edge on HTTPS with Web Serial support.');
    }
    const ports = await navigator.serial.getPorts();
    const port = ports[0] || await navigator.serial.requestPort();
    const info = port.getInfo?.() || {};
    return {
        port,
        name: [info.usbVendorId ? `USB ${info.usbVendorId.toString(16).toUpperCase()}` : '', info.usbProductId ? `Product ${info.usbProductId.toString(16).toUpperCase()}` : ''].filter(Boolean).join(' · ') || 'Serial thermal printer',
    };
};

export const getAuthorizedThermalPrinters = async () => {
    if (!isThermalPrinterSupported()) return [];
    return navigator.serial.getPorts();
};

export const printThermalReceipt = async (sale, columns = 32) => {
    if (!isThermalPrinterSupported()) {
        throw new Error('Thermal printing needs Chrome or Edge on a secure HTTPS page with Web Serial support.');
    }
    if (!sale || !Array.isArray(sale.items)) throw new Error('Receipt data is not available.');

    const width = columns === 48 ? 48 : 32;
    const shop = sale.user || {};
    let printerSettings = {};
    try { printerSettings = JSON.parse(localStorage.getItem('stocksaathi_thermal_printer_settings') || '{}'); } catch { printerSettings = {}; }
    const lines = [];
    const add = value => lines.push(...wrap(value, width));
    const divider = '-'.repeat(width);

    if (printerSettings.shopHeader !== false) {
        lines.push(...[shop.shopName || 'STOCK SAATHI'].flatMap(value => wrap(value, width)));
        if (shop.address) lines.push(...wrap(shop.address, width));
        if (shop.phone) lines.push(...wrap(`Phone: ${shop.phone}`, width));
        if (shop.gstEnabled && shop.gstin) lines.push(...wrap(`GSTIN: ${shop.gstin}`, width));
    }
    lines.push(divider, 'TAX INVOICE', divider);
    add(`Bill: ${sale.transactionId || sale._id || 'N/A'}`);
    add(`Date: ${new Date(sale.createdAt || Date.now()).toLocaleString('en-IN')}`);
    add(`Customer: ${sale.customerName || 'Guest'}`);
    if (sale.customerPhone) add(`Phone: ${sale.customerPhone}`);
    lines.push(divider);
    add(padRow('ITEM / QTY', 'AMOUNT', width));
    lines.push(divider);

    let taxableSubtotal = 0;
    let taxTotal = 0;
    let netTotal = 0;
    for (const item of sale.items) {
        const name = item.product?.productName || item.productName || (typeof item.product === 'object' ? item.product?.name : '') || 'Product';
        const quantity = Number(item.quantity || 0);
        const returnedQty = Number(item.returnedQuantity || (item.isReturned ? quantity : 0));
        const remainingQty = Math.max(0, quantity - returnedQty);
        const ratio = quantity > 0 ? remainingQty / quantity : 0;
        const amount = Number(item.total ?? (Number(item.price || 0) * quantity)) * ratio;
        taxableSubtotal += Number(item.taxableAmount ?? (Number(item.price || 0) * quantity)) * ratio;
        taxTotal += Number(item.taxAmount || 0) * ratio;
        netTotal += amount;
        const nameLines = wrap(name, width);
        lines.push(...nameLines);
        const qtyPrice = `  ${remainingQty} x ${Number(item.price || 0).toFixed(2)}`;
        lines.push(...wrap(padRow(qtyPrice, money(amount), width), width));
        if (returnedQty > 0) lines.push(...wrap(`  RETURNED: ${returnedQty}`, width));
    }
    lines.push(divider);
    lines.push(padRow('SUBTOTAL', money(taxableSubtotal), width));
    const returnedRatio = item => {
        const quantity = Number(item.quantity || 0);
        const returnedQty = Number(item.returnedQuantity || (item.isReturned ? quantity : 0));
        return quantity > 0 ? Math.max(0, quantity - returnedQty) / quantity : 0;
    };
    const cgst = sale.items.reduce((sum, item) => sum + Number(item.cgst || 0) * returnedRatio(item), 0);
    const sgst = sale.items.reduce((sum, item) => sum + Number(item.sgst || 0) * returnedRatio(item), 0);
    const igst = sale.items.reduce((sum, item) => sum + Number(item.igst || 0) * returnedRatio(item), 0);
    if (cgst) lines.push(padRow('CGST', money(cgst), width));
    if (sgst) lines.push(padRow('SGST', money(sgst), width));
    if (igst) lines.push(padRow('IGST', money(igst), width));
    if (!cgst && !sgst && !igst && taxTotal) lines.push(padRow('TAX', money(taxTotal), width));
    lines.push(divider);
    const discountAmount = Number(sale.discountAmount || 0);
    if (discountAmount > 0) {
        const discountLabel = sale.discountType === 'percentage' ? `DISCOUNT (${Number(sale.discountValue)}%)` : 'DISCOUNT';
        lines.push(padRow(discountLabel, `- ${money(discountAmount)}`, width));
    } else {
        lines.push(padRow('DISCOUNT', 'N/A', width));
    }
    lines.push(padRow('TOTAL', money(Number(sale.totalAmount ?? Math.max(0, netTotal - discountAmount))), width));
    add(`Payment: ${sale.paymentMethod || 'N/A'}`);
    if (Array.isArray(sale.payments) && sale.payments.length > 1) {
        for (const payment of sale.payments) add(`${payment.mode}: ${money(payment.amount)}`);
    }
    if (sale.customerGSTIN) add(`Customer GSTIN: ${sale.customerGSTIN}`);
    lines.push(divider, ...wrap(printerSettings.footer || 'THANK YOU! VISIT AGAIN', width), ...wrap('Powered by ASKC TECHNOLOGIES', width), '', '');

    const bytes = [
        ESC, 0x40,             // Initialize
        ESC, 0x61, 0x01,       // Center
        ESC, 0x45, 0x01,       // Bold
        ...encoder.encode(lines[0] + '\n'),
        ESC, 0x45, 0x00,
        ESC, 0x61, 0x00,       // Left
        ...encoder.encode(lines.slice(1).join('\n') + '\n'),
        GS, 0x56, 0x41, 0x03  // Partial cut
    ];

    const authorizedPorts = await navigator.serial.getPorts();
    const port = authorizedPorts[0] || await navigator.serial.requestPort();
    let openedHere = false;
    try {
        if (!port.readable || !port.writable) {
            await port.open({ baudRate: 9600 });
            openedHere = true;
        }
        const writer = port.writable.getWriter();
        try {
            await writer.write(new Uint8Array(bytes));
        } finally {
            writer.releaseLock();
        }
    } finally {
        if (openedHere) await port.close().catch(() => {});
    }
};

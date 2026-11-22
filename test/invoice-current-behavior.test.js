'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');

function order(items, coupon) {
  return {
    id: 1001,
    items,
    coupon: coupon || '',
    total: 0,
    tax: 0,
    subtotal: 0,
    discount: 0
  };
}

test('Invoice figures match checkout for an HSN GST slab', function () {
  const items = [{ id: 1, sku: 'RICE-1', name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  const billed = pricing.computeTotals(items, '');
  const printed = invoice.computeInvoiceFigures(order(items));
  assert.deepEqual(printed, {
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    cgst: billed.cgst,
    sgst: billed.sgst,
    total: billed.total,
    rows: [{ name: 'Rice', sku: 'RICE-1', hsn: '1006', qty: 1, price: 100, gstPercent: 5, line: 100, lineTax: 5 }]
  });
});

test('Invoice figures match checkout discount allocation and tax on discounted value', function () {
  const items = [{ id: 1, sku: 'TEA-1', name: 'Tea', hsn: '0902', price: 1000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const printed = invoice.computeInvoiceFigures(order(items, 'SAVE10'));
  assert.equal(billed.discount, 100);
  assert.equal(billed.tax, 162);
  assert.equal(billed.total, 1062);
  assert.equal(printed.discount, billed.discount);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.total, billed.total);
  assert.equal(printed.rows[0].lineTax, billed.lines[0].tax);
});

test('Invoice figures match checkout percentage coupon caps', function () {
  const items = [{ id: 1, sku: 'TEA-2', name: 'Tea', hsn: '0902', price: 2000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const printed = invoice.computeInvoiceFigures(order(items, 'SAVE10'));
  assert.equal(billed.discount, 150);
  assert.equal(printed.discount, billed.discount);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.total, billed.total);
});

test('Invoice line GST percentage matches checkout HSN lookup', function () {
  const item = { id: 1, name: 'Oil', hsn: '1512', price: 100, qty: 1 };
  const billed = pricing.computeTotals([item], '');
  const printed = invoice.computeInvoiceFigures(order([item]));
  assert.equal(printed.rows[0].gstPercent, billed.lines[0].gstPercent);
  assert.equal(printed.rows[0].lineTax, billed.lines[0].tax);
});

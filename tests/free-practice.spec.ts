import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

const APP = pathToFileURL(
  path.resolve('app/sajilo-bazaar.html')
).href;

test('P1: Lokta Paper Notebook toast', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Lokta Paper Notebook' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  await expect(page.getByRole('status'))
    .toHaveText('Lokta Paper Notebook added to cart');

  await expect(page.getByRole('status')).toBeHidden();

  await expect(page.getByTestId('cart-count')).toHaveText('1');
});

test('P2: Singing Bowl is sold out after adding', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Singing Bowl' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  await expect(
    product.getByRole('button', { name: 'Sold out' })
  ).toBeDisabled();

  await expect(page.getByTestId('cart-count')).toHaveText('1');
});

test('P3: updates quantities and calculates totals', async ({ page }) => {
  await page.goto(APP);

  const shawl = page.getByRole('listitem')
    .filter({ hasText: 'Pashmina Shawl' });

  const gundruk = page.getByRole('listitem')
    .filter({ hasText: 'Gundruk' });

  await shawl.getByRole('button', { name: 'Add to cart' }).click();
  await gundruk.getByRole('button', { name: 'Add to cart' }).click();

  const gundrukRow = page.getByRole('row', { name: /Gundruk/ });

  const increaseButton = gundrukRow.getByRole('button', {
    name: /increase/i,
  });

  await increaseButton.click();

  await increaseButton.click();

  await expect(gundrukRow).toContainText('3');
  await expect(page.getByTestId('cart-count')).toHaveText('4');
});

test('P4: rejects invalid promo and applies DASHAIN10', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Pashmina Shawl' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  const promoInput = page.getByLabel('Promo code');
  const promoMessage = page.getByTestId('promo-message');

  await promoInput.fill('INVALID123');
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(promoMessage)
    .toHaveText('Sorry, that code is not valid.');

  await expect(page.getByTestId('discount')).toHaveText('Rs 0.00');

  await promoInput.fill('DASHAIN10');
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(promoMessage)
    .toHaveText('DASHAIN10 applied: 10% off your items');

  await expect(page.getByTestId('subtotal')).toHaveText('Rs 4,500.00');

  await expect(page.getByTestId('discount')).toHaveText('Rs 450.00');

  await expect(page.getByTestId('order-total')).toHaveText('Rs 4,050.00');
});

test('P5: updates the total when a delivery area is selected', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Pashmina Shawl' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  await expect(page.getByTestId('subtotal'))
    .toHaveText('Rs 4,500.00');

  const delivery = page.locator('#delivery');

  await delivery.selectOption('valley');

  await expect(page.getByTestId('delivery-fee'))
    .toHaveText('Rs 100.00');

  await expect(page.getByTestId('order-total'))
    .toHaveText('Rs 4,600.00');

  await delivery.selectOption('outside');

  await expect(page.getByTestId('delivery-fee'))
    .toHaveText('Rs 250.00');

  await expect(page.getByTestId('order-total'))
    .toHaveText('Rs 4,750.00');
});

test('P6: prevents checkout when delivery is not selected', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Pashmina Shawl' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  await page.locator('#delivery').selectOption('');

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe(
      'Please choose a delivery area before checkout.'
    );
    await dialog.accept();
  });

  await page.locator('#checkout-btn').click();

  await expect(page.locator('#checkout')).toBeHidden();
});

test('P7: removes a product from the cart', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Pashmina Shawl' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  const cartRow = page.getByTestId('cart-row')
    .filter({ hasText: 'Pashmina Shawl' });

  await expect(cartRow).toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain(
      'Remove Pashmina Shawl from your cart?'
    );
    await dialog.accept();
  });

  await cartRow.getByRole('button', { name: 'Remove' }).click();

  await expect(cartRow).toHaveCount(0);
  await expect(page.getByTestId('cart-count')).toHaveText('0');
  await expect(page.getByText('Your cart is empty.')).toBeVisible();
});

test('P8: keeps the product when removal is cancelled', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Pashmina Shawl' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  const cartRow = page.getByTestId('cart-row')
    .filter({ hasText: 'Pashmina Shawl' });

  await expect(cartRow).toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain(
      'Remove Pashmina Shawl from your cart?'
    );
    await dialog.dismiss();
  });

  await cartRow.getByRole('button', { name: 'Remove' }).click();

  await expect(cartRow).toBeVisible();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
});

test('P9: adds a gift note to the order', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Pashmina Shawl' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  await page.locator('#delivery').selectOption('valley');

  await expect(page.getByTestId('delivery-fee'))
    .not.toHaveText('Calculating...');

  await page.getByRole('button', { name: 'Proceed to checkout' }).click();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('Write a short gift note');
    await dialog.accept('Happy Dashain! Enjoy your gift.');
  });

  await page.locator('#gift-btn').click();

  await expect(page.getByTestId('gift-note'))
    .toContainText('Happy Dashain! Enjoy your gift.');
});

test('P10: completes a successful eSewa practice payment', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Pashmina Shawl' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  await page.locator('#delivery').selectOption('valley');

  await expect(page.getByTestId('delivery-fee'))
    .not.toHaveText('Calculating...');

  await page.getByRole('button', { name: 'Proceed to checkout' }).click();

  const payment = page.frameLocator('#esewa-frame');

  await payment.locator('#eid').waitFor({ state: 'visible' });

  await payment.locator('#eid').fill('9841234567');
  await payment.locator('#mpin').fill('1234');

  await payment.getByRole('button', { name: 'Pay now' }).click();

  await expect(
    page.getByRole('heading', { name: 'Order placed!' })
  ).toBeVisible();

  await expect(page.getByTestId('order-id'))
    .toHaveText(/^SB-\d{6}$/);

  await expect(page.getByTestId('paid-amount'))
    .toHaveText('Rs 4,600.00');
});

test('P11: verifies the receipt after successful payment', async ({ page }) => {
  await page.goto(APP);

  const product = page.getByRole('listitem')
    .filter({ hasText: 'Pashmina Shawl' });

  await product.getByRole('button', { name: 'Add to cart' }).click();

  await page.locator('#delivery').selectOption('valley');

  await expect(page.getByTestId('delivery-fee'))
    .toHaveText('Rs 100.00');

  await page.getByRole('button', { name: 'Proceed to checkout' }).click();

  const payment = page.frameLocator('#esewa-frame');

  await payment.locator('#eid').waitFor({ state: 'visible' });
  await payment.locator('#eid').fill('9841234567');
  await payment.locator('#mpin').fill('1234');

  await payment.getByRole('button', { name: 'Pay now' }).click();

  await expect(
    page.getByRole('heading', { name: 'Order placed!' })
  ).toBeVisible();

  const orderId = await page.getByTestId('order-id').textContent();

  const receiptPromise = page.waitForEvent('popup');

  await page.getByRole('link', { name: 'View receipt' }).click();

  const receipt = await receiptPromise;
  await receipt.waitForLoadState();

  await expect(
    receipt.getByRole('heading', { name: 'Receipt' })
  ).toBeVisible();

  await expect(receipt.getByTestId('receipt-order-id'))
    .toHaveText(orderId!);

  await expect(receipt.getByTestId('receipt-delivery'))
    .toHaveText('Rs 100.00');

  await expect(receipt.getByTestId('receipt-discount'))
    .toHaveText('Rs 0.00');

  await expect(receipt.getByTestId('receipt-total'))
    .toHaveText('Rs 4,600.00');

  await expect(receipt.getByTestId('receipt-note'))
    .toHaveText('No gift note.');
});
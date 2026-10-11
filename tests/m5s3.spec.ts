
import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

const APP = pathToFileURL(
  path.resolve('app/sajilo-bazaar.html')
).href;

test('buy a Dhaka Topi and Ilam tea with eSewa', async ({ page }) => {
  await page.goto(APP);

  // Step 1: wait for the products to finish loading
  const products = page.getByRole('list', { name: 'Products' })
    .getByRole('listitem');

  await expect(products).toHaveCount(6);

  // Step 2: add two items and check the cart badge
  await products.filter({ hasText: 'Dhaka Topi' })
    .getByRole('button', { name: 'Add to cart' }).click();

  await expect(page.getByTestId('cart-count')).toHaveText('1');

  await products.filter({ hasText: 'Ilam Orthodox Tea' })
    .getByRole('button', { name: 'Add to cart' }).click();

  await expect(page.getByTestId('cart-count')).toHaveText('2');

  // Step 3: choose delivery and check the order summary
  await page.getByLabel('Delivery area')
    .selectOption({ label: 'Inside Kathmandu Valley' });

  await expect(page.getByTestId('subtotal'))
    .toHaveText('Rs 1,450.00');

  await expect(page.getByTestId('delivery-fee'))
    .toHaveText('Rs 100.00');

  await expect(page.getByTestId('order-total'))
    .toHaveText('Rs 1,550.00');

  // Step 4: check out and pay inside the eSewa iframe
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();

  const esewa = page.frameLocator('iframe[title="eSewa payment"]');

  await expect(esewa.getByTestId('pay-amount'))
    .toHaveText('Rs 1,550.00');

  await esewa.getByLabel('eSewa ID').fill('9841234567');
  await esewa.getByLabel('MPIN').fill('1234');

  await esewa.getByRole('button', { name: 'Pay now' }).click();

  // Step 5: confirm the order on the main page
  await expect(page.getByRole('heading', { name: 'Order placed!' }))
    .toBeVisible();

  await expect(page.getByTestId('order-id'))
    .toHaveText(/^SB-\d{6}$/);

  await expect(page.getByTestId('paid-amount'))
    .toHaveText('Rs 1,550.00');
});


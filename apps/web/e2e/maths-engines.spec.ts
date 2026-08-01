/**
 * BUILD-DISTRICT-MATHS gate #1: all five engines render Case mode AND Plain
 * mode from the SAME fixture rows, and the flagship interactions work
 * tap-tap: the Bar Model Builder builds/splits/labels and answers its
 * authored check; the chart answers by tapping a bar; the stretchy
 * rectangle updates area and perimeter live. (Tablet-landscape + budget
 * device + reduced-motion remain the human half of the gate.)
 */
import { expect, test } from '@playwright/test';
import { cleanupFixtures, createFamily, enterCrewMode, parentApi } from './fixtures';

test.afterAll(cleanupFixtures);

test.beforeEach(async ({ page }) => {
  const family = await createFamily(`maths-harness-${Date.now()}`);
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);
  await api.dispose();
  await page.goto('/crew/debug/maths-engines');
});

test('five engines in Case mode, five in Plain, same rows', async ({ page }) => {
  for (const engine of ['forge', 'workshop', 'markhomework', 'datadesk', 'shapeshop']) {
    await expect(page.getByTestId(`engine-${engine}`)).toBeVisible();
  }
  await page.getByTestId('toggle-plain').click();
  for (const engine of ['forge', 'workshop', 'markhomework', 'datadesk', 'shapeshop']) {
    await expect(page.getByTestId(`engine-${engine}-plain`)).toBeVisible();
  }
  // Plain is GL-faithful: no Builder, no chart buttons, no stretch handles.
  await expect(page.locator('.crew-barmodel')).toHaveCount(0);
  await expect(page.locator('.crew-shapeshop-handles')).toHaveCount(0);
});

test('the Bar Model Builder builds tap-tap and answers its authored check', async ({ page }) => {
  const workshop = page.getByTestId('engine-workshop');
  const builder = workshop.locator('.crew-barmodel');

  // Not matching yet: an empty model is kindly told what is missing.
  await builder.getByRole('button', { name: '+ bar' }).click();
  await builder.getByRole('button', { name: 'Does my model match the story?' }).click();
  await expect(builder.getByText('more quantities than your model')).toBeVisible();

  // Build the story: 3 parts of 4, plus the mystery bar.
  const firstBar = builder.locator('.crew-barmodel-bar').first();
  await firstBar.click();
  await builder.getByRole('button', { name: 'split +' }).click();
  await builder.getByRole('button', { name: 'split +' }).click();
  await builder.getByRole('button', { name: 'label' }).click();
  await builder.getByRole('button', { name: '4', exact: true }).click();
  await builder.getByRole('button', { name: '✓' }).click();
  await builder.getByRole('button', { name: '+ bar' }).click();
  await builder.locator('.crew-barmodel-bar').nth(1).click();
  await builder.getByRole('button', { name: 'mystery ?' }).click();

  await builder.getByRole('button', { name: 'Does my model match the story?' }).click();
  await expect(builder.getByText('tells the same story')).toBeVisible();
});

test('Data Desk answers by tapping the chart; Shape Shop stretches live', async ({ page }) => {
  const datadesk = page.getByTestId('engine-datadesk');
  await datadesk.getByRole('button', { name: 'Tue: choose this' }).click();
  // Tapping the bar selected its paired MC option.
  await expect(datadesk.getByRole('button', { name: 'Tuesday' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const shapeshop = page.getByTestId('engine-shapeshop');
  await expect(shapeshop.getByText('Area: 24 square m · Perimeter: 20 m')).toBeVisible();
  await shapeshop.getByRole('button', { name: 'wider +' }).click();
  await expect(shapeshop.getByText('Area: 28 square m · Perimeter: 22 m')).toBeVisible();
});

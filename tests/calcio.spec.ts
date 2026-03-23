import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://calciolive.vercel.app';

async function clickNav(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
  await page.waitForTimeout(1000);
}

async function goTo(page: Page, name: string) {
  await page.goto(BASE_URL);
  await clickNav(page, name);
}

// ── HOME ──────────────────────────────────────────────────────────
test.describe('Home', () => {

  test('la pagina carica correttamente', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('.h-hero')).toBeVisible();
  });

  test('il selettore competizioni è visibile', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('.h-sel-btn').first()).toBeVisible();
  });

  test('cambiare competizione aggiorna il titolo hero', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.h-sel-btn').filter({ hasText: 'Premier' }).click();
    await expect(page.locator('.h-eyebrow')).toContainText('Premier');
  });

  test('le card esplora sono visibili', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('.h-explore-card').first()).toBeVisible();
  });

});

// ── NAVIGAZIONE ───────────────────────────────────────────────────
test.describe('Navigazione', () => {

  test('naviga alla classifica', async ({ page }) => {
    await goTo(page, 'Classifica');
    await expect(page.locator('.cl-page').first()).toBeVisible({ timeout: 8000 });
  });

  test('naviga ai risultati', async ({ page }) => {
    await goTo(page, 'Risultati & Quote');
    await expect(page.locator('.res-page').first()).toBeVisible({ timeout: 8000 });
  });

  test('naviga ai marcatori', async ({ page }) => {
    await goTo(page, 'Marcatori');
    await expect(page.locator('.mar-page').first()).toBeVisible({ timeout: 8000 });
  });

  test('naviga alle quote', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Quote', exact: true }).last().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.q-page').first()).toBeVisible({ timeout: 8000 });
  });

  test('torna alla home', async ({ page }) => {
    await goTo(page, 'Classifica');
    await clickNav(page, 'Home');
    await expect(page.locator('.h-hero')).toBeVisible({ timeout: 5000 });
  });

});

// ── CLASSIFICA ────────────────────────────────────────────────────
test.describe('Classifica', () => {

  test.beforeEach(async ({ page }) => { await page.waitForTimeout(1500); });

  test('mostra la tabella con almeno 10 squadre', async ({ page }) => {
    await goTo(page, 'Classifica');
    await page.waitForSelector('.cl-row', { timeout: 12000 });
    const rows = await page.locator('.cl-row').count();
    expect(rows).toBeGreaterThanOrEqual(10);
  });

  test('click su una squadra apre il pannello laterale', async ({ page }) => {
    await goTo(page, 'Classifica');
    await page.waitForSelector('.cl-row', { timeout: 12000 });
    await page.locator('.cl-row').first().click();
    await expect(page.locator('.sq-panel')).toBeVisible({ timeout: 5000 });
  });

  test('il pannello squadra si chiude cliccando X', async ({ page }) => {
    await goTo(page, 'Classifica');
    await page.waitForSelector('.cl-row', { timeout: 12000 });
    await page.locator('.cl-row').first().click();
    await page.waitForSelector('.sq-close', { timeout: 5000 });
    await page.locator('.sq-close').click();
    await expect(page.locator('.sq-panel')).not.toBeVisible({ timeout: 3000 });
  });

  test('il pannello squadra mostra le tab Rosa e Staff', async ({ page }) => {
    await goTo(page, 'Classifica');
    await page.waitForSelector('.cl-row', { timeout: 12000 });
    await page.locator('.cl-row').first().click();
    await page.waitForSelector('.sq-tab', { timeout: 5000 });
    await expect(page.locator('.sq-tab').filter({ hasText: /rosa/i })).toBeVisible();
    await expect(page.locator('.sq-tab').filter({ hasText: /staff/i })).toBeVisible();
  });

  test('cambio tab da Rosa a Staff funziona', async ({ page }) => {
    await goTo(page, 'Classifica');
    await page.waitForSelector('.cl-row', { timeout: 12000 });
    await page.locator('.cl-row').first().click();
    await page.waitForSelector('.sq-tab', { timeout: 5000 });
    await page.locator('.sq-tab').filter({ hasText: /staff/i }).click();
    await expect(page.locator('.sq-staff-card').first()).toBeVisible({ timeout: 5000 });
  });

});

// ── RISULTATI ─────────────────────────────────────────────────────
test.describe('Risultati', () => {

  test.beforeEach(async ({ page }) => { await page.waitForTimeout(1500); });

  test('mostra le partite della giornata corrente', async ({ page }) => {
    await goTo(page, 'Risultati & Quote');
    await page.waitForSelector('.res-match', { timeout: 12000 });
    const matches = await page.locator('.res-match').count();
    expect(matches).toBeGreaterThan(0);
  });

  test('navigazione giornata avanti funziona', async ({ page }) => {
    await goTo(page, 'Risultati & Quote');
    await page.waitForSelector('.res-nav-num', { timeout: 12000 });
    const before = await page.locator('.res-nav-num').first().innerText();
    await page.locator('.res-nav-btn').last().click();
    await page.waitForTimeout(1500);
    const after = await page.locator('.res-nav-num').first().innerText();
    expect(Number(after)).toBeGreaterThan(Number(before));
  });

  test('navigazione giornata indietro funziona', async ({ page }) => {
    await goTo(page, 'Risultati & Quote');
    await page.waitForSelector('.res-nav-num', { timeout: 12000 });
    await page.locator('.res-nav-btn').last().click();
    await page.waitForTimeout(800);
    const before = await page.locator('.res-nav-num').first().innerText();
    await page.locator('.res-nav-btn').first().click();
    await page.waitForTimeout(1500);
    const after = await page.locator('.res-nav-num').first().innerText();
    expect(Number(after)).toBeLessThan(Number(before));
  });

});

// ── CHAMPIONS LEAGUE ──────────────────────────────────────────────
test.describe('Champions League - Tabellone', () => {

  test.beforeEach(async ({ page }) => { await page.waitForTimeout(1500); });

  test('selezionando CL appare il tabellone knockout', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.h-sel-btn').filter({ hasText: 'Champions' }).click();
    await clickNav(page, 'Risultati & Quote');
    await page.waitForSelector('.res-bracket-wrap', { timeout: 12000 });
    await expect(page.locator('.res-bracket-wrap')).toBeVisible();
  });

  test('i bottoni delle fasi sono visibili', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.h-sel-btn').filter({ hasText: 'Champions' }).click();
    await clickNav(page, 'Risultati & Quote');
    await page.waitForSelector('.res-stage-btn', { timeout: 12000 });
    const stages = await page.locator('.res-stage-btn').count();
    expect(stages).toBeGreaterThan(0);
  });

  test('click su una sfida nel tabellone apre il modal', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.h-sel-btn').filter({ hasText: 'Champions' }).click();
    await clickNav(page, 'Risultati & Quote');
    await page.waitForSelector('.res-br-tie', { timeout: 12000 });
    await page.locator('.res-br-tie').first().click();
    await expect(page.locator('.res-modal')).toBeVisible({ timeout: 5000 });
  });

  test('il modal mostra andata e ritorno', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.h-sel-btn').filter({ hasText: 'Champions' }).click();
    await clickNav(page, 'Risultati & Quote');
    await page.waitForSelector('.res-br-tie', { timeout: 12000 });
    await page.locator('.res-br-tie').first().click();
    await page.waitForSelector('.res-modal-leg', { timeout: 5000 });
    const legs = await page.locator('.res-modal-leg').count();
    expect(legs).toBeGreaterThanOrEqual(1);
  });

  test('il modal si chiude cliccando la X', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.h-sel-btn').filter({ hasText: 'Champions' }).click();
    await clickNav(page, 'Risultati & Quote');
    await page.waitForSelector('.res-br-tie', { timeout: 12000 });
    await page.locator('.res-br-tie').first().click();
    await page.waitForSelector('.res-modal-close', { timeout: 5000 });
    await page.locator('.res-modal-close').click();
    await expect(page.locator('.res-modal')).not.toBeVisible({ timeout: 3000 });
  });

});

// ── MARCATORI ─────────────────────────────────────────────────────
test.describe('Marcatori', () => {

  test.beforeEach(async ({ page }) => { await page.waitForTimeout(1500); });

  test('mostra il podio top 3', async ({ page }) => {
    await goTo(page, 'Marcatori');
    await page.waitForSelector('.mar-pod-card', { timeout: 12000 });
    const podium = await page.locator('.mar-pod-card').count();
    expect(podium).toBe(3);
  });

  test('mostra la tabella marcatori', async ({ page }) => {
    await goTo(page, 'Marcatori');
    await page.waitForSelector('.mar-row', { timeout: 12000 });
    const rows = await page.locator('.mar-row').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('cambiando competizione i marcatori si aggiornano', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.h-sel-btn').filter({ hasText: 'Premier' }).click();
    await clickNav(page, 'Marcatori');
    await page.waitForSelector('.mar-pod-card', { timeout: 12000 });
    await expect(page.locator('.mar-eyebrow, .mar-hero').first()).toContainText(/Premier/i);
  });

});

// ── QUOTE ─────────────────────────────────────────────────────────
test.describe('Quote', () => {

  test.beforeEach(async ({ page }) => { await page.waitForTimeout(1500); });

  test('mostra le partite con quote', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Quote', exact: true }).last().click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.q-match', { timeout: 12000 });
    const matches = await page.locator('.q-match').count();
    expect(matches).toBeGreaterThan(0);
  });

  test('i bottoni 1X2 sono presenti', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Quote', exact: true }).last().click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.q-odd-btn', { timeout: 12000 });
    const btns = await page.locator('.q-odd-btn').count();
    expect(btns).toBeGreaterThan(0);
  });

  test('aggiungere una quota al carrello funziona', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Quote', exact: true }).last().click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.q-odd-btn', { timeout: 12000 });
    await page.locator('.q-odd-btn').first().click();
    await expect(page.locator('.q-cart')).toBeVisible({ timeout: 3000 });
  });

  test('la quota selezionata appare nel carrello', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Quote', exact: true }).last().click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.q-odd-btn', { timeout: 12000 });
    await page.locator('.q-odd-btn').first().click();
    await expect(page.locator('.q-cart-item').first()).toBeVisible({ timeout: 3000 });
  });

  test('svuotare il carrello funziona', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Quote', exact: true }).last().click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.q-odd-btn', { timeout: 12000 });
    await page.locator('.q-odd-btn').first().click();
    await page.waitForSelector('.q-cart-clear', { timeout: 3000 });
    await page.locator('.q-cart-clear').click();
    await expect(page.locator('.q-cart')).not.toBeVisible({ timeout: 3000 });
  });

  test('switch tab Over/Under funziona', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Quote', exact: true }).last().click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.q-tab', { timeout: 12000 });
    await page.locator('.q-tab').last().click();
    await expect(page.locator('.q-tab').last()).toHaveClass(/active/);
  });

  test('la vincita potenziale si calcola', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: 'Quote', exact: true }).last().click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.q-odd-btn', { timeout: 12000 });
    await page.locator('.q-odd-btn').first().click();
    await expect(page.locator('.q-win-val')).toBeVisible({ timeout: 3000 });
  });

});
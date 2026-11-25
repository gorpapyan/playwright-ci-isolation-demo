import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'playwright/test';

async function reserveSlot(store: string, slotId: string) {
  try {
    await mkdir(join(store, slotId));
    return 'reserved';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    return 'already reserved';
  }
}

for (const journey of ['guest', 'signed-in']) {
  test(`${journey} can reserve a viewing slot`, async ({}, testInfo) => {
    const store = process.env.SLOT_STORE;
    if (!store) throw Error('Use npm run demo to create a fresh reservation store');

    const slotId = process.env.SLOT_MODE === 'isolated'
      ? `viewing-slot-${testInfo.parallelIndex}`
      : 'viewing-slot-shared';

    const status = await reserveSlot(store, slotId);
    await writeFile(join(store, `arrived-${journey}`), '');
    await expect.poll(async () => {
      const entries = await readdir(store);
      return entries.filter((entry) => entry.startsWith('arrived-')).length;
    }).toBe(2);

    expect(status).toBe('reserved');
  });
}

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fetchCampaignProgress } from './campaign-source.mjs';

const output = process.env.CAMPAIGN_OUTPUT
  ? resolve(process.env.CAMPAIGN_OUTPUT)
  : new URL('../src/data/campaign-progress.json', import.meta.url);

// Refresh at dev startup and build time. Keep the last verified, dated snapshot
// when GoFundMe is unavailable; never replace a failed request with zeroes.
try {
  const progress = await fetchCampaignProgress();
  await writeFile(output, JSON.stringify(progress, null, 2) + '\n');
  console.log(`GoFundMe progress refreshed: ${progress.currency} ${progress.raised} of ${progress.goal}, ${progress.donations} donations.`);
} catch (error) {
  // A clean checkout must contain a verified snapshot to fall back to.
  await readFile(output, 'utf8');
  console.warn(`GoFundMe refresh skipped; keeping the dated snapshot. ${error.message}`);
  if (process.env.CAMPAIGN_REFRESH_REQUIRED === '1') process.exitCode = 1;
}

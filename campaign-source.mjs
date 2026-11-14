export const campaignUrl = 'https://www.gofundme.com/f/no-child-should-die-of-malaria';

export function parseCampaignProgress(html, now = new Date()) {
  const match = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Campaign data was not found');
  const data = JSON.parse(match[1]);
  const fundraiser = Object.entries(data.props?.pageProps?.__APOLLO_STATE__ || {}).find(([key, value]) =>
    key.startsWith('Fundraiser:') && value?.slug === 'no-child-should-die-of-malaria' && value?.currentAmount && value?.goalAmount
  )?.[1];
  const raised = fundraiser?.currentAmount.amount;
  const goal = fundraiser?.goalAmount.amount;
  const currency = fundraiser?.currentAmount.currencyCode;
  const donations = fundraiser?.donationCount;
  if (!Number.isFinite(raised) || raised < 0 || !Number.isFinite(goal) || goal <= 0 ||
      !Number.isInteger(donations) || donations < 0 || !/^[A-Z]{3}$/.test(currency) ||
      currency !== fundraiser.goalAmount.currencyCode) {
    throw new Error('Campaign figures could not be validated');
  }
  return { raised, goal, currency, donations, checkedAt: now.toISOString(), source: campaignUrl };
}

export async function fetchCampaignProgress() {
  const response = await fetch(campaignUrl, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`GoFundMe returned ${response.status}`);
  return parseCampaignProgress(await response.text());
}

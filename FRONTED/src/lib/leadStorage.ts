import { createClient } from '@sanity/client';

export type LeadRecord = {
  submissionId: string;
  formType: 'contact' | 'coa';
  name: string;
  email: string;
  phone: string;
  company?: string;
  sourcePage?: string;
  sourceCountry?: string;
  sourceRegion?: string;
  sourceCity?: string;
  interest?: string;
  message?: string;
  industry?: string;
  productName?: string;
  quantity?: string;
  role?: string;
  demand?: string;
  application?: string[];
  coaUrl?: string;
};

function getWriteClient() {
  const token = import.meta.env.SANITY_WRITE_TOKEN || import.meta.env.SANITY_API_TOKEN;
  if (!token) throw new Error('SANITY_WRITE_TOKEN is not configured.');

  return createClient({
    projectId: import.meta.env.SANITY_PROJECT_ID || 'h5gs7zpr',
    dataset: import.meta.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token,
  });
}

export async function persistLead(lead: LeadRecord) {
  return getWriteClient().create({
    _id: `lead-${lead.submissionId}`,
    _type: 'lead',
    ...lead,
    submittedAt: new Date().toISOString(),
    status: 'new',
    teamEmailStatus: 'pending',
    autoReplyStatus: 'pending',
  });
}

export async function updateLeadDelivery(
  submissionId: string,
  patch: Record<string, string>,
) {
  return getWriteClient().patch(`lead-${submissionId}`).set(patch).commit();
}

/**
 * Agreement document templates. Placeholders: {{partyName}}, {{companyName}}, {{date}}, {{role}}, {{title}}, {{year}}
 */
export type AgreementTemplateKey = 'NDA' | 'MOU' | 'HireContract' | 'Partnership' | 'Investor' | 'Terms' | 'FairTreatment' | 'CoFounder';

export const AGREEMENT_TEMPLATES: Record<AgreementTemplateKey, string> = {
  NDA: `
    <h1>Non-Disclosure Agreement</h1>
    <p><strong>Effective Date:</strong> {{date}}</p>
    <p>This NDA is entered into between <strong>{{companyName}}</strong> and <strong>{{partyName}}</strong>.</p>
    <p>1. Definition of Confidential Information. "Confidential Information" means any non-public information disclosed by either party.</p>
    <p>2. Obligations. Each party agrees to hold Confidential Information in confidence and not disclose to third parties without prior written consent.</p>
    <p>3. Term. This agreement remains in effect for {{termYears}} years from the Effective Date.</p>
    <p>4. Governing Law. This agreement is governed by the laws of the jurisdiction agreed by the parties.</p>
    <p><em>By signing below, the parties acknowledge they have read and agree to the terms above.</em></p>
  `,
  MOU: `
    <h1>Memorandum of Understanding</h1>
    <p><strong>Date:</strong> {{date}}</p>
    <p>This MOU is between <strong>{{companyName}}</strong> and <strong>{{partyName}}</strong> regarding {{subject}}.</p>
    <p>The parties intend to work together in good faith toward the objectives described herein. This MOU is not a legally binding contract unless otherwise stated.</p>
    <p><em>Signed by the parties as of the date first written above.</em></p>
  `,
  HireContract: `
    <h1>Hiring / Contractor Agreement</h1>
    <p><strong>Effective Date:</strong> {{date}}</p>
    <p><strong>Company:</strong> {{companyName}}</p>
    <p><strong>Contractor / Talent:</strong> {{partyName}}</p>
    <p><strong>Role:</strong> {{role}}</p>
    <p>1. Scope of Work. The Contractor agrees to perform the services as described in the project or statement of work.</p>
    <p>2. Compensation. Compensation and payment terms are as agreed in the platform or separate annex.</p>
    <p>3. Term. This agreement is effective from the Effective Date until completion or termination as per the terms.</p>
    <p>4. Confidentiality. The Contractor agrees to keep confidential any proprietary information of the Company.</p>
    <p><em>By signing, both parties agree to the terms of this agreement.</em></p>
  `,
  Partnership: `
    <h1>Partnership Agreement</h1>
    <p><strong>Date:</strong> {{date}}</p>
    <p>This Partnership Agreement is entered into between <strong>{{companyName}}</strong> and <strong>{{partyName}}</strong>.</p>
    <p>1. Purpose. The parties agree to collaborate as set forth in the partnership terms.</p>
    <p>2. Contributions. Each party's contributions and responsibilities are as agreed in writing.</p>
    <p>3. Revenue and Costs. Allocation of revenue and costs shall be as agreed by the parties.</p>
    <p>4. Term and Termination. This agreement remains in effect until terminated by mutual consent or as otherwise provided.</p>
    <p><em>Execution by both parties constitutes acceptance of these terms.</em></p>
  `,
  Investor: `
    <h1>Investor Agreement</h1>
    <p><strong>Date:</strong> {{date}}</p>
    <p>This Investor Agreement is between <strong>{{companyName}}</strong> (Company) and <strong>{{partyName}}</strong> (Investor).</p>
    <p>1. Investment. The Investor agrees to invest the amount and on the terms set out in the term sheet or investment annex.</p>
    <p>2. Representations. Each party represents that it has the authority to enter into this agreement.</p>
    <p>3. Use of Funds. The Company shall use the investment for the purposes agreed with the Investor.</p>
    <p>4. Governing Law. This agreement is governed by the laws of the chosen jurisdiction.</p>
    <p><em>By signing, the parties agree to be bound by this agreement.</em></p>
  `,
  Terms: `
    <h1>Terms and Conditions</h1>
    <p><strong>Effective:</strong> {{date}}</p>
    <p>These Terms apply to the use of the platform and services provided by <strong>{{companyName}}</strong>.</p>
    <p>By using the service, you agree to these terms. Please read them carefully.</p>
    <p><em>Acceptance is indicated by signature or continued use where applicable.</em></p>
  `,
  FairTreatment: `
    <h1>Fair Treatment Agreement</h1>
    <p><strong>Date:</strong> {{date}}</p>
    <p>This Fair Treatment Agreement is entered into by <strong>{{partyName}}</strong> in connection with participation on the platform.</p>
    <p>The parties commit to fair and respectful conduct in all interactions related to the platform and any projects.</p>
    <p><em>Signature indicates acceptance of these principles.</em></p>
  `,
  CoFounder: `
    <h1>Co-Founder Agreement</h1>
    <p><strong>Date:</strong> {{date}}</p>
    <p>This Co-Founder Agreement is between <strong>{{companyName}}</strong> and <strong>{{partyName}}</strong>.</p>
    <p>1. Roles. Each co-founder's role and responsibilities are as agreed.</p>
    <p>2. Equity and Vesting. Equity allocation and vesting terms are as set out in the annex or cap table.</p>
    <p>3. Decision Making. Major decisions require mutual agreement as defined in the company governance.</p>
    <p><em>Execution by all co-founders constitutes acceptance.</em></p>
  `,
};

export function fillAgreementTemplate(
  templateKey: AgreementTemplateKey,
  data: Record<string, string | undefined>
): string {
  let html = AGREEMENT_TEMPLATES[templateKey] ?? '';
  const year = new Date().getFullYear().toString();
  const date = data.date ?? data.effectiveDate ?? new Date().toISOString().slice(0, 10);
  const replace: Record<string, string> = {
    ...data,
    date,
    year,
    partyName: data.partyName ?? '________________',
    companyName: data.companyName ?? '________________',
    role: data.role ?? '________________',
    subject: data.subject ?? 'the matters described herein',
    termYears: data.termYears ?? '2',
  };
  for (const [key, value] of Object.entries(replace)) {
    if (value !== undefined && value !== null) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), value);
    }
  }
  return html.replace(/\{\{\w+\}\}/g, '________________').trim();
}

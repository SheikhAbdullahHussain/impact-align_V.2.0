/**
 * Marketing copy for the home page. Placeholder-grade: it describes the product's intent and
 * makes no claims about results, accreditation bodies, certifications or statistics.
 */
export interface TitledItem {
  readonly title: string;
  readonly description: string;
}

export const chainSteps: readonly TitledItem[] = [
  { title: 'SDG Goal', description: 'A Sustainable Development Goal' },
  { title: 'Target', description: 'A specific aim within the goal' },
  { title: 'Indicator', description: 'How progress is measured' },
  { title: 'Evidence', description: 'Documents and data you submit' },
  { title: 'Impact', description: 'What changed as a result' },
  { title: 'Validation', description: 'Reviewed by a human assessor' },
  { title: 'Accreditation', description: 'Recognition after human validation' },
];

export const valueProps: readonly TitledItem[] = [
  {
    title: 'Connect work to the SDG framework',
    description:
      'Map your activities to the right goals, targets and indicators instead of retrofitting a report at the end.',
  },
  {
    title: 'Keep evidence organised and traceable',
    description:
      'Every claim links to the evidence behind it, so reviewers can follow the trail from goal to proof.',
  },
  {
    title: 'Human-validated results',
    description:
      'AI can suggest and summarise. People — qualified assessors — make the validation and accreditation decisions.',
  },
];

export const audiences: readonly TitledItem[] = [
  { title: 'Entrepreneurs', description: 'Show how your venture contributes to the SDGs.' },
  { title: 'Professionals', description: 'Document and align your practice-based impact.' },
  { title: 'Professors', description: 'Connect teaching and programmes to the goals.' },
  { title: 'Researchers', description: 'Link research outputs to targets and indicators.' },
  { title: 'Organizations', description: 'Manage projects, evidence and team contributions.' },
  { title: 'Institutions', description: 'Understand alignment across departments and units.' },
  { title: 'Practitioners', description: 'Record field work with structured evidence.' },
  { title: 'Partners', description: 'Collaborate with and support aligned initiatives.' },
  { title: 'Assessors', description: 'Review evidence and validate impact claims.' },
];

export const methodSteps: readonly TitledItem[] = [
  { title: 'Diagnose', description: 'Understand current activities, gaps and priorities.' },
  { title: 'Align', description: 'Map activities to SDG goals, targets and indicators.' },
  { title: 'Measure', description: 'Collect evidence and indicator data against your plan.' },
  { title: 'Validate', description: 'A human assessor reviews the evidence and the claims.' },
  { title: 'Improve', description: 'Act on findings and strengthen the next cycle.' },
];

export interface FeatureItem extends TitledItem {
  readonly status: 'Planned';
}

export const platformFeatures: readonly FeatureItem[] = [
  {
    title: 'Alignment mapping',
    description: 'Link projects and activities to goals, targets and indicators.',
    status: 'Planned',
  },
  {
    title: 'Evidence management',
    description: 'Upload, organise and track evidence with secure, private storage.',
    status: 'Planned',
  },
  {
    title: 'Assessment workflow',
    description: 'Structured review by assessors, with clarification requests.',
    status: 'Planned',
  },
  {
    title: 'Impact dashboard',
    description: 'See alignment progress and open items across your projects.',
    status: 'Planned',
  },
  {
    title: 'Accreditation journey',
    description: 'Follow your submission from evidence to a human decision.',
    status: 'Planned',
  },
  {
    title: 'Reports & certificates',
    description: 'Generate reports and verifiable certificates after validation.',
    status: 'Planned',
  },
];

export const aiPrinciples: readonly string[] = [
  'AI output is always labelled as AI-generated.',
  'AI suggests; it never makes the final validation or accreditation decision.',
  'A human assessor remains responsible for every final outcome.',
  'AI interactions are logged so they can be audited.',
];

export const dashboardMetrics: readonly string[] = [
  'Impact alignment',
  'Active projects',
  'Pending assessments',
  'Evidence submitted',
  'Accreditation status',
];

export const journeySteps: readonly TitledItem[] = [
  { title: 'Submit evidence', description: 'Attach evidence to the indicators you address.' },
  { title: 'Impact assessment', description: 'Evidence is checked against framework criteria.' },
  {
    title: 'Human validation',
    description: 'A qualified assessor confirms or queries the claims.',
  },
  { title: 'Accreditation decision', description: 'Made by people, never by AI.' },
];

/** SDG numbers only. Official goal titles, targets and indicators load from the database later. */
export const SDG_COUNT = 17;

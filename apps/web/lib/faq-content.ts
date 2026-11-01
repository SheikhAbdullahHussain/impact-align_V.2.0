/** Accreditation FAQ copy (source: File-3, Frequently Asked Questions - Accreditation). */
/** A string is one paragraph; an array of strings is a bullet list. */
export type FaqBlock = string | readonly string[];

export interface FaqItem {
  readonly number: number;
  readonly question: string;
  readonly answer: readonly FaqBlock[];
}

export interface FaqGroup {
  readonly id: string;
  readonly title: string;
  readonly items: readonly FaqItem[];
}

const q = (number: number, question: string, ...answer: FaqBlock[]): FaqItem => ({
  number,
  question,
  answer,
});

export const faqGroups: readonly FaqGroup[] = [
  {
    id: 'general',
    title: 'General Questions',
    items: [
      q(
        1,
        'What is ImpactAlign SDG Accreditation?',
        'ImpactAlign SDG Accreditation is a structured evidence-based process that assesses how a project, research work, startup, institutional initiative, organizational report, or other eligible submission aligns with relevant Sustainable Development Goals (SDGs), targets, indicators, and measurable outcomes.',
      ),
      q(
        2,
        'What is the purpose of ImpactAlign SDG Accreditation?',
        'The purpose is to help applicants move from activities to evidence, from evidence to impact, and from impact to recognition by documenting, assessing, validating, and communicating their contribution to sustainable development.',
      ),
      q(
        3,
        'Who can apply for accreditation?',
        'Accreditation may be available to Individuals, Institutes, Organizations, and Corporations, subject to the applicable eligibility and evidence requirements.',
      ),
      q(4, 'What types of work can be submitted?', 'Eligible submissions may include:', [
        'Research Manuscripts',
        'Research Proposals',
        'Theses & Dissertations',
        'Project Proposals',
        'Startups',
        'Institutional Reports',
        'Organizational Reports',
        'SDG-related Projects and Initiatives',
        'Other evidence-based work accepted under the applicable accreditation category',
      ]),
      q(
        5,
        'Is ImpactAlign SDG Accreditation the same as university or professional accreditation?',
        'No. ImpactAlign SDG Accreditation is specifically designed to assess SDG alignment, evidence, outcomes, impact, and measurable contribution. It should not be presented as a substitute for statutory, institutional, professional, or programme accreditation granted by a legally authorized accreditation body.',
      ),
    ],
  },
  {
    id: 'sdg-alignment',
    title: 'SDG Alignment',
    items: [
      q(
        6,
        'How does ImpactAlign identify the relevant SDGs?',
        'The assessment identifies the SDGs that are substantively connected to the submitted work. Applicants may indicate relevant SDGs, while the assessment process examines whether the claimed alignment is supported by evidence.',
      ),
      q(
        7,
        'Are SDG Targets and Indicators included in the assessment?',
        'Yes. Where applicable, the assessment goes beyond simply naming an SDG and considers the relevant Goal → Target → Indicator → Evidence → Outcome → Impact relationship.',
      ),
      q(
        8,
        'Can one submission address more than one SDG?',
        'Yes. A submission may contribute to multiple SDGs. However, each claimed SDG should have a meaningful and evidence-supported connection with the work.',
      ),
      q(
        9,
        'Can I apply if my work addresses only one SDG?',
        'Yes. A submission does not need to address all 17 SDGs. The assessment focuses on the relevance and evidence of the claimed alignment, rather than the number of SDGs selected.',
      ),
      q(
        10,
        'What if I am unsure which SDG applies to my work?',
        'ImpactAlign may assist in identifying potentially relevant SDGs, targets, and indicators through its assessment methodology and, where available, AI-assisted mapping. Final alignment should be supported by appropriate evidence and reviewer validation.',
      ),
    ],
  },
  {
    id: 'application-requirements',
    title: 'Application & Requirements',
    items: [
      q(
        11,
        'What information is required to start an accreditation application?',
        'Applicants will generally need to provide:',
        [
          'Applicant/account information',
          'Type of applicant',
          'Submission category',
          'Title of the work',
          'Abstract or executive summary',
          'Relevant SDG(s)',
          'Keywords',
          'Supporting document(s)',
          'Evidence of outputs, outcomes, or impact where applicable',
          'Any additional information required for the selected accreditation category',
        ],
      ),
      q(
        12,
        'What kind of evidence is required?',
        'Evidence may include research findings, datasets, publications, reports, photographs, project records, institutional documents, implementation records, stakeholder evidence, measurable outputs and outcomes, monitoring data, or other credible supporting documentation.',
      ),
      q(
        13,
        'Does the submission have to be a completed project?',
        'Not necessarily. Some accreditation categories may accept proposals or works at different stages. However, the type and strength of accreditation evidence will depend on the nature and maturity of the submission.',
      ),
      q(
        14,
        'Can a research proposal be accredited?',
        'A research proposal may be eligible for an appropriate SDG alignment or prospective-impact assessment, provided that it demonstrates a credible relationship between the proposed research, SDG targets, indicators, expected outputs, outcomes, and potential impact.',
      ),
      q(
        15,
        'Can a thesis or dissertation be submitted?',
        'Yes, where the relevant accreditation category is available. The assessment can examine the research problem, methodology, findings, SDG alignment, evidence, outcomes, and potential or demonstrated impact.',
      ),
    ],
  },
  {
    id: 'assessment-process',
    title: 'Assessment Process',
    items: [
      q(
        16,
        'What happens after I submit my application?',
        'The general process is:',
        'Submit → Screen → Diagnose → Align → Assess → Validate → Decision → Report/Certificate → Verify',
        'Applicants can track the status of their submission through their dashboard.',
      ),
      q(
        17,
        'What does “Diagnose” mean?',
        'Diagnosis identifies the current level of SDG relevance, evidence availability, measurable outcomes, and potential impact within the submitted work.',
      ),
      q(
        18,
        'What does “Align” mean?',
        'Alignment connects the work with relevant SDGs, targets, indicators, evidence, outcomes, and impact pathways.',
      ),
      q(
        19,
        'What does “Measure” mean?',
        'Measurement examines available quantitative and qualitative evidence against relevant assessment criteria and indicators.',
      ),
      q(
        20,
        'What does “Validate” mean?',
        'Validation involves reviewing the submitted claims and evidence to determine whether the stated SDG alignment and impact are adequately supported.',
      ),
      q(
        21,
        'Who assesses the submission?',
        'Assessment may involve a combination of structured criteria, technology-assisted analysis, and qualified human review, depending on the accreditation category and methodology.',
      ),
      q(
        22,
        'Is the assessment entirely conducted by AI?',
        'No. AI may support activities such as document analysis, keyword identification, SDG mapping, evidence organization, and preliminary assessment. Human review and validation remain important for substantive accreditation decisions.',
      ),
      q(
        23,
        'Can the applicant challenge or clarify an assessment?',
        'Where applicable, applicants may be provided an opportunity to respond to clarification requests, provide additional evidence, or follow the designated review or appeal procedure.',
      ),
    ],
  },
  {
    id: 'ai-evidence',
    title: 'AI & Evidence',
    items: [
      q(
        24,
        'How does ImpactAlign use AI?',
        'AI may assist with:',
        [
          'SDG and keyword mapping',
          'Document analysis',
          'Evidence categorization',
          'Indicator identification',
          'Impact-area identification',
          'Preliminary consistency checks',
          'Dashboard insights',
        ],
        'AI is intended to support assessment, not replace evidence or responsible human judgment.',
      ),
      q(
        25,
        'Can AI-generated content be used as evidence?',
        'AI-generated text by itself should not normally be treated as sufficient evidence of real-world impact. Accreditation should be supported by verifiable evidence and credible documentation.',
      ),
      q(
        26,
        'How does ImpactAlign address AI ethics?',
        'The system should emphasize transparency, human oversight, responsible data handling, traceability, avoidance of unsupported claims, and appropriate disclosure of AI-assisted processes.',
      ),
    ],
  },
  {
    id: 'accreditation-decision',
    title: 'Accreditation Decision',
    items: [
      q(
        27,
        'What are the possible outcomes of an application?',
        'Depending on the accreditation scheme, an application may receive a status such as:',
        [
          'Accredited',
          'Accredited with Conditions / Improvement Requirements',
          'Pending Further Evidence',
          'Not Accredited',
        ],
        'The applicable decision categories will be defined in the relevant accreditation manual.',
      ),
      q(
        28,
        'Does submission automatically guarantee accreditation?',
        'No. Submission only begins the assessment process. Accreditation depends on satisfying the applicable requirements and providing sufficient evidence.',
      ),
      q(
        29,
        'What happens if my submission does not meet the requirements?',
        'The applicant may receive an assessment report identifying areas requiring clarification, additional evidence, or improvement. Where permitted, the applicant may revise and resubmit the work.',
      ),
      q(
        30,
        'Will I receive an assessment report?',
        "Yes, an assessment report should provide structured information about the submission's SDG alignment, evidence, indicators, outcomes, impact areas, and areas for improvement, subject to the selected accreditation package.",
      ),
    ],
  },
  {
    id: 'certificate-verification',
    title: 'Certificate & Verification',
    items: [
      q(
        31,
        'What do I receive after successful accreditation?',
        'Depending on the accreditation category, successful applicants may receive:',
        [
          'ImpactAlign SDG Accreditation Certificate',
          'Accreditation/assessment report',
          'SDG alignment profile',
          'Applicable digital verification information',
          'Accreditation identification/reference number',
          'Dashboard record',
        ],
      ),
      q(
        32,
        'Can an accreditation certificate be verified online?',
        'Yes, where online verification is enabled. A verification system can allow stakeholders to confirm the authenticity and status of an accreditation using the relevant certificate/reference ID or verification mechanism.',
      ),
      q(
        33,
        'Can I display the ImpactAlign SDG accreditation mark?',
        'Accredited applicants may be permitted to display the applicable ImpactAlign SDG accreditation mark according to the brand, logo, and certification-use guidelines.',
      ),
      q(
        34,
        'Does accreditation mean that ImpactAlign guarantees the claimed social or environmental impact?',
        'No. Accreditation confirms that the submission has been assessed against the applicable ImpactAlign criteria and evidence requirements. It should not be interpreted as a guarantee of future impact or as an independent guarantee of every claim made by the applicant.',
      ),
    ],
  },
  {
    id: 'time-fees-subscription',
    title: 'Time, Fees & Subscription',
    items: [
      q(
        35,
        'How long does accreditation take?',
        'Processing time depends on the submission type, completeness of documentation, complexity of assessment, evidence requirements, and review process. The applicable estimated timeline should be displayed during the application process.',
      ),
      q(
        36,
        'Is there an accreditation fee?',
        'Fees may vary according to the applicant type, submission category, assessment scope, and selected service/package. The applicable fee should be shown before payment.',
      ),
      q(
        37,
        'Is Membership the same as Accreditation?',
        'No.',
        'Membership provides access to the ImpactAlign community, resources, information, and applicable member benefits.',
        'Accreditation is a formal assessment process for a specific submission against defined SDG alignment and impact criteria.',
      ),
      q(
        38,
        'Is Subscription the same as Accreditation?',
        'No. Subscription generally provides access to defined services, submission capacity, tools, or platform features. Accreditation is the assessment and recognition process applied to an eligible submission.',
      ),
    ],
  },
  {
    id: 'renewal-improvement',
    title: 'Renewal & Continuous Improvement',
    items: [
      q(
        39,
        'Does accreditation expire?',
        'The validity period depends on the applicable accreditation scheme. Where accreditation has a defined validity period, the certificate will indicate the relevant dates and renewal requirements.',
      ),
      q(
        40,
        'Can an accredited work be reassessed?',
        'Yes. Reassessment may be appropriate when significant new evidence, outcomes, impact data, or improvements become available.',
      ),
      q(
        41,
        'Can I improve my accreditation after receiving the assessment?',
        'Yes. ImpactAlign is designed not only to assess existing performance but also to identify evidence gaps, alignment opportunities, measurement needs, and areas for continuous improvement.',
      ),
    ],
  },
  {
    id: 'confidentiality-data',
    title: 'Confidentiality & Data',
    items: [
      q(
        42,
        'How is my submitted information handled?',
        "Submitted information should be handled according to ImpactAlign's applicable privacy policy, data protection procedures, confidentiality provisions, and terms of service.",
      ),
      q(
        43,
        'Will my research or project be publicly displayed?',
        "Not necessarily. Public visibility should depend on the applicant's consent, the applicable service terms, and the selected accreditation/publication options.",
      ),
      q(
        44,
        'Can confidential or unpublished research be submitted?',
        'Potentially, subject to the applicable confidentiality and evidence requirements. Applicants should avoid submitting information that cannot legally or appropriately be shared with the assessment platform or reviewers.',
      ),
    ],
  },
  {
    id: 'verification-integrity',
    title: 'Verification & Integrity',
    items: [
      q(
        45,
        'What happens if submitted evidence is found to be inaccurate?',
        'ImpactAlign may request clarification or additional evidence and may take action under its accreditation rules if material information is found to be inaccurate, misleading, fabricated, or improperly represented.',
      ),
      q(
        46,
        'Can an accreditation be suspended or withdrawn?',
        'Where the accreditation framework permits it, an accreditation may be subject to review, suspension, or withdrawal if significant issues arise, including material misrepresentation or failure to meet continuing requirements.',
      ),
      q(
        47,
        "Can someone verify an organization's accreditation?",
        'Yes, where the verification service is available. Verification should allow stakeholders to check the accreditation reference, status, applicable scope, and validity.',
      ),
    ],
  },
];

export const FAQ_COUNT = faqGroups.reduce((total, group) => total + group.items.length, 0);
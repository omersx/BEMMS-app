// ── Attestation Templates ───────────────────────────────────────────────────

export const ATTESTATION_TEMPLATES: Record<string, string> = {
  perform: 'I confirm that I performed the recorded maintenance/inspection and that the information entered is accurate to the best of my knowledge.',
  review: 'I have reviewed the performed work, findings, evidence, and test results, and confirm technical completeness and accuracy.',
  approve: 'I approve the recorded work, findings, and recommendations in accordance with the applicable policy.',
  release: 'I authorize the release of this medical device for clinical use with the specified operational status.',
  accept: 'I accept responsibility for the assigned work and confirm I will perform it in accordance with applicable procedures.',
  resolve: 'I confirm that the issue has been resolved and the resolution summary accurately describes the work performed.',
  close: 'I confirm that the ticket resolution is sufficiently documented and complete under the applicable policy.',
  reject: 'I am returning this work for correction. The stated reason identifies the issues that must be addressed.',
  amend: 'I am submitting a correction to the previously signed record. The amendment reason describes the changes made.',
  void: 'I am voiding this signature/record. The stated reason documents why this action is necessary.',
};

export function getAttestationText(purpose: string): string {
  return ATTESTATION_TEMPLATES[purpose] || `I confirm this ${purpose} action and that the information is accurate.`;
}

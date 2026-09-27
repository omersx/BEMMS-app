export interface DefaultManufacturerTemplate {
  name: string;
  code: string;
  country: string;
  website?: string;
}

export const DEFAULT_MANUFACTURERS: DefaultManufacturerTemplate[] = [
  { name: 'B. Braun', code: 'BBRAUN', country: 'Germany', website: 'https://www.bbraun.com' },
  { name: 'Baxter International', code: 'BAXTER', country: 'United States', website: 'https://www.baxter.com' },
  { name: 'Beckman Coulter', code: 'BECKMAN', country: 'United States', website: 'https://www.beckmancoulter.com' },
  { name: 'Canon Medical Systems', code: 'CANON', country: 'Japan', website: 'https://global.medical.canon' },
  { name: 'Dentsply Sirona', code: 'SIRONA', country: 'United States', website: 'https://www.dentsplysirona.com' },
  { name: 'Dräger (Draeger)', code: 'DRAEGER', country: 'Germany', website: 'https://www.draeger.com' },
  { name: 'Fresenius Medical Care', code: 'FRESENIUS', country: 'Germany', website: 'https://www.freseniusmedicalcare.com' },
  { name: 'Fujifilm Healthcare', code: 'FUJIFILM', country: 'Japan', website: 'https://healthcaresolutions-us.fujifilm.com' },
  { name: 'GE HealthCare', code: 'GE', country: 'United States', website: 'https://www.gehealthcare.com' },
  { name: 'Getinge / Maquet', code: 'GETINGE', country: 'Sweden', website: 'https://www.getinge.com' },
  { name: 'Hamilton Medical', code: 'HAMILTON', country: 'Switzerland', website: 'https://www.hamilton-medical.com' },
  { name: 'Medtronic', code: 'MEDTRONIC', country: 'United States', website: 'https://www.medtronic.com' },
  { name: 'Mindray', code: 'MINDRAY', country: 'China', website: 'https://www.mindray.com' },
  { name: 'Nihon Kohden', code: 'NIHON_KOHDEN', country: 'Japan', website: 'https://www.nihonkohden.com' },
  { name: 'Olympus', code: 'OLYMPUS', country: 'Japan', website: 'https://www.olympus-global.com' },
  { name: 'Philips Healthcare', code: 'PHILIPS', country: 'Netherlands', website: 'https://www.philips.com/healthcare' },
  { name: 'Planmeca', code: 'PLANMECA', country: 'Finland', website: 'https://www.planmeca.com' },
  { name: 'Roche Diagnostics', code: 'ROCHE', country: 'Switzerland', website: 'https://diagnostics.roche.com' },
  { name: 'Schiller', code: 'SCHILLER', country: 'Switzerland', website: 'https://www.schiller.ch' },
  { name: 'Siemens Healthineers', code: 'SIEMENS', country: 'Germany', website: 'https://www.siemens-healthineers.com' },
  { name: 'Stryker', code: 'STRYKER', country: 'United States', website: 'https://www.stryker.com' },
  { name: 'Zoll Medical', code: 'ZOLL', country: 'United States', website: 'https://www.zoll.com' },
];

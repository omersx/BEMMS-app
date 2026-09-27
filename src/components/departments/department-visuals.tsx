import type { LucideIcon } from 'lucide-react';
import {
  Siren,
  Activity,
  Scissors,
  Microscope,
  Scan,
  Baby,
  Smile,
  Building2,
} from 'lucide-react';

export interface DepartmentVisualConfig {
  icon: LucideIcon;
  label: string;
  badgeLabel: string;
  iconWrapperClass: string;
  detailWrapperClass: string;
  badgeClass: string;
}

/**
 * Maps hospital departments to dedicated clinical icons and color palettes.
 * Specifically configured for the 7 primary hospital departments:
 * 1. Emergency Department -> Siren (Rose/Red)
 * 2. Intensive Care Unit (ICU) -> Activity (Cyan/Teal)
 * 3. Surgery & Operating Theatre -> Scissors (Indigo/Violet)
 * 4. Clinical Laboratory -> Microscope (Emerald/Green)
 * 5. Radiology & Medical Imaging -> Scan (Sky/Blue)
 * 6. Pediatrics -> Baby (Amber/Orange)
 * 7. Dental Clinic -> Smile (Teal/Emerald)
 */
export function getDepartmentVisuals(
  name: string,
  code?: string | null,
  type?: string | null
): DepartmentVisualConfig {
  const text = `${name} ${code || ''} ${type || ''}`.toLowerCase();

  // 1. Emergency Department
  if (
    text.includes('emerg') ||
    text.includes('trauma') ||
    text.includes('er') ||
    text.includes('urgenc')
  ) {
    return {
      icon: Siren,
      label: 'Emergency',
      badgeLabel: 'Emergency',
      iconWrapperClass:
        'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white',
      detailWrapperClass: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
      badgeClass:
        'border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:bg-rose-950/40',
    };
  }

  // 2. Intensive Care Unit (ICU)
  if (
    text.includes('icu') ||
    text.includes('intensive') ||
    text.includes('critical') ||
    text.includes('ccu')
  ) {
    return {
      icon: Activity,
      label: 'Intensive Care',
      badgeLabel: 'Critical Care',
      iconWrapperClass:
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white',
      detailWrapperClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400',
      badgeClass:
        'border-cyan-200 text-cyan-700 bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:bg-cyan-950/40',
    };
  }

  // 3. Surgery & Operating Theatre
  if (
    text.includes('surg') ||
    text.includes('operat') ||
    text.includes('theatre') ||
    text.includes('theater') ||
    text.includes('or')
  ) {
    return {
      icon: Scissors,
      label: 'Surgery',
      badgeLabel: 'Surgical Unit',
      iconWrapperClass:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white',
      detailWrapperClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400',
      badgeClass:
        'border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:bg-indigo-950/40',
    };
  }

  // 4. Clinical Laboratory
  if (
    text.includes('lab') ||
    text.includes('patholog') ||
    text.includes('hematol') ||
    text.includes('microbiol')
  ) {
    return {
      icon: Microscope,
      label: 'Laboratory',
      badgeLabel: 'Diagnostics',
      iconWrapperClass:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
      detailWrapperClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
      badgeClass:
        'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/40',
    };
  }

  // 5. Radiology & Medical Imaging
  if (
    text.includes('radio') ||
    text.includes('imag') ||
    text.includes('x-ray') ||
    text.includes('xray') ||
    text.includes('mri') ||
    text.includes('ct scan') ||
    text.includes('ultrasound')
  ) {
    return {
      icon: Scan,
      label: 'Radiology',
      badgeLabel: 'Imaging',
      iconWrapperClass:
        'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white',
      detailWrapperClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400',
      badgeClass:
        'border-sky-200 text-sky-700 bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:bg-sky-950/40',
    };
  }

  // 6. Pediatrics
  if (
    text.includes('pedia') ||
    text.includes('child') ||
    text.includes('baby') ||
    text.includes('neonat') ||
    text.includes('nicu')
  ) {
    return {
      icon: Baby,
      label: 'Pediatrics',
      badgeLabel: 'Pediatric Care',
      iconWrapperClass:
        'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
      detailWrapperClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
      badgeClass:
        'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-950/40',
    };
  }

  // 7. Dental Clinic
  if (
    text.includes('dent') ||
    text.includes('tooth') ||
    text.includes('teeth') ||
    text.includes('orthodon') ||
    text.includes('oral')
  ) {
    return {
      icon: Smile,
      label: 'Dental',
      badgeLabel: 'Dental Care',
      iconWrapperClass:
        'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white',
      detailWrapperClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400',
      badgeClass:
        'border-teal-200 text-teal-700 bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:bg-teal-950/40',
    };
  }

  // Default fallback
  return {
    icon: Building2,
    label: 'Department',
    badgeLabel: 'Clinical',
    iconWrapperClass:
      'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
    detailWrapperClass: 'bg-primary/10 text-primary',
    badgeClass: 'bg-secondary text-secondary-foreground',
  };
}

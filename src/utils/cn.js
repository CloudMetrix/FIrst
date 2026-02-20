import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatClientName(name) {
  if (!name) return '';
  
  // Handle special cases first
  const specialCases = {
    'gcp': 'GCP',
    'aws': 'AWS',
    'ms-azure': 'MS Azure',
    'ibm': 'IBM',
    'sap': 'SAP'
  };
  
  const lowerName = name?.toLowerCase();
  if (specialCases?.[lowerName]) {
    return specialCases?.[lowerName];
  }
  
  // Convert slug format to proper format
  // Replace hyphens and underscores with spaces, then capitalize each word
  return name?.replace(/[-_]/g, ' ')?.split(' ')?.map(word => word?.charAt(0)?.toUpperCase() + word?.slice(1)?.toLowerCase())?.join(' ');
}
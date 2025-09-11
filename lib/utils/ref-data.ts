/**
 * Utility functions for reference data
 */

export interface SelectOption {
  value: string;
  label: string;
}


/**
 * Get the complete list of manufacturers
 * @returns Array of manufacturer objects with value and label
 */
export function getManufacturers(): SelectOption[] {
  return [
    { value: "A. Lange & Sohne", label: "A. Lange & Sohne" },
    { value: "Audemars Piguet", label: "Audemars Piguet" },
    { value: "Baume & Mercier", label: "Baume & Mercier" },
    { value: "Blancpain", label: "Blancpain" },
    { value: "Breguet", label: "Breguet" },
    { value: "Breitling", label: "Breitling" },
    { value: "Bvlgari", label: "Bvlgari" },
    { value: "Cartier", label: "Cartier" },
    { value: "Chanel", label: "Chanel" },
    { value: "Chopard", label: "Chopard" },
    { value: "Chronoswiss", label: "Chronoswiss" },
    { value: "Concord", label: "Concord" },
    { value: "Corum", label: "Corum" },
    { value: "Ebel", label: "Ebel" },
    { value: "F.P. Journe", label: "F.P. Journe" },
    { value: "Franck Muller", label: "Franck Muller" },
    { value: "Gerald Genta", label: "Gerald Genta" },
    { value: "Girard-Perregaux", label: "Girard-Perregaux" },
    { value: "Hublot", label: "Hublot" },
    { value: "IWC", label: "IWC" },
    { value: "Jaeger-LeCoultre", label: "Jaeger-LeCoultre" },
    { value: "Maurice Lacroix", label: "Maurice Lacroix" },
    { value: "Movado", label: "Movado" },
    { value: "Omega", label: "Omega" },
    { value: "Panerai", label: "Panerai" },
    { value: "Parmigiani", label: "Parmigiani" },
    { value: "Patek Philippe & Co", label: "Patek Philippe & Co" },
    { value: "Piaget", label: "Piaget" },
    { value: "Roger Dubuis", label: "Roger Dubuis" },
    { value: "Rolex", label: "Rolex" },
    { value: "Ulysse Nardin", label: "Ulysse Nardin" },
    { value: "Vacheron Constantin", label: "Vacheron Constantin" },
    { value: "Zenith", label: "Zenith" },
    { value: "Additional Brands", label: "Additional Brands" },
  ];
}

/**
 * Get manufacturer names as a simple string array
 * @returns Array of manufacturer names
 */
export function getManufacturerNames(): string[] {
  return getManufacturers().map(m => m.value);
}


/**
 * Check if a manufacturer exists in the list
 * @param manufacturer - The manufacturer name to check
 * @returns boolean indicating if the manufacturer exists
 */
export function isValidManufacturer(manufacturer: string): boolean {
  return getManufacturerNames().includes(manufacturer);
}


export function getCondition(): SelectOption[] {
  return [
    { value: "New", label: "New" },
    { value: "Used", label: "Used" },
    { value: "Refurbished", label: "Refurbished" },
    { value: "Other", label: "Other" },
  ];
}


export function getMaterials(): SelectOption[] {
  return [
    { value: "Solid White Gold", label: "Solid White Gold" },
    { value: "Solid Yellow Gold", label: "Solid Yellow Gold" },
    { value: "Solid Rose Gold", label: "Solid Rose Gold" },
    { value: "Stainless Steel", label: "Stainless Steel" },
    { value: "Steel and Yellow Gold", label: "Steel and Yellow Gold" },
    { value: "Steel and Rose Gold", label: "Steel and Rose Gold" },
    { value: "Platinum", label: "Platinum" },
    { value: "Titanium", label: "Titanium" },
    { value: "Ceramic", label: "Ceramic" },
    { value: "Leather", label: "Leather" },
    { value: "Other", label: "Other" },
  ];
}


export function getDiagnosticFeeText() {
  return "A diagnostic fee of $60 will be applied to each repair"
}

export function getRepairDurationText() {
  return "Repair will take approximately 4-6 weeks following customer approval."
}
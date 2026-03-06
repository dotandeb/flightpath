import { Airport, City } from '@/types';

export const METRO_CITIES: Record<string, City> = {
  'LON': { code: 'LON', name: 'London', country: 'United Kingdom', airports: ['LHR', 'LGW', 'STN', 'LTN', 'LCY', 'SEN'] },
  'PAR': { code: 'PAR', name: 'Paris', country: 'France', airports: ['CDG', 'ORY', 'BVA'] },
  'NYC': { code: 'NYC', name: 'New York', country: 'United States', airports: ['JFK', 'LGA', 'EWR'] },
  'TYO': { code: 'TYO', name: 'Tokyo', country: 'Japan', airports: ['NRT', 'HND'] },
  'BER': { code: 'BER', name: 'Berlin', country: 'Germany', airports: ['BER', 'TXL', 'SXF'] },
  'ROM': { code: 'ROM', name: 'Rome', country: 'Italy', airports: ['FCO', 'CIA'] },
  'MIL': { code: 'MIL', name: 'Milan', country: 'Italy', airports: ['MXP', 'LIN', 'BGY'] },
  'BCN': { code: 'BCN', name: 'Barcelona', country: 'Spain', airports: ['BCN', 'GRO'] },
  'MAD': { code: 'MAD', name: 'Madrid', country: 'Spain', airports: ['MAD'] },
  'AMS': { code: 'AMS', name: 'Amsterdam', country: 'Netherlands', airports: ['AMS', 'RTM'] },
  'FRA': { code: 'FRA', name: 'Frankfurt', country: 'Germany', airports: ['FRA', 'HHN'] },
  'MUC': { code: 'MUC', name: 'Munich', country: 'Germany', airports: ['MUC'] },
  'DUB': { code: 'DUB', name: 'Dublin', country: 'Ireland', airports: ['DUB'] },
  'EDI': { code: 'EDI', name: 'Edinburgh', country: 'United Kingdom', airports: ['EDI'] },
  'MAN': { code: 'MAN', name: 'Manchester', country: 'United Kingdom', airports: ['MAN'] },
  'BHX': { code: 'BHX', name: 'Birmingham', country: 'United Kingdom', airports: ['BHX'] },
  'GLA': { code: 'GLA', name: 'Glasgow', country: 'United Kingdom', airports: ['GLA', 'PIK'] },
  'BFS': { code: 'BFS', name: 'Belfast', country: 'United Kingdom', airports: ['BFS', 'BHD'] },
  'LAX': { code: 'LAX', name: 'Los Angeles', country: 'United States', airports: ['LAX', 'BUR', 'LGB', 'ONT', 'SNA'] },
  'CHI': { code: 'CHI', name: 'Chicago', country: 'United States', airports: ['ORD', 'MDW'] },
  'WAS': { code: 'WAS', name: 'Washington D.C.', country: 'United States', airports: ['DCA', 'IAD', 'BWI'] },
  'SFO': { code: 'SFO', name: 'San Francisco', country: 'United States', airports: ['SFO', 'OAK', 'SJC'] },
  'MIA': { code: 'MIA', name: 'Miami', country: 'United States', airports: ['MIA', 'FLL', 'PBI'] },
  'DXB': { code: 'DXB', name: 'Dubai', country: 'UAE', airports: ['DXB', 'DWC', 'SHJ'] },
  'SIN': { code: 'SIN', name: 'Singapore', country: 'Singapore', airports: ['SIN', 'XSP'] },
  'HKG': { code: 'HKG', name: 'Hong Kong', country: 'Hong Kong', airports: ['HKG'] },
  'SYD': { code: 'SYD', name: 'Sydney', country: 'Australia', airports: ['SYD'] },
  'MEL': { code: 'MEL', name: 'Melbourne', country: 'Australia', airports: ['MEL', 'AVV'] },
  'BKK': { code: 'BKK', name: 'Bangkok', country: 'Thailand', airports: ['BKK', 'DMK'] },
  'KUL': { code: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia', airports: ['KUL', 'SZB'] },
  'IST': { code: 'IST', name: 'Istanbul', country: 'Turkey', airports: ['IST', 'SAW'] },
  'CAI': { code: 'CAI', name: 'Cairo', country: 'Egypt', airports: ['CAI'] },
  'JNB': { code: 'JNB', name: 'Johannesburg', country: 'South Africa', airports: ['JNB', 'HLA'] },
  'GRU': { code: 'GRU', name: 'São Paulo', country: 'Brazil', airports: ['GRU', 'CGH', 'VCP'] },
  'MEX': { code: 'MEX', name: 'Mexico City', country: 'Mexico', airports: ['MEX', 'TLC'] },
  'YTO': { code: 'YTO', name: 'Toronto', country: 'Canada', airports: ['YYZ', 'YTZ', 'YHM'] },
  'YVR': { code: 'YVR', name: 'Vancouver', country: 'Canada', airports: ['YVR', 'YXX'] }
};

export const AIRPORTS: Record<string, Airport> = {
  'LHR': { iataCode: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  'LGW': { iataCode: 'LGW', name: 'Gatwick Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  'STN': { iataCode: 'STN', name: 'Stansted Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  'LTN': { iataCode: 'LTN', name: 'Luton Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  'LCY': { iataCode: 'LCY', name: 'London City Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  'SEN': { iataCode: 'SEN', name: 'Southend Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  'CDG': { iataCode: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  'ORY': { iataCode: 'ORY', name: 'Orly Airport', city: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  'BVA': { iataCode: 'BVA', name: 'Beauvais–Tillé Airport', city: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  'JFK': { iataCode: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', timezone: 'America/New_York' },
  'LGA': { iataCode: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', timezone: 'America/New_York' },
  'EWR': { iataCode: 'EWR', name: 'Newark Liberty International Airport', city: 'New York', country: 'United States', timezone: 'America/New_York' },
  'NRT': { iataCode: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  'HND': { iataCode: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  'AMS': { iataCode: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam' },
  'FRA': { iataCode: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', timezone: 'Europe/Berlin' },
  'MUC': { iataCode: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', timezone: 'Europe/Berlin' },
  'FCO': { iataCode: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', timezone: 'Europe/Rome' },
  'CIA': { iataCode: 'CIA', name: 'Ciampino–G. B. Pastine International Airport', city: 'Rome', country: 'Italy', timezone: 'Europe/Rome' },
  'MXP': { iataCode: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', timezone: 'Europe/Rome' },
  'LIN': { iataCode: 'LIN', name: 'Linate Airport', city: 'Milan', country: 'Italy', timezone: 'Europe/Rome' },
  'BGY': { iataCode: 'BGY', name: 'Milan Bergamo Airport', city: 'Milan', country: 'Italy', timezone: 'Europe/Rome' },
  'BCN': { iataCode: 'BCN', name: 'Barcelona–El Prat Airport', city: 'Barcelona', country: 'Spain', timezone: 'Europe/Madrid' },
  'MAD': { iataCode: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid' },
  'DUB': { iataCode: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', timezone: 'Europe/Dublin' },
  'EDI': { iataCode: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom', timezone: 'Europe/London' },
  'MAN': { iataCode: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', timezone: 'Europe/London' },
  'BHX': { iataCode: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country: 'United Kingdom', timezone: 'Europe/London' },
  'GLA': { iataCode: 'GLA', name: 'Glasgow Airport', city: 'Glasgow', country: 'United Kingdom', timezone: 'Europe/London' },
  'BFS': { iataCode: 'BFS', name: 'Belfast International Airport', city: 'Belfast', country: 'United Kingdom', timezone: 'Europe/London' },
  'LAX': { iataCode: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', timezone: 'America/Los_Angeles' },
  'ORD': { iataCode: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'United States', timezone: 'America/Chicago' },
  'SFO': { iataCode: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' },
  'MIA': { iataCode: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', timezone: 'America/New_York' },
  'DXB': { iataCode: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai' },
  'SIN': { iataCode: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  'HKG': { iataCode: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  'BKK': { iataCode: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok' },
  'KUL': { iataCode: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  'IST': { iataCode: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul' },
  'SYD': { iataCode: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
  'MEL': { iataCode: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne' },
  'YYZ': { iataCode: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', timezone: 'America/Toronto' },
  'YVR': { iataCode: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver' }
};

export function isMetroCity(code: string): boolean {
  return code.toUpperCase() in METRO_CITIES;
}

export function getMetroAirports(code: string): string[] {
  const city = METRO_CITIES[code.toUpperCase()];
  return city ? city.airports : [code.toUpperCase()];
}

export function getAirportInfo(iataCode: string): Airport | undefined {
  return AIRPORTS[iataCode.toUpperCase()];
}

export function getAirportDisplayName(iataCode: string): string {
  const airport = AIRPORTS[iataCode.toUpperCase()];
  return airport ? `${airport.iataCode} - ${airport.name}` : iataCode.toUpperCase();
}
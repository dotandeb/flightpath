// Airport Database - Full names and details
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
}

export const AIRPORTS: Record<string, Airport> = {
  // UK
  "LHR": { code: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  "LGW": { code: "LGW", name: "Gatwick Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  "STN": { code: "STN", name: "Stansted Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  "LTN": { code: "LTN", name: "Luton Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  "MAN": { code: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", countryCode: "GB" },
  "EDI": { code: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", countryCode: "GB" },
  "BHX": { code: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom", countryCode: "GB" },
  "GLA": { code: "GLA", name: "Glasgow Airport", city: "Glasgow", country: "United Kingdom", countryCode: "GB" },
  "BRS": { code: "BRS", name: "Bristol Airport", city: "Bristol", country: "United Kingdom", countryCode: "GB" },
  "NCL": { code: "NCL", name: "Newcastle Airport", city: "Newcastle", country: "United Kingdom", countryCode: "GB" },
  "LBA": { code: "LBA", name: "Leeds Bradford Airport", city: "Leeds", country: "United Kingdom", countryCode: "GB" },
  "LPL": { code: "LPL", name: "Liverpool Airport", city: "Liverpool", country: "United Kingdom", countryCode: "GB" },
  "DUB": { code: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", countryCode: "IE" },
  "BFS": { code: "BFS", name: "Belfast Airport", city: "Belfast", country: "United Kingdom", countryCode: "GB" },
  
  // France
  "CDG": { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", countryCode: "FR" },
  "ORY": { code: "ORY", name: "Orly Airport", city: "Paris", country: "France", countryCode: "FR" },
  "BVA": { code: "BVA", name: "Beauvais Airport", city: "Paris", country: "France", countryCode: "FR" },
  "NCE": { code: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "France", countryCode: "FR" },
  "LYS": { code: "LYS", name: "Lyon-Saint Exupéry Airport", city: "Lyon", country: "France", countryCode: "FR" },
  "MRS": { code: "MRS", name: "Marseille Airport", city: "Marseille", country: "France", countryCode: "FR" },
  "TLS": { code: "TLS", name: "Toulouse Airport", city: "Toulouse", country: "France", countryCode: "FR" },
  "BOD": { code: "BOD", name: "Bordeaux Airport", city: "Bordeaux", country: "France", countryCode: "FR" },
  
  // Netherlands
  "AMS": { code: "AMS", name: "Schiphol Airport", city: "Amsterdam", country: "Netherlands", countryCode: "NL" },
  "RTM": { code: "RTM", name: "Rotterdam Airport", city: "Rotterdam", country: "Netherlands", countryCode: "NL" },
  "EIN": { code: "EIN", name: "Eindhoven Airport", city: "Eindhoven", country: "Netherlands", countryCode: "NL" },
  
  // Germany
  "FRA": { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", countryCode: "DE" },
  "MUC": { code: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", countryCode: "DE" },
  "BER": { code: "BER", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", countryCode: "DE" },
  "HAM": { code: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "Germany", countryCode: "DE" },
  "DUS": { code: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf", country: "Germany", countryCode: "DE" },
  "CGN": { code: "CGN", name: "Cologne Bonn Airport", city: "Cologne", country: "Germany", countryCode: "DE" },
  "STR": { code: "STR", name: "Stuttgart Airport", city: "Stuttgart", country: "Germany", countryCode: "DE" },
  "HHN": { code: "HHN", name: "Frankfurt Hahn Airport", city: "Frankfurt", country: "Germany", countryCode: "DE" },
  
  // Italy
  "FCO": { code: "FCO", name: "Fiumicino Airport", city: "Rome", country: "Italy", countryCode: "IT" },
  "MXP": { code: "MXP", name: "Malpensa Airport", city: "Milan", country: "Italy", countryCode: "IT" },
  "VCE": { code: "VCE", name: "Venice Airport", city: "Venice", country: "Italy", countryCode: "IT" },
  "NAP": { code: "NAP", name: "Naples Airport", city: "Naples", country: "Italy", countryCode: "IT" },
  
  // Spain
  "MAD": { code: "MAD", name: "Barajas Airport", city: "Madrid", country: "Spain", countryCode: "ES" },
  "BCN": { code: "BCN", name: "Barcelona Airport", city: "Barcelona", country: "Spain", countryCode: "ES" },
  "AGP": { code: "AGP", name: "Málaga Airport", city: "Málaga", country: "Spain", countryCode: "ES" },
  "SVQ": { code: "SVQ", name: "Seville Airport", city: "Seville", country: "Spain", countryCode: "ES" },
  
  // Portugal
  "LIS": { code: "LIS", name: "Lisbon Airport", city: "Lisbon", country: "Portugal", countryCode: "PT" },
  "OPO": { code: "OPO", name: "Porto Airport", city: "Porto", country: "Portugal", countryCode: "PT" },
  
  // Switzerland
  "ZUR": { code: "ZUR", name: "Zurich Airport", city: "Zurich", country: "Switzerland", countryCode: "CH" },
  "GVA": { code: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland", countryCode: "CH" },
  "BSL": { code: "BSL", name: "EuroAirport Basel", city: "Basel", country: "Switzerland", countryCode: "CH" },
  
  // Austria
  "VIE": { code: "VIE", name: "Vienna Airport", city: "Vienna", country: "Austria", countryCode: "AT" },
  
  // Scandinavia
  "CPH": { code: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", countryCode: "DK" },
  "ARN": { code: "ARN", name: "Arlanda Airport", city: "Stockholm", country: "Sweden", countryCode: "SE" },
  "OSL": { code: "OSL", name: "Oslo Airport", city: "Oslo", country: "Norway", countryCode: "NO" },
  "HEL": { code: "HEL", name: "Helsinki Airport", city: "Helsinki", country: "Finland", countryCode: "FI" },
  
  // Greece
  "ATH": { code: "ATH", name: "Athens Airport", city: "Athens", country: "Greece", countryCode: "GR" },
  
  // Eastern Europe
  "PRG": { code: "PRG", name: "Prague Airport", city: "Prague", country: "Czech Republic", countryCode: "CZ" },
  "BUD": { code: "BUD", name: "Budapest Airport", city: "Budapest", country: "Hungary", countryCode: "HU" },
  "WAW": { code: "WAW", name: "Warsaw Airport", city: "Warsaw", country: "Poland", countryCode: "PL" },
  
  // Belgium
  "BRU": { code: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", countryCode: "BE" },
  
  // Luxembourg
  "LUX": { code: "LUX", name: "Luxembourg Airport", city: "Luxembourg", country: "Luxembourg", countryCode: "LU" },
  
  // USA
  "JFK": { code: "JFK", name: "John F. Kennedy Airport", city: "New York", country: "United States", countryCode: "US" },
  "EWR": { code: "EWR", name: "Newark Airport", city: "New York", country: "United States", countryCode: "US" },
  "LGA": { code: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States", countryCode: "US" },
  "LAX": { code: "LAX", name: "Los Angeles Airport", city: "Los Angeles", country: "United States", countryCode: "US" },
  "SFO": { code: "SFO", name: "San Francisco Airport", city: "San Francisco", country: "United States", countryCode: "US" },
  "ORD": { code: "ORD", name: "O'Hare Airport", city: "Chicago", country: "United States", countryCode: "US" },
  "MIA": { code: "MIA", name: "Miami Airport", city: "Miami", country: "United States", countryCode: "US" },
  "BOS": { code: "BOS", name: "Logan Airport", city: "Boston", country: "United States", countryCode: "US" },
  "SEA": { code: "SEA", name: "Seattle Airport", city: "Seattle", country: "United States", countryCode: "US" },
  "LAS": { code: "LAS", name: "Las Vegas Airport", city: "Las Vegas", country: "United States", countryCode: "US" },
  "DCA": { code: "DCA", name: "Reagan Airport", city: "Washington DC", country: "United States", countryCode: "US" },
  "PHL": { code: "PHL", name: "Philadelphia Airport", city: "Philadelphia", country: "United States", countryCode: "US" },
  "PHX": { code: "PHX", name: "Phoenix Airport", city: "Phoenix", country: "United States", countryCode: "US" },
  "SAN": { code: "SAN", name: "San Diego Airport", city: "San Diego", country: "United States", countryCode: "US" },
  "DEN": { code: "DEN", name: "Denver Airport", city: "Denver", country: "United States", countryCode: "US" },
  "AUS": { code: "AUS", name: "Austin Airport", city: "Austin", country: "United States", countryCode: "US" },
  "ATL": { code: "ATL", name: "Atlanta Airport", city: "Atlanta", country: "United States", countryCode: "US" },
  "DFW": { code: "DFW", name: "Dallas Airport", city: "Dallas", country: "United States", countryCode: "US" },
  "IAH": { code: "IAH", name: "Houston Airport", city: "Houston", country: "United States", countryCode: "US" },
  "MCO": { code: "MCO", name: "Orlando Airport", city: "Orlando", country: "United States", countryCode: "US" },
  "TPA": { code: "TPA", name: "Tampa Airport", city: "Tampa", country: "United States", countryCode: "US" },
  "FLL": { code: "FLL", name: "Fort Lauderdale Airport", city: "Fort Lauderdale", country: "United States", countryCode: "US" },
  "SJC": { code: "SJC", name: "San Jose Airport", city: "San Jose", country: "United States", countryCode: "US" },
  "OAK": { code: "OAK", name: "Oakland Airport", city: "Oakland", country: "United States", countryCode: "US" },
  "BUR": { code: "BUR", name: "Burbank Airport", city: "Burbank", country: "United States", countryCode: "US" },
  "LGB": { code: "LGB", name: "Long Beach Airport", city: "Long Beach", country: "United States", countryCode: "US" },
  
  // Middle East
  "DXB": { code: "DXB", name: "Dubai Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE" },
  "AUH": { code: "AUH", name: "Abu Dhabi Airport", city: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE" },
  "DWC": { code: "DWC", name: "Al Maktoum Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE" },
  "DOH": { code: "DOH", name: "Hamad Airport", city: "Doha", country: "Qatar", countryCode: "QA" },
  "RUH": { code: "RUH", name: "King Khalid Airport", city: "Riyadh", country: "Saudi Arabia", countryCode: "SA" },
  "JED": { code: "JED", name: "King Abdulaziz Airport", city: "Jeddah", country: "Saudi Arabia", countryCode: "SA" },
  "KWI": { code: "KWI", name: "Kuwait Airport", city: "Kuwait City", country: "Kuwait", countryCode: "KW" },
  "MCT": { code: "MCT", name: "Muscat Airport", city: "Muscat", country: "Oman", countryCode: "OM" },
  "BAH": { code: "BAH", name: "Bahrain Airport", city: "Manama", country: "Bahrain", countryCode: "BH" },
  "AMM": { code: "AMM", name: "Queen Alia Airport", city: "Amman", country: "Jordan", countryCode: "JO" },
  "BEY": { code: "BEY", name: "Beirut Airport", city: "Beirut", country: "Lebanon", countryCode: "LB" },
  "TLV": { code: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel", countryCode: "IL" },
  "IST": { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", countryCode: "TR" },
  
  // Asia
  "SIN": { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore", countryCode: "SG" },
  "BKK": { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", countryCode: "TH" },
  "HKT": { code: "HKT", name: "Phuket Airport", city: "Phuket", country: "Thailand", countryCode: "TH" },
  "CNX": { code: "CNX", name: "Chiang Mai Airport", city: "Chiang Mai", country: "Thailand", countryCode: "TH" },
  "HKG": { code: "HKG", name: "Hong Kong Airport", city: "Hong Kong", country: "Hong Kong", countryCode: "HK" },
  "NRT": { code: "NRT", name: "Narita Airport", city: "Tokyo", country: "Japan", countryCode: "JP" },
  "HND": { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan", countryCode: "JP" },
  "ICN": { code: "ICN", name: "Incheon Airport", city: "Seoul", country: "South Korea", countryCode: "KR" },
  "KUL": { code: "KUL", name: "Kuala Lumpur Airport", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY" },
  "CGK": { code: "CGK", name: "Soekarno-Hatta Airport", city: "Jakarta", country: "Indonesia", countryCode: "ID" },
  "DPS": { code: "DPS", name: "Ngurah Rai Airport", city: "Bali", country: "Indonesia", countryCode: "ID" },
  "MNL": { code: "MNL", name: "Ninoy Aquino Airport", city: "Manila", country: "Philippines", countryCode: "PH" },
  "SGN": { code: "SGN", name: "Tan Son Nhat Airport", city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN" },
  "HAN": { code: "HAN", name: "Noi Bai Airport", city: "Hanoi", country: "Vietnam", countryCode: "VN" },
  "TPE": { code: "TPE", name: "Taoyuan Airport", city: "Taipei", country: "Taiwan", countryCode: "TW" },
  "PVG": { code: "PVG", name: "Pudong Airport", city: "Shanghai", country: "China", countryCode: "CN" },
  "PEK": { code: "PEK", name: "Capital Airport", city: "Beijing", country: "China", countryCode: "CN" },
  "MFM": { code: "MFM", name: "Macau Airport", city: "Macau", country: "Macau", countryCode: "MO" },
  "SZX": { code: "SZX", name: "Bao'an Airport", city: "Shenzhen", country: "China", countryCode: "CN" },
  "JHB": { code: "JHB", name: "Senai Airport", city: "Johor Bahru", country: "Malaysia", countryCode: "MY" },
  "SHJ": { code: "SHJ", name: "Sharjah Airport", city: "Sharjah", country: "United Arab Emirates", countryCode: "AE" },
  "DMK": { code: "DMK", name: "Don Mueang Airport", city: "Bangkok", country: "Thailand", countryCode: "TH" },
  
  // India
  "DEL": { code: "DEL", name: "Indira Gandhi Airport", city: "Delhi", country: "India", countryCode: "IN" },
  "BOM": { code: "BOM", name: "Chhatrapati Shivaji Airport", city: "Mumbai", country: "India", countryCode: "IN" },
  "MAA": { code: "MAA", name: "Chennai Airport", city: "Chennai", country: "India", countryCode: "IN" },
  "BLR": { code: "BLR", name: "Kempegowda Airport", city: "Bangalore", country: "India", countryCode: "IN" },
  "HYD": { code: "HYD", name: "Rajiv Gandhi Airport", city: "Hyderabad", country: "India", countryCode: "IN" },
  "CCU": { code: "CCU", name: "Netaji Subhas Airport", city: "Kolkata", country: "India", countryCode: "IN" },
  "CMB": { code: "CMB", name: "Bandaranaike Airport", city: "Colombo", country: "Sri Lanka", countryCode: "LK" },
  "MLE": { code: "MLE", name: "Velana Airport", city: "Malé", country: "Maldives", countryCode: "MV" },
  "KTM": { code: "KTM", name: "Tribhuvan Airport", city: "Kathmandu", country: "Nepal", countryCode: "NP" },
  
  // Australia/NZ
  "SYD": { code: "SYD", name: "Kingsford Smith Airport", city: "Sydney", country: "Australia", countryCode: "AU" },
  "MEL": { code: "MEL", name: "Tullamarine Airport", city: "Melbourne", country: "Australia", countryCode: "AU" },
  "BNE": { code: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", countryCode: "AU" },
  "PER": { code: "PER", name: "Perth Airport", city: "Perth", country: "Australia", countryCode: "AU" },
  "ADL": { code: "ADL", name: "Adelaide Airport", city: "Adelaide", country: "Australia", countryCode: "AU" },
  "AKL": { code: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", countryCode: "NZ" },
  "WLG": { code: "WLG", name: "Wellington Airport", city: "Wellington", country: "New Zealand", countryCode: "NZ" },
  "CHC": { code: "CHC", name: "Christchurch Airport", city: "Christchurch", country: "New Zealand", countryCode: "NZ" },
  
  // Africa
  "CAI": { code: "CAI", name: "Cairo Airport", city: "Cairo", country: "Egypt", countryCode: "EG" },
  "CMN": { code: "CMN", name: "Mohammed V Airport", city: "Casablanca", country: "Morocco", countryCode: "MA" },
  "RAK": { code: "RAK", name: "Marrakesh Airport", city: "Marrakesh", country: "Morocco", countryCode: "MA" },
  "TUN": { code: "TUN", name: "Tunis Airport", city: "Tunis", country: "Tunisia", countryCode: "TN" },
  "ALG": { code: "ALG", name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria", countryCode: "DZ" },
  "JNB": { code: "JNB", name: "O.R. Tambo Airport", city: "Johannesburg", country: "South Africa", countryCode: "ZA" },
  "CPT": { code: "CPT", name: "Cape Town Airport", city: "Cape Town", country: "South Africa", countryCode: "ZA" },
  "NBO": { code: "NBO", name: "Jomo Kenyatta Airport", city: "Nairobi", country: "Kenya", countryCode: "KE" },
  "ADD": { code: "ADD", name: "Bole Airport", city: "Addis Ababa", country: "Ethiopia", countryCode: "ET" },
  "LOS": { code: "LOS", name: "Murtala Muhammed Airport", city: "Lagos", country: "Nigeria", countryCode: "NG" },
  "ACC": { code: "ACC", name: "Kotoka Airport", city: "Accra", country: "Ghana", countryCode: "GH" },
  
  // South America
  "GRU": { code: "GRU", name: "Guarulhos Airport", city: "São Paulo", country: "Brazil", countryCode: "BR" },
  "GIG": { code: "GIG", name: "Galeão Airport", city: "Rio de Janeiro", country: "Brazil", countryCode: "BR" },
  "EZE": { code: "EZE", name: "Ministro Pistarini Airport", city: "Buenos Aires", country: "Argentina", countryCode: "AR" },
  "SCL": { code: "SCL", name: "Arturo Merino Airport", city: "Santiago", country: "Chile", countryCode: "CL" },
  "LIM": { code: "LIM", name: "Jorge Chávez Airport", city: "Lima", country: "Peru", countryCode: "PE" },
  "BOG": { code: "BOG", name: "El Dorado Airport", city: "Bogotá", country: "Colombia", countryCode: "CO" },
  "CTG": { code: "CTG", name: "Rafael Núñez Airport", city: "Cartagena", country: "Colombia", countryCode: "CO" },
  "MDE": { code: "MDE", name: "José María Córdova Airport", city: "Medellín", country: "Colombia", countryCode: "CO" },
  "UIO": { code: "UIO", name: "Mariscal Sucre Airport", city: "Quito", country: "Ecuador", countryCode: "EC" },
  "LPB": { code: "LPB", name: "El Alto Airport", city: "La Paz", country: "Bolivia", countryCode: "BO" },
  "CUZ": { code: "CUZ", name: "Alejandro Velasco Airport", city: "Cusco", country: "Peru", countryCode: "PE" },
  
  // Canada
  "YYZ": { code: "YYZ", name: "Pearson Airport", city: "Toronto", country: "Canada", countryCode: "CA" },
  "YVR": { code: "YVR", name: "Vancouver Airport", city: "Vancouver", country: "Canada", countryCode: "CA" },
  "YUL": { code: "YUL", name: "Trudeau Airport", city: "Montreal", country: "Canada", countryCode: "CA" },
  "YYC": { code: "YYC", name: "Calgary Airport", city: "Calgary", country: "Canada", countryCode: "CA" },
  "YOW": { code: "YOW", name: "Macdonald-Cartier Airport", city: "Ottawa", country: "Canada", countryCode: "CA" },
  "YEG": { code: "YEG", name: "Edmonton Airport", city: "Edmonton", country: "Canada", countryCode: "CA" },
  "YWG": { code: "YWG", name: "Winnipeg Airport", city: "Winnipeg", country: "Canada", countryCode: "CA" },
  "YHZ": { code: "YHZ", name: "Stanfield Airport", city: "Halifax", country: "Canada", countryCode: "CA" },
  "YTZ": { code: "YTZ", name: "Billy Bishop Airport", city: "Toronto", country: "Canada", countryCode: "CA" },
  "YXX": { code: "YXX", name: "Abbotsford Airport", city: "Abbotsford", country: "Canada", countryCode: "CA" },
  
  // Mexico/Caribbean
  "MEX": { code: "MEX", name: "Benito Juárez Airport", city: "Mexico City", country: "Mexico", countryCode: "MX" },
  "CUN": { code: "CUN", name: "Cancún Airport", city: "Cancún", country: "Mexico", countryCode: "MX" },
  "PVR": { code: "PVR", name: "Puerto Vallarta Airport", city: "Puerto Vallarta", country: "Mexico", countryCode: "MX" },
  "SJD": { code: "SJD", name: "Los Cabos Airport", city: "San José del Cabo", country: "Mexico", countryCode: "MX" },
  "MBJ": { code: "MBJ", name: "Sangster Airport", city: "Montego Bay", country: "Jamaica", countryCode: "JM" },
  "BGI": { code: "BGI", name: "Grantley Adams Airport", city: "Bridgetown", country: "Barbados", countryCode: "BB" },
  "NAS": { code: "NAS", name: "Lynden Pindling Airport", city: "Nassau", country: "Bahamas", countryCode: "BS" },
  "BDA": { code: "BDA", name: "L.F. Wade Airport", city: "Hamilton", country: "Bermuda", countryCode: "BM" },
};

/**
 * Get airport details by IATA code
 */
export function getAirport(code: string): Airport | null {
  return AIRPORTS[code.toUpperCase()] || null;
}

/**
 * Get airport display name
 */
export function getAirportDisplay(code: string): string {
  const airport = getAirport(code);
  if (!airport) return code;
  return `${airport.name} (${code})`;
}

/**
 * Get airport with city and country
 */
export function getAirportFull(code: string): { code: string; name: string; city: string; country: string } {
  const airport = getAirport(code);
  if (!airport) return { code, name: code, city: code, country: "" };
  return {
    code: airport.code,
    name: airport.name,
    city: airport.city,
    country: airport.country,
  };
}

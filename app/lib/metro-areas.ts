// Metro Aggregation Engine
// Enables city-level search by grouping airports by metro area

export interface MetroArea {
  code: string;           // Metro code (e.g., "LON")
  name: string;           // Display name (e.g., "London")
  country: string;
  countryCode: string;
  timezone: string;       // IANA timezone
  latitude: number;       // City center lat
  longitude: number;      // City center lng
  airports: string[];     // IATA codes of all airports in metro
  aliases: string[];      // Alternative names for search matching
}

// Global metro areas with all airports
export const METRO_AREAS: Record<string, MetroArea> = {
  // Europe
  "LON": {
    code: "LON",
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    timezone: "Europe/London",
    latitude: 51.5074,
    longitude: -0.1278,
    airports: ["LHR", "LGW", "STN", "LTN", "LCY", "SEN"],
    aliases: ["London", "Greater London", "LON", "UK London"]
  },
  "PAR": {
    code: "PAR",
    name: "Paris",
    country: "France",
    countryCode: "FR",
    timezone: "Europe/Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    airports: ["CDG", "ORY", "BVA"],
    aliases: ["Paris", "Greater Paris", "PAR", "France Paris"]
  },
  "BER": {
    code: "BER",
    name: "Berlin",
    country: "Germany",
    countryCode: "DE",
    timezone: "Europe/Berlin",
    latitude: 52.5200,
    longitude: 13.4050,
    airports: ["BER", "SXF"],
    aliases: ["Berlin", "Greater Berlin", "BER"]
  },
  "ROM": {
    code: "ROM",
    name: "Rome",
    country: "Italy",
    countryCode: "IT",
    timezone: "Europe/Rome",
    latitude: 41.9028,
    longitude: 12.4964,
    airports: ["FCO", "CIA"],
    aliases: ["Rome", "Roma", "Greater Rome", "ROM"]
  },
  "MIL": {
    code: "MIL",
    name: "Milan",
    country: "Italy",
    countryCode: "IT",
    timezone: "Europe/Rome",
    latitude: 45.4642,
    longitude: 9.1900,
    airports: ["MXP", "LIN", "BGY"],
    aliases: ["Milan", "Milano", "Greater Milan", "MIL"]
  },
  "MAD": {
    code: "MAD",
    name: "Madrid",
    country: "Spain",
    countryCode: "ES",
    timezone: "Europe/Madrid",
    latitude: 40.4168,
    longitude: -3.7038,
    airports: ["MAD"],
    aliases: ["Madrid", "Greater Madrid", "MAD"]
  },
  "BCN": {
    code: "BCN",
    name: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    timezone: "Europe/Madrid",
    latitude: 41.3851,
    longitude: 2.1734,
    airports: ["BCN"],
    aliases: ["Barcelona", "Greater Barcelona", "BCN"]
  },
  "AMS": {
    code: "AMS",
    name: "Amsterdam",
    country: "Netherlands",
    countryCode: "NL",
    timezone: "Europe/Amsterdam",
    latitude: 52.3676,
    longitude: 4.9041,
    airports: ["AMS", "RTM", "EIN"],
    aliases: ["Amsterdam", "Greater Amsterdam", "AMS"]
  },
  "FRA": {
    code: "FRA",
    name: "Frankfurt",
    country: "Germany",
    countryCode: "DE",
    timezone: "Europe/Berlin",
    latitude: 50.1109,
    longitude: 8.6821,
    airports: ["FRA", "HHN"],
    aliases: ["Frankfurt", "Frankfurt am Main", "FRA"]
  },
  "MUC": {
    code: "MUC",
    name: "Munich",
    country: "Germany",
    countryCode: "DE",
    timezone: "Europe/Berlin",
    latitude: 48.1351,
    longitude: 11.5820,
    airports: ["MUC"],
    aliases: ["Munich", "München", "MUC"]
  },
  "ZUR": {
    code: "ZUR",
    name: "Zurich",
    country: "Switzerland",
    countryCode: "CH",
    timezone: "Europe/Zurich",
    latitude: 47.3769,
    longitude: 8.5417,
    airports: ["ZRH"],
    aliases: ["Zurich", "Zürich", "ZUR"]
  },
  "VIE": {
    code: "VIE",
    name: "Vienna",
    country: "Austria",
    countryCode: "AT",
    timezone: "Europe/Vienna",
    latitude: 48.2082,
    longitude: 16.3738,
    airports: ["VIE"],
    aliases: ["Vienna", "Wien", "VIE"]
  },
  "CPH": {
    code: "CPH",
    name: "Copenhagen",
    country: "Denmark",
    countryCode: "DK",
    timezone: "Europe/Copenhagen",
    latitude: 55.6761,
    longitude: 12.5683,
    airports: ["CPH"],
    aliases: ["Copenhagen", "København", "CPH"]
  },
  "ARN": {
    code: "ARN",
    name: "Stockholm",
    country: "Sweden",
    countryCode: "SE",
    timezone: "Europe/Stockholm",
    latitude: 59.3293,
    longitude: 18.0686,
    airports: ["ARN"],
    aliases: ["Stockholm", "ARN"]
  },
  "OSL": {
    code: "OSL",
    name: "Oslo",
    country: "Norway",
    countryCode: "NO",
    timezone: "Europe/Oslo",
    latitude: 59.9139,
    longitude: 10.7522,
    airports: ["OSL"],
    aliases: ["Oslo", "OSL"]
  },
  "HEL": {
    code: "HEL",
    name: "Helsinki",
    country: "Finland",
    countryCode: "FI",
    timezone: "Europe/Helsinki",
    latitude: 60.1699,
    longitude: 24.9384,
    airports: ["HEL"],
    aliases: ["Helsinki", "HEL"]
  },
  "DUB": {
    code: "DUB",
    name: "Dublin",
    country: "Ireland",
    countryCode: "IE",
    timezone: "Europe/Dublin",
    latitude: 53.3498,
    longitude: -6.2603,
    airports: ["DUB"],
    aliases: ["Dublin", "DUB"]
  },
  "LIS": {
    code: "LIS",
    name: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    timezone: "Europe/Lisbon",
    latitude: 38.7223,
    longitude: -9.1393,
    airports: ["LIS"],
    aliases: ["Lisbon", "Lisboa", "LIS"]
  },
  "ATH": {
    code: "ATH",
    name: "Athens",
    country: "Greece",
    countryCode: "GR",
    timezone: "Europe/Athens",
    latitude: 37.9838,
    longitude: 23.7275,
    airports: ["ATH"],
    aliases: ["Athens", "Athina", "ATH"]
  },
  "PRG": {
    code: "PRG",
    name: "Prague",
    country: "Czech Republic",
    countryCode: "CZ",
    timezone: "Europe/Prague",
    latitude: 50.0755,
    longitude: 14.4378,
    airports: ["PRG"],
    aliases: ["Prague", "Praha", "PRG"]
  },
  "BUD": {
    code: "BUD",
    name: "Budapest",
    country: "Hungary",
    countryCode: "HU",
    timezone: "Europe/Budapest",
    latitude: 47.4979,
    longitude: 19.0402,
    airports: ["BUD"],
    aliases: ["Budapest", "BUD"]
  },
  "WAW": {
    code: "WAW",
    name: "Warsaw",
    country: "Poland",
    countryCode: "PL",
    timezone: "Europe/Warsaw",
    latitude: 52.2297,
    longitude: 21.0122,
    airports: ["WAW"],
    aliases: ["Warsaw", "Warszawa", "WAW"]
  },
  "IST": {
    code: "IST",
    name: "Istanbul",
    country: "Turkey",
    countryCode: "TR",
    timezone: "Europe/Istanbul",
    latitude: 41.0082,
    longitude: 28.9784,
    airports: ["IST", "SAW"],
    aliases: ["Istanbul", "IST", "Constantinople"]
  },

  // USA
  "NYC": {
    code: "NYC",
    name: "New York",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    latitude: 40.7128,
    longitude: -74.0060,
    airports: ["JFK", "LGA", "EWR"],
    aliases: ["New York", "NYC", "New York City", "Big Apple", "Manhattan"]
  },
  "LAX": {
    code: "LAX",
    name: "Los Angeles",
    country: "United States",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    latitude: 34.0522,
    longitude: -118.2437,
    airports: ["LAX", "BUR", "LGB", "SNA"],
    aliases: ["Los Angeles", "LA", "LAX", "Hollywood"]
  },
  "CHI": {
    code: "CHI",
    name: "Chicago",
    country: "United States",
    countryCode: "US",
    timezone: "America/Chicago",
    latitude: 41.8781,
    longitude: -87.6298,
    airports: ["ORD", "MDW"],
    aliases: ["Chicago", "CHI", "Windy City"]
  },
  "WAS": {
    code: "WAS",
    name: "Washington DC",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    latitude: 38.9072,
    longitude: -77.0369,
    airports: ["DCA", "IAD", "BWI"],
    aliases: ["Washington DC", "WAS", "DC", "Washington"]
  },
  "SFO": {
    code: "SFO",
    name: "San Francisco",
    country: "United States",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    latitude: 37.7749,
    longitude: -122.4194,
    airports: ["SFO", "OAK", "SJC"],
    aliases: ["San Francisco", "SF", "SFO", "Bay Area"]
  },
  "MIA": {
    code: "MIA",
    name: "Miami",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    latitude: 25.7617,
    longitude: -80.1918,
    airports: ["MIA", "FLL"],
    aliases: ["Miami", "MIA", "South Florida"]
  },
  "DFW": {
    code: "DFW",
    name: "Dallas",
    country: "United States",
    countryCode: "US",
    timezone: "America/Chicago",
    latitude: 32.7767,
    longitude: -96.7970,
    airports: ["DFW", "DAL"],
    aliases: ["Dallas", "DFW", "DFW Metro"]
  },
  "HOU": {
    code: "HOU",
    name: "Houston",
    country: "United States",
    countryCode: "US",
    timezone: "America/Chicago",
    latitude: 29.7604,
    longitude: -95.3698,
    airports: ["IAH", "HOU"],
    aliases: ["Houston", "HOU", "Space City"]
  },
  "SEA": {
    code: "SEA",
    name: "Seattle",
    country: "United States",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    latitude: 47.6062,
    longitude: -122.3321,
    airports: ["SEA"],
    aliases: ["Seattle", "SEA", "Emerald City"]
  },
  "LAS": {
    code: "LAS",
    name: "Las Vegas",
    country: "United States",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    latitude: 36.1699,
    longitude: -115.1398,
    airports: ["LAS"],
    aliases: ["Las Vegas", "LAS", "Vegas"]
  },
  "DEN": {
    code: "DEN",
    name: "Denver",
    country: "United States",
    countryCode: "US",
    timezone: "America/Denver",
    latitude: 39.7392,
    longitude: -104.9903,
    airports: ["DEN"],
    aliases: ["Denver", "DEN", "Mile High City"]
  },
  "ATL": {
    code: "ATL",
    name: "Atlanta",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    latitude: 33.7490,
    longitude: -84.3880,
    airports: ["ATL"],
    aliases: ["Atlanta", "ATL"]
  },
  "BOS": {
    code: "BOS",
    name: "Boston",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    latitude: 42.3601,
    longitude: -71.0589,
    airports: ["BOS"],
    aliases: ["Boston", "BOS", "Beantown"]
  },
  "PHX": {
    code: "PHX",
    name: "Phoenix",
    country: "United States",
    countryCode: "US",
    timezone: "America/Phoenix",
    latitude: 33.4484,
    longitude: -112.0740,
    airports: ["PHX"],
    aliases: ["Phoenix", "PHX"]
  },
  "PHL": {
    code: "PHL",
    name: "Philadelphia",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    latitude: 39.9526,
    longitude: -75.1652,
    airports: ["PHL"],
    aliases: ["Philadelphia", "PHL", "Philly"]
  },
  "SAN": {
    code: "SAN",
    name: "San Diego",
    country: "United States",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    latitude: 32.7157,
    longitude: -117.1611,
    airports: ["SAN"],
    aliases: ["San Diego", "SAN"]
  },
  "TPA": {
    code: "TPA",
    name: "Tampa",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    latitude: 27.9506,
    longitude: -82.4572,
    airports: ["TPA"],
    aliases: ["Tampa", "TPA", "Tampa Bay"]
  },
  "MCO": {
    code: "MCO",
    name: "Orlando",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    latitude: 28.5384,
    longitude: -81.3789,
    airports: ["MCO"],
    aliases: ["Orlando", "MCO", "Disney"]
  },

  // Asia
  "TYO": {
    code: "TYO",
    name: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    timezone: "Asia/Tokyo",
    latitude: 35.6762,
    longitude: 139.6503,
    airports: ["NRT", "HND"],
    aliases: ["Tokyo", "TYO", "Greater Tokyo"]
  },
  "OSA": {
    code: "OSA",
    name: "Osaka",
    country: "Japan",
    countryCode: "JP",
    timezone: "Asia/Tokyo",
    latitude: 34.6937,
    longitude: 135.5023,
    airports: ["KIX", "ITM"],
    aliases: ["Osaka", "OSA", "Kansai"]
  },
  "SEL": {
    code: "SEL",
    name: "Seoul",
    country: "South Korea",
    countryCode: "KR",
    timezone: "Asia/Seoul",
    latitude: 37.5665,
    longitude: 126.9780,
    airports: ["ICN", "GMP"],
    aliases: ["Seoul", "SEL", "Greater Seoul"]
  },
  "BJS": {
    code: "BJS",
    name: "Beijing",
    country: "China",
    countryCode: "CN",
    timezone: "Asia/Shanghai",
    latitude: 39.9042,
    longitude: 116.4074,
    airports: ["PEK", "PKX"],
    aliases: ["Beijing", "BJS", "Peking"]
  },
  "SHA": {
    code: "SHA",
    name: "Shanghai",
    country: "China",
    countryCode: "CN",
    timezone: "Asia/Shanghai",
    latitude: 31.2304,
    longitude: 121.4737,
    airports: ["PVG", "SHA"],
    aliases: ["Shanghai", "SHA"]
  },
  "HKG": {
    code: "HKG",
    name: "Hong Kong",
    country: "Hong Kong",
    countryCode: "HK",
    timezone: "Asia/Hong_Kong",
    latitude: 22.3193,
    longitude: 114.1694,
    airports: ["HKG"],
    aliases: ["Hong Kong", "HKG", "HK"]
  },
  "SIN": {
    code: "SIN",
    name: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    timezone: "Asia/Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
    airports: ["SIN"],
    aliases: ["Singapore", "SIN", "SG"]
  },
  "BKK": {
    code: "BKK",
    name: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    timezone: "Asia/Bangkok",
    latitude: 13.7563,
    longitude: 100.5018,
    airports: ["BKK", "DMK"],
    aliases: ["Bangkok", "BKK", "Krung Thep"]
  },
  "KUL": {
    code: "KUL",
    name: "Kuala Lumpur",
    country: "Malaysia",
    countryCode: "MY",
    timezone: "Asia/Kuala_Lumpur",
    latitude: 3.1390,
    longitude: 101.6869,
    airports: ["KUL"],
    aliases: ["Kuala Lumpur", "KUL", "KL"]
  },
  "CGK": {
    code: "CGK",
    name: "Jakarta",
    country: "Indonesia",
    countryCode: "ID",
    timezone: "Asia/Jakarta",
    latitude: -6.2088,
    longitude: 106.8456,
    airports: ["CGK"],
    aliases: ["Jakarta", "CGK", "JKT"]
  },
  "MNL": {
    code: "MNL",
    name: "Manila",
    country: "Philippines",
    countryCode: "PH",
    timezone: "Asia/Manila",
    latitude: 14.5995,
    longitude: 120.9842,
    airports: ["MNL"],
    aliases: ["Manila", "MNL", "Metro Manila"]
  },
  "TPE": {
    code: "TPE",
    name: "Taipei",
    country: "Taiwan",
    countryCode: "TW",
    timezone: "Asia/Taipei",
    latitude: 25.0330,
    longitude: 121.5654,
    airports: ["TPE"],
    aliases: ["Taipei", "TPE", "Taiwan"]
  },
  "BOM": {
    code: "BOM",
    name: "Mumbai",
    country: "India",
    countryCode: "IN",
    timezone: "Asia/Kolkata",
    latitude: 19.0760,
    longitude: 72.8777,
    airports: ["BOM"],
    aliases: ["Mumbai", "BOM", "Bombay"]
  },
  "DEL": {
    code: "DEL",
    name: "Delhi",
    country: "India",
    countryCode: "IN",
    timezone: "Asia/Kolkata",
    latitude: 28.6139,
    longitude: 77.2090,
    airports: ["DEL"],
    aliases: ["Delhi", "DEL", "New Delhi"]
  },
  "BLR": {
    code: "BLR",
    name: "Bangalore",
    country: "India",
    countryCode: "IN",
    timezone: "Asia/Kolkata",
    latitude: 12.9716,
    longitude: 77.5946,
    airports: ["BLR"],
    aliases: ["Bangalore", "BLR", "Bengaluru"]
  },
  "MAA": {
    code: "MAA",
    name: "Chennai",
    country: "India",
    countryCode: "IN",
    timezone: "Asia/Kolkata",
    latitude: 13.0827,
    longitude: 80.2707,
    airports: ["MAA"],
    aliases: ["Chennai", "MAA", "Madras"]
  },
  "DXB": {
    code: "DXB",
    name: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    timezone: "Asia/Dubai",
    latitude: 25.2048,
    longitude: 55.2708,
    airports: ["DXB", "DWC"],
    aliases: ["Dubai", "DXB", "DXB Metro"]
  },
  "AUH": {
    code: "AUH",
    name: "Abu Dhabi",
    country: "United Arab Emirates",
    countryCode: "AE",
    timezone: "Asia/Dubai",
    latitude: 24.4539,
    longitude: 54.3773,
    airports: ["AUH"],
    aliases: ["Abu Dhabi", "AUH"]
  },
  "DOH": {
    code: "DOH",
    name: "Doha",
    country: "Qatar",
    countryCode: "QA",
    timezone: "Asia/Qatar",
    latitude: 25.2854,
    longitude: 51.5310,
    airports: ["DOH"],
    aliases: ["Doha", "DOH"]
  },
  "RUH": {
    code: "RUH",
    name: "Riyadh",
    country: "Saudi Arabia",
    countryCode: "SA",
    timezone: "Asia/Riyadh",
    latitude: 24.7136,
    longitude: 46.6753,
    airports: ["RUH"],
    aliases: ["Riyadh", "RUH"]
  },
  "JED": {
    code: "JED",
    name: "Jeddah",
    country: "Saudi Arabia",
    countryCode: "SA",
    timezone: "Asia/Riyadh",
    latitude: 21.4858,
    longitude: 39.1925,
    airports: ["JED"],
    aliases: ["Jeddah", "JED"]
  },
  "TLV": {
    code: "TLV",
    name: "Tel Aviv",
    country: "Israel",
    countryCode: "IL",
    timezone: "Asia/Jerusalem",
    latitude: 32.0853,
    longitude: 34.7818,
    airports: ["TLV"],
    aliases: ["Tel Aviv", "TLV", "Yafo"]
  },

  // Middle East / Africa
  "CAI": {
    code: "CAI",
    name: "Cairo",
    country: "Egypt",
    countryCode: "EG",
    timezone: "Africa/Cairo",
    latitude: 30.0444,
    longitude: 31.2357,
    airports: ["CAI"],
    aliases: ["Cairo", "CAI", "Al-Qahira"]
  },
  "JNB": {
    code: "JNB",
    name: "Johannesburg",
    country: "South Africa",
    countryCode: "ZA",
    timezone: "Africa/Johannesburg",
    latitude: -26.2041,
    longitude: 28.0473,
    airports: ["JNB", "HLA"],
    aliases: ["Johannesburg", "JNB", "Joburg", "Jozi"]
  },
  "CPT": {
    code: "CPT",
    name: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    timezone: "Africa/Johannesburg",
    latitude: -33.9249,
    longitude: 18.4241,
    airports: ["CPT"],
    aliases: ["Cape Town", "CPT"]
  },
  "LOS": {
    code: "LOS",
    name: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    timezone: "Africa/Lagos",
    latitude: 6.5244,
    longitude: 3.3792,
    airports: ["LOS"],
    aliases: ["Lagos", "LOS"]
  },
  "NBO": {
    code: "NBO",
    name: "Nairobi",
    country: "Kenya",
    countryCode: "KE",
    timezone: "Africa/Nairobi",
    latitude: -1.2921,
    longitude: 36.8219,
    airports: ["NBO"],
    aliases: ["Nairobi", "NBO"]
  },
  "ADD": {
    code: "ADD",
    name: "Addis Ababa",
    country: "Ethiopia",
    countryCode: "ET",
    timezone: "Africa/Addis_Ababa",
    latitude: 9.1450,
    longitude: 40.4897,
    airports: ["ADD"],
    aliases: ["Addis Ababa", "ADD"]
  },
  "CMN": {
    code: "CMN",
    name: "Casablanca",
    country: "Morocco",
    countryCode: "MA",
    timezone: "Africa/Casablanca",
    latitude: 33.5731,
    longitude: -7.5898,
    airports: ["CMN"],
    aliases: ["Casablanca", "CMN"]
  },

  // Oceania
  "SYD": {
    code: "SYD",
    name: "Sydney",
    country: "Australia",
    countryCode: "AU",
    timezone: "Australia/Sydney",
    latitude: -33.8688,
    longitude: 151.2093,
    airports: ["SYD"],
    aliases: ["Sydney", "SYD"]
  },
  "MEL": {
    code: "MEL",
    name: "Melbourne",
    country: "Australia",
    countryCode: "AU",
    timezone: "Australia/Melbourne",
    latitude: -37.8136,
    longitude: 144.9631,
    airports: ["MEL"],
    aliases: ["Melbourne", "MEL"]
  },
  "BNE": {
    code: "BNE",
    name: "Brisbane",
    country: "Australia",
    countryCode: "AU",
    timezone: "Australia/Brisbane",
    latitude: -27.4698,
    longitude: 153.0251,
    airports: ["BNE"],
    aliases: ["Brisbane", "BNE"]
  },
  "PER": {
    code: "PER",
    name: "Perth",
    country: "Australia",
    countryCode: "AU",
    timezone: "Australia/Perth",
    latitude: -31.9505,
    longitude: 115.8605,
    airports: ["PER"],
    aliases: ["Perth", "PER"]
  },
  "AKL": {
    code: "AKL",
    name: "Auckland",
    country: "New Zealand",
    countryCode: "NZ",
    timezone: "Pacific/Auckland",
    latitude: -36.8485,
    longitude: 174.7633,
    airports: ["AKL"],
    aliases: ["Auckland", "AKL"]
  },

  // Canada
  "YTO": {
    code: "YTO",
    name: "Toronto",
    country: "Canada",
    countryCode: "CA",
    timezone: "America/Toronto",
    latitude: 43.6532,
    longitude: -79.3832,
    airports: ["YYZ", "YTZ"],
    aliases: ["Toronto", "YTO", "YYZ", "The 6ix"]
  },
  "YVR": {
    code: "YVR",
    name: "Vancouver",
    country: "Canada",
    countryCode: "CA",
    timezone: "America/Vancouver",
    latitude: 49.2827,
    longitude: -123.1207,
    airports: ["YVR"],
    aliases: ["Vancouver", "YVR"]
  },
  "YUL": {
    code: "YUL",
    name: "Montreal",
    country: "Canada",
    countryCode: "CA",
    timezone: "America/Toronto",
    latitude: 45.5017,
    longitude: -73.5673,
    airports: ["YUL"],
    aliases: ["Montreal", "YUL", "Montréal"]
  },
  "YYC": {
    code: "YYC",
    name: "Calgary",
    country: "Canada",
    countryCode: "CA",
    timezone: "America/Edmonton",
    latitude: 51.0447,
    longitude: -114.0719,
    airports: ["YYC"],
    aliases: ["Calgary", "YYC"]
  },

  // Latin America
  "MEX": {
    code: "MEX",
    name: "Mexico City",
    country: "Mexico",
    countryCode: "MX",
    timezone: "America/Mexico_City",
    latitude: 19.4326,
    longitude: -99.1332,
    airports: ["MEX"],
    aliases: ["Mexico City", "MEX", "CDMX"]
  },
  "CUN": {
    code: "CUN",
    name: "Cancun",
    country: "Mexico",
    countryCode: "MX",
    timezone: "America/Cancun",
    latitude: 21.1619,
    longitude: -86.8515,
    airports: ["CUN"],
    aliases: ["Cancun", "CUN", "Cancún"]
  },
  "GRU": {
    code: "GRU",
    name: "São Paulo",
    country: "Brazil",
    countryCode: "BR",
    timezone: "America/Sao_Paulo",
    latitude: -23.5505,
    longitude: -46.6333,
    airports: ["GRU", "CGH"],
    aliases: ["São Paulo", "GRU", "Sao Paulo"]
  },
  "GIG": {
    code: "GIG",
    name: "Rio de Janeiro",
    country: "Brazil",
    countryCode: "BR",
    timezone: "America/Sao_Paulo",
    latitude: -22.9068,
    longitude: -43.1729,
    airports: ["GIG", "SDU"],
    aliases: ["Rio de Janeiro", "GIG", "Rio"]
  },
  "EZE": {
    code: "EZE",
    name: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    timezone: "America/Argentina/Buenos_Aires",
    latitude: -34.6037,
    longitude: -58.3816,
    airports: ["EZE", "AEP"],
    aliases: ["Buenos Aires", "EZE", "B Aires"]
  },
  "SCL": {
    code: "SCL",
    name: "Santiago",
    country: "Chile",
    countryCode: "CL",
    timezone: "America/Santiago",
    latitude: -33.4489,
    longitude: -70.6693,
    airports: ["SCL"],
    aliases: ["Santiago", "SCL", "Santiago de Chile"]
  },
  "LIM": {
    code: "LIM",
    name: "Lima",
    country: "Peru",
    countryCode: "PE",
    timezone: "America/Lima",
    latitude: -12.0464,
    longitude: -77.0428,
    airports: ["LIM"],
    aliases: ["Lima", "LIM"]
  },
  "BOG": {
    code: "BOG",
    name: "Bogotá",
    country: "Colombia",
    countryCode: "CO",
    timezone: "America/Bogota",
    latitude: 4.7110,
    longitude: -74.0721,
    airports: ["BOG"],
    aliases: ["Bogotá", "BOG", "Bogota"]
  },
};

/**
 * Get metro area by code
 */
export function getMetroArea(code: string): MetroArea | null {
  return METRO_AREAS[code.toUpperCase()] || null;
}

/**
 * Search for metro area by name or alias
 */
export function findMetroByName(query: string): MetroArea | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  for (const metro of Object.values(METRO_AREAS)) {
    // Check exact code match
    if (metro.code.toLowerCase() === normalizedQuery) {
      return metro;
    }
    
    // Check name match
    if (metro.name.toLowerCase() === normalizedQuery) {
      return metro;
    }
    
    // Check aliases
    for (const alias of metro.aliases) {
      if (alias.toLowerCase() === normalizedQuery) {
        return metro;
      }
    }
  }
  
  return null;
}

/**
 * Expand search query to airports
 * Returns metro info if query matches a city, or single airport
 */
export function expandSearchQuery(query: string): {
  isMetro: boolean;
  metroCode?: string;
  airports: string[];
  displayName: string;
} {
  // First check if it's a metro area
  const metro = findMetroByName(query);
  if (metro) {
    return {
      isMetro: true,
      metroCode: metro.code,
      airports: metro.airports,
      displayName: `${metro.name} (All Airports)`
    };
  }
  
  // Otherwise treat as single airport code
  return {
    isMetro: false,
    airports: [query.toUpperCase()],
    displayName: query.toUpperCase()
  };
}

/**
 * Get all metro areas for a country
 */
export function getMetrosByCountry(countryCode: string): MetroArea[] {
  return Object.values(METRO_AREAS).filter(
    metro => metro.countryCode === countryCode.toUpperCase()
  );
}

/**
 * Get all metro codes
 */
export function getAllMetroCodes(): string[] {
  return Object.keys(METRO_AREAS);
}

/**
 * Check if a code is a metro area
 */
export function isMetroCode(code: string): boolean {
  return code.toUpperCase() in METRO_AREAS;
}

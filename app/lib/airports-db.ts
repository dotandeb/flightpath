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
  "LCY": { code: "LCY", name: "London City Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
  "SEN": { code: "SEN", name: "Southend Airport", city: "London", country: "United Kingdom", countryCode: "GB" },
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
  
  // Spain
  "MAD": { code: "MAD", name: "Adolfo Suárez Airport", city: "Madrid", country: "Spain", countryCode: "ES" },
  "BCN": { code: "BCN", name: "Barcelona Airport", city: "Barcelona", country: "Spain", countryCode: "ES" },
  "AGP": { code: "AGP", name: "Málaga Airport", city: "Málaga", country: "Spain", countryCode: "ES" },
  "SVQ": { code: "SVQ", name: "Seville Airport", city: "Seville", country: "Spain", countryCode: "ES" },
  "VLC": { code: "VLC", name: "Valencia Airport", city: "Valencia", country: "Spain", countryCode: "ES" },
  "PMI": { code: "PMI", name: "Palma de Mallorca Airport", city: "Palma", country: "Spain", countryCode: "ES" },
  "IBZ": { code: "IBZ", name: "Ibiza Airport", city: "Ibiza", country: "Spain", countryCode: "ES" },
  "TFS": { code: "TFS", name: "Tenerife South Airport", city: "Tenerife", country: "Spain", countryCode: "ES" },
  "LPA": { code: "LPA", name: "Gran Canaria Airport", city: "Gran Canaria", country: "Spain", countryCode: "ES" },
  "ALC": { code: "ALC", name: "Alicante Airport", city: "Alicante", country: "Spain", countryCode: "ES" },
  
  // Italy
  "FCO": { code: "FCO", name: "Leonardo da Vinci Airport", city: "Rome", country: "Italy", countryCode: "IT" },
  "CIA": { code: "CIA", name: "Ciampino Airport", city: "Rome", country: "Italy", countryCode: "IT" },
  "MXP": { code: "MXP", name: "Malpensa Airport", city: "Milan", country: "Italy", countryCode: "IT" },
  "LIN": { code: "LIN", name: "Linate Airport", city: "Milan", country: "Italy", countryCode: "IT" },
  "BGY": { code: "BGY", name: "Orio al Serio Airport", city: "Milan", country: "Italy", countryCode: "IT" },
  "VCE": { code: "VCE", name: "Marco Polo Airport", city: "Venice", country: "Italy", countryCode: "IT" },
  "NAP": { code: "NAP", name: "Naples Airport", city: "Naples", country: "Italy", countryCode: "IT" },
  "BLQ": { code: "BLQ", name: "Bologna Airport", city: "Bologna", country: "Italy", countryCode: "IT" },
  "PSA": { code: "PSA", name: "Pisa Airport", city: "Pisa", country: "Italy", countryCode: "IT" },
  "CTA": { code: "CTA", name: "Catania Airport", city: "Catania", country: "Italy", countryCode: "IT" },
  "PMO": { code: "PMO", name: "Palermo Airport", city: "Palermo", country: "Italy", countryCode: "IT" },
  "CAG": { code: "CAG", name: "Cagliari Airport", city: "Cagliari", country: "Italy", countryCode: "IT" },
  
  // Switzerland
  "ZRH": { code: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", countryCode: "CH" },
  "GVA": { code: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland", countryCode: "CH" },
  "BSL": { code: "BSL", name: "EuroAirport Basel", city: "Basel", country: "Switzerland", countryCode: "CH" },
  
  // Austria
  "VIE": { code: "VIE", name: "Vienna Airport", city: "Vienna", country: "Austria", countryCode: "AT" },
  "SZG": { code: "SZG", name: "Salzburg Airport", city: "Salzburg", country: "Austria", countryCode: "AT" },
  "INN": { code: "INN", name: "Innsbruck Airport", city: "Innsbruck", country: "Austria", countryCode: "AT" },
  
  // Belgium
  "BRU": { code: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", countryCode: "BE" },
  "CRL": { code: "CRL", name: "Charleroi Airport", city: "Brussels", country: "Belgium", countryCode: "BE" },
  
  // Portugal
  "LIS": { code: "LIS", name: "Humberto Delgado Airport", city: "Lisbon", country: "Portugal", countryCode: "PT" },
  "OPO": { code: "OPO", name: "Porto Airport", city: "Porto", country: "Portugal", countryCode: "PT" },
  "FAO": { code: "FAO", name: "Faro Airport", city: "Faro", country: "Portugal", countryCode: "PT" },
  
  // Scandinavia
  "CPH": { code: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", countryCode: "DK" },
  "ARN": { code: "ARN", name: "Arlanda Airport", city: "Stockholm", country: "Sweden", countryCode: "SE" },
  "OSL": { code: "OSL", name: "Gardermoen Airport", city: "Oslo", country: "Norway", countryCode: "NO" },
  "HEL": { code: "HEL", name: "Helsinki Airport", city: "Helsinki", country: "Finland", countryCode: "FI" },
  
  // Greece
  "ATH": { code: "ATH", name: "Athens Airport", city: "Athens", country: "Greece", countryCode: "GR" },
  "JTR": { code: "JTR", name: "Santorini Airport", city: "Santorini", country: "Greece", countryCode: "GR" },
  "JMK": { code: "JMK", name: "Mykonos Airport", city: "Mykonos", country: "Greece", countryCode: "GR" },
  "HER": { code: "HER", name: "Heraklion Airport", city: "Crete", country: "Greece", countryCode: "GR" },
  "RHO": { code: "RHO", name: "Rhodes Airport", city: "Rhodes", country: "Greece", countryCode: "GR" },
  
  // Eastern Europe
  "PRG": { code: "PRG", name: "Václav Havel Airport", city: "Prague", country: "Czech Republic", countryCode: "CZ" },
  "BUD": { code: "BUD", name: "Budapest Airport", city: "Budapest", country: "Hungary", countryCode: "HU" },
  "WAW": { code: "WAW", name: "Chopin Airport", city: "Warsaw", country: "Poland", countryCode: "PL" },
  "KRK": { code: "KRK", name: "Balice Airport", city: "Krakow", country: "Poland", countryCode: "PL" },
  
  // Middle East
  "DXB": { code: "DXB", name: "Dubai Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE" },
  "DWC": { code: "DWC", name: "Al Maktoum Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE" },
  "AUH": { code: "AUH", name: "Abu Dhabi Airport", city: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE" },
  "DOH": { code: "DOH", name: "Hamad Airport", city: "Doha", country: "Qatar", countryCode: "QA" },
  "JED": { code: "JED", name: "King Abdulaziz Airport", city: "Jeddah", country: "Saudi Arabia", countryCode: "SA" },
  "RUH": { code: "RUH", name: "King Khalid Airport", city: "Riyadh", country: "Saudi Arabia", countryCode: "SA" },
  "MCT": { code: "MCT", name: "Muscat Airport", city: "Muscat", country: "Oman", countryCode: "OM" },
  "BAH": { code: "BAH", name: "Bahrain Airport", city: "Manama", country: "Bahrain", countryCode: "BH" },
  "KWI": { code: "KWI", name: "Kuwait Airport", city: "Kuwait City", country: "Kuwait", countryCode: "KW" },
  
  // Israel/Jordan/Lebanon
  "TLV": { code: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel", countryCode: "IL" },
  "AMM": { code: "AMM", name: "Queen Alia Airport", city: "Amman", country: "Jordan", countryCode: "JO" },
  "BEY": { code: "BEY", name: "Rafic Hariri Airport", city: "Beirut", country: "Lebanon", countryCode: "LB" },
  
  // North Africa
  "CAI": { code: "CAI", name: "Cairo Airport", city: "Cairo", country: "Egypt", countryCode: "EG" },
  "HRG": { code: "HRG", name: "Hurghada Airport", city: "Hurghada", country: "Egypt", countryCode: "EG" },
  "SSH": { code: "SSH", name: "Sharm El Sheikh Airport", city: "Sharm El Sheikh", country: "Egypt", countryCode: "EG" },
  "CMN": { code: "CMN", name: "Mohammed V Airport", city: "Casablanca", country: "Morocco", countryCode: "MA" },
  "RAK": { code: "RAK", name: "Marrakesh Airport", city: "Marrakesh", country: "Morocco", countryCode: "MA" },
  "TUN": { code: "TUN", name: "Carthage Airport", city: "Tunis", country: "Tunisia", countryCode: "TN" },
  "ALG": { code: "ALG", name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria", countryCode: "DZ" },
  
  // Sub-Saharan Africa
  "JNB": { code: "JNB", name: "O.R. Tambo Airport", city: "Johannesburg", country: "South Africa", countryCode: "ZA" },
  "CPT": { code: "CPT", name: "Cape Town Airport", city: "Cape Town", country: "South Africa", countryCode: "ZA" },
  "DUR": { code: "DUR", name: "King Shaka Airport", city: "Durban", country: "South Africa", countryCode: "ZA" },
  "LOS": { code: "LOS", name: "Murtala Muhammed Airport", city: "Lagos", country: "Nigeria", countryCode: "NG" },
  "ADD": { code: "ADD", name: "Bole Airport", city: "Addis Ababa", country: "Ethiopia", countryCode: "ET" },
  "NBO": { code: "NBO", name: "Jomo Kenyatta Airport", city: "Nairobi", country: "Kenya", countryCode: "KE" },
  "DAR": { code: "DAR", name: "Julius Nyerere Airport", city: "Dar es Salaam", country: "Tanzania", countryCode: "TZ" },
  "ACC": { code: "ACC", name: "Kotoka Airport", city: "Accra", country: "Ghana", countryCode: "GH" },
  
  // Asia - Southeast
  "BKK": { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", countryCode: "TH" },
  "DMK": { code: "DMK", name: "Don Mueang Airport", city: "Bangkok", country: "Thailand", countryCode: "TH" },
  "HKT": { code: "HKT", name: "Phuket Airport", city: "Phuket", country: "Thailand", countryCode: "TH" },
  "CNX": { code: "CNX", name: "Chiang Mai Airport", city: "Chiang Mai", country: "Thailand", countryCode: "TH" },
  "SIN": { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore", countryCode: "SG" },
  "KUL": { code: "KUL", name: "Kuala Lumpur Airport", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY" },
  "CGK": { code: "CGK", name: "Soekarno-Hatta Airport", city: "Jakarta", country: "Indonesia", countryCode: "ID" },
  "DPS": { code: "DPS", name: "Ngurah Rai Airport", city: "Bali", country: "Indonesia", countryCode: "ID" },
  "MNL": { code: "MNL", name: "Ninoy Aquino Airport", city: "Manila", country: "Philippines", countryCode: "PH" },
  "CEB": { code: "CEB", name: "Mactan-Cebu Airport", city: "Cebu", country: "Philippines", countryCode: "PH" },
  "HAN": { code: "HAN", name: "Noi Bai Airport", city: "Hanoi", country: "Vietnam", countryCode: "VN" },
  "SGN": { code: "SGN", name: "Tan Son Nhat Airport", city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN" },
  "PNH": { code: "PNH", name: "Phnom Penh Airport", city: "Phnom Penh", country: "Cambodia", countryCode: "KH" },
  "RGN": { code: "RGN", name: "Yangon Airport", city: "Yangon", country: "Myanmar", countryCode: "MM" },
  
  // Asia - East
  "NRT": { code: "NRT", name: "Narita Airport", city: "Tokyo", country: "Japan", countryCode: "JP" },
  "HND": { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan", countryCode: "JP" },
  "KIX": { code: "KIX", name: "Kansai Airport", city: "Osaka", country: "Japan", countryCode: "JP" },
  "ICN": { code: "ICN", name: "Incheon Airport", city: "Seoul", country: "South Korea", countryCode: "KR" },
  "GMP": { code: "GMP", name: "Gimpo Airport", city: "Seoul", country: "South Korea", countryCode: "KR" },
  "TPE": { code: "TPE", name: "Taoyuan Airport", city: "Taipei", country: "Taiwan", countryCode: "TW" },
  "HKG": { code: "HKG", name: "Hong Kong Airport", city: "Hong Kong", country: "Hong Kong", countryCode: "HK" },
  "MFM": { code: "MFM", name: "Macau Airport", city: "Macau", country: "Macau", countryCode: "MO" },
  "PVG": { code: "PVG", name: "Pudong Airport", city: "Shanghai", country: "China", countryCode: "CN" },
  "SHA": { code: "SHA", name: "Hongqiao Airport", city: "Shanghai", country: "China", countryCode: "CN" },
  "PEK": { code: "PEK", name: "Capital Airport", city: "Beijing", country: "China", countryCode: "CN" },
  "PKX": { code: "PKX", name: "Daxing Airport", city: "Beijing", country: "China", countryCode: "CN" },
  "CAN": { code: "CAN", name: "Baiyun Airport", city: "Guangzhou", country: "China", countryCode: "CN" },
  "SZX": { code: "SZX", name: "Bao'an Airport", city: "Shenzhen", country: "China", countryCode: "CN" },
  "CTU": { code: "CTU", name: "Shuangliu Airport", city: "Chengdu", country: "China", countryCode: "CN" },
  "XIY": { code: "XIY", name: "Xianyang Airport", city: "Xi'an", country: "China", countryCode: "CN" },
  "HGH": { code: "HGH", name: "Xiaoshan Airport", city: "Hangzhou", country: "China", countryCode: "CN" },
  "TAO": { code: "TAO", name: "Liuting Airport", city: "Qingdao", country: "China", countryCode: "CN" },
  
  // Asia - South
  "DEL": { code: "DEL", name: "Indira Gandhi Airport", city: "Delhi", country: "India", countryCode: "IN" },
  "BOM": { code: "BOM", name: "Chhatrapati Shivaji Airport", city: "Mumbai", country: "India", countryCode: "IN" },
  "BLR": { code: "BLR", name: "Kempegowda Airport", city: "Bangalore", country: "India", countryCode: "IN" },
  "MAA": { code: "MAA", name: "Chennai Airport", city: "Chennai", country: "India", countryCode: "IN" },
  "HYD": { code: "HYD", name: "Rajiv Gandhi Airport", city: "Hyderabad", country: "India", countryCode: "IN" },
  "CCU": { code: "CCU", name: "Netaji Subhas Airport", city: "Kolkata", country: "India", countryCode: "IN" },
  "CMB": { code: "CMB", name: "Bandaranaike Airport", city: "Colombo", country: "Sri Lanka", countryCode: "LK" },
  "MLE": { code: "MLE", name: "Velana Airport", city: "Malé", country: "Maldives", countryCode: "MV" },
  "KTM": { code: "KTM", name: "Tribhuvan Airport", city: "Kathmandu", country: "Nepal", countryCode: "NP" },
  
  // USA - Northeast
  "JFK": { code: "JFK", name: "John F. Kennedy Airport", city: "New York", country: "United States", countryCode: "US" },
  "LGA": { code: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States", countryCode: "US" },
  "EWR": { code: "EWR", name: "Newark Airport", city: "New York", country: "United States", countryCode: "US" },
  "BOS": { code: "BOS", name: "Logan Airport", city: "Boston", country: "United States", countryCode: "US" },
  "PHL": { code: "PHL", name: "Philadelphia Airport", city: "Philadelphia", country: "United States", countryCode: "US" },
  "DCA": { code: "DCA", name: "Reagan Airport", city: "Washington DC", country: "United States", countryCode: "US" },
  "IAD": { code: "IAD", name: "Dulles Airport", city: "Washington DC", country: "United States", countryCode: "US" },
  "BWI": { code: "BWI", name: "Baltimore Airport", city: "Baltimore", country: "United States", countryCode: "US" },
  
  // USA - Southeast
  "ATL": { code: "ATL", name: "Hartsfield-Jackson Airport", city: "Atlanta", country: "United States", countryCode: "US" },
  "MCO": { code: "MCO", name: "Orlando Airport", city: "Orlando", country: "United States", countryCode: "US" },
  "MIA": { code: "MIA", name: "Miami Airport", city: "Miami", country: "United States", countryCode: "US" },
  "FLL": { code: "FLL", name: "Fort Lauderdale Airport", city: "Fort Lauderdale", country: "United States", countryCode: "US" },
  "TPA": { code: "TPA", name: "Tampa Airport", city: "Tampa", country: "United States", countryCode: "US" },
  "CLT": { code: "CLT", name: "Douglas Airport", city: "Charlotte", country: "United States", countryCode: "US" },
  "RDU": { code: "RDU", name: "Raleigh-Durham Airport", city: "Raleigh", country: "United States", countryCode: "US" },
  "BNA": { code: "BNA", name: "Nashville Airport", city: "Nashville", country: "United States", countryCode: "US" },
  "MSY": { code: "MSY", name: "Louis Armstrong Airport", city: "New Orleans", country: "United States", countryCode: "US" },
  
  // USA - Midwest
  "ORD": { code: "ORD", name: "O'Hare Airport", city: "Chicago", country: "United States", countryCode: "US" },
  "MDW": { code: "MDW", name: "Midway Airport", city: "Chicago", country: "United States", countryCode: "US" },
  "DTW": { code: "DTW", name: "Detroit Airport", city: "Detroit", country: "United States", countryCode: "US" },
  "MSP": { code: "MSP", name: "Minneapolis Airport", city: "Minneapolis", country: "United States", countryCode: "US" },
  "CLE": { code: "CLE", name: "Cleveland Airport", city: "Cleveland", country: "United States", countryCode: "US" },
  "CMH": { code: "CMH", name: "Columbus Airport", city: "Columbus", country: "United States", countryCode: "US" },
  "IND": { code: "IND", name: "Indianapolis Airport", city: "Indianapolis", country: "United States", countryCode: "US" },
  "MKE": { code: "MKE", name: "Milwaukee Airport", city: "Milwaukee", country: "United States", countryCode: "US" },
  
  // USA - West
  "LAX": { code: "LAX", name: "Los Angeles Airport", city: "Los Angeles", country: "United States", countryCode: "US" },
  "BUR": { code: "BUR", name: "Burbank Airport", city: "Los Angeles", country: "United States", countryCode: "US" },
  "LGB": { code: "LGB", name: "Long Beach Airport", city: "Los Angeles", country: "United States", countryCode: "US" },
  "SNA": { code: "SNA", name: "John Wayne Airport", city: "Orange County", country: "United States", countryCode: "US" },
  "SAN": { code: "SAN", name: "San Diego Airport", city: "San Diego", country: "United States", countryCode: "US" },
  "SFO": { code: "SFO", name: "San Francisco Airport", city: "San Francisco", country: "United States", countryCode: "US" },
  "OAK": { code: "OAK", name: "Oakland Airport", city: "San Francisco", country: "United States", countryCode: "US" },
  "SJC": { code: "SJC", name: "San Jose Airport", city: "San Jose", country: "United States", countryCode: "US" },
  "SEA": { code: "SEA", name: "Seattle Airport", city: "Seattle", country: "United States", countryCode: "US" },
  "PDX": { code: "PDX", name: "Portland Airport", city: "Portland", country: "United States", countryCode: "US" },
  "LAS": { code: "LAS", name: "Harry Reid Airport", city: "Las Vegas", country: "United States", countryCode: "US" },
  "PHX": { code: "PHX", name: "Sky Harbor Airport", city: "Phoenix", country: "United States", countryCode: "US" },
  "DEN": { code: "DEN", name: "Denver Airport", city: "Denver", country: "United States", countryCode: "US" },
  "SLC": { code: "SLC", name: "Salt Lake City Airport", city: "Salt Lake City", country: "United States", countryCode: "US" },
  
  // USA - Texas
  "DFW": { code: "DFW", name: "Dallas/Fort Worth Airport", city: "Dallas", country: "United States", countryCode: "US" },
  "DAL": { code: "DAL", name: "Love Field Airport", city: "Dallas", country: "United States", countryCode: "US" },
  "IAH": { code: "IAH", name: "Bush Airport", city: "Houston", country: "United States", countryCode: "US" },
  "HOU": { code: "HOU", name: "Hobby Airport", city: "Houston", country: "United States", countryCode: "US" },
  "AUS": { code: "AUS", name: "Austin Airport", city: "Austin", country: "United States", countryCode: "US" },
  "SAT": { code: "SAT", name: "San Antonio Airport", city: "San Antonio", country: "United States", countryCode: "US" },
  
  // Canada
  "YYZ": { code: "YYZ", name: "Pearson Airport", city: "Toronto", country: "Canada", countryCode: "CA" },
  "YTZ": { code: "YTZ", name: "Billy Bishop Airport", city: "Toronto", country: "Canada", countryCode: "CA" },
  "YVR": { code: "YVR", name: "Vancouver Airport", city: "Vancouver", country: "Canada", countryCode: "CA" },
  "YUL": { code: "YUL", name: "Trudeau Airport", city: "Montreal", country: "Canada", countryCode: "CA" },
  "YYC": { code: "YYC", name: "Calgary Airport", city: "Calgary", country: "Canada", countryCode: "CA" },
  "YOW": { code: "YOW", name: "Ottawa Airport", city: "Ottawa", country: "Canada", countryCode: "CA" },
  "YEG": { code: "YEG", name: "Edmonton Airport", city: "Edmonton", country: "Canada", countryCode: "CA" },
  "YWG": { code: "YWG", name: "Winnipeg Airport", city: "Winnipeg", country: "Canada", countryCode: "CA" },
  "YHZ": { code: "YHZ", name: "Halifax Airport", city: "Halifax", country: "Canada", countryCode: "CA" },
  
  // Mexico/Caribbean
  "MEX": { code: "MEX", name: "Benito Juárez Airport", city: "Mexico City", country: "Mexico", countryCode: "MX" },
  "CUN": { code: "CUN", name: "Cancún Airport", city: "Cancún", country: "Mexico", countryCode: "MX" },
  "PVR": { code: "PVR", name: "Puerto Vallarta Airport", city: "Puerto Vallarta", country: "Mexico", countryCode: "MX" },
  "SJD": { code: "SJD", name: "Los Cabos Airport", city: "San José del Cabo", country: "Mexico", countryCode: "MX" },
  "MBJ": { code: "MBJ", name: "Sangster Airport", city: "Montego Bay", country: "Jamaica", countryCode: "JM" },
  "BGI": { code: "BGI", name: "Grantley Adams Airport", city: "Barbados", country: "Barbados", countryCode: "BB" },
  "NAS": { code: "NAS", name: "Lynden Pindling Airport", city: "Nassau", country: "Bahamas", countryCode: "BS" },
  "BDA": { code: "BDA", name: "L.F. Wade Airport", city: "Hamilton", country: "Bermuda", countryCode: "BM" },
  
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
  
  // Oceania
  "SYD": { code: "SYD", name: "Kingsford Smith Airport", city: "Sydney", country: "Australia", countryCode: "AU" },
  "MEL": { code: "MEL", name: "Tullamarine Airport", city: "Melbourne", country: "Australia", countryCode: "AU" },
  "BNE": { code: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", countryCode: "AU" },
  "PER": { code: "PER", name: "Perth Airport", city: "Perth", country: "Australia", countryCode: "AU" },
  "ADL": { code: "ADL", name: "Adelaide Airport", city: "Adelaide", country: "Australia", countryCode: "AU" },
  "OOL": { code: "OOL", name: "Gold Coast Airport", city: "Gold Coast", country: "Australia", countryCode: "AU" },
  "CNS": { code: "CNS", name: "Cairns Airport", city: "Cairns", country: "Australia", countryCode: "AU" },
  "AKL": { code: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", countryCode: "NZ" },
  "CHC": { code: "CHC", name: "Christchurch Airport", city: "Christchurch", country: "New Zealand", countryCode: "NZ" },
  "WLG": { code: "WLG", name: "Wellington Airport", city: "Wellington", country: "New Zealand", countryCode: "NZ" },
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

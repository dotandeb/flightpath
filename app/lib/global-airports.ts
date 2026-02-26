// Global Airports Database - Major Commercial Airports
// 300+ airports worldwide with IATA codes, coordinates, and timezones

export interface GlobalAirport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  metroArea?: string; // Metro code if part of multi-airport city
}

export const GLOBAL_AIRPORTS: GlobalAirport[] = [
  // United Kingdom
  { iata: "LHR", icao: "EGLL", name: "Heathrow Airport", city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 51.47, longitude: -0.4614, metroArea: "LON" },
  { iata: "LGW", icao: "EGKK", name: "Gatwick Airport", city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 51.1537, longitude: -0.1821, metroArea: "LON" },
  { iata: "STN", icao: "EGSS", name: "Stansted Airport", city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 51.885, longitude: 0.235, metroArea: "LON" },
  { iata: "LTN", icao: "EGGW", name: "Luton Airport", city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 51.8747, longitude: -0.3683, metroArea: "LON" },
  { iata: "LCY", icao: "EGLC", name: "London City Airport", city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 51.5053, longitude: 0.0553, metroArea: "LON" },
  { iata: "SEN", icao: "EGMC", name: "Southend Airport", city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 51.5714, longitude: 0.6956, metroArea: "LON" },
  { iata: "MAN", icao: "EGCC", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 53.3537, longitude: -2.275 },
  { iata: "EDI", icao: "EGPH", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 55.95, longitude: -3.3725 },
  { iata: "BHX", icao: "EGBB", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 52.4539, longitude: -1.7481 },
  { iata: "GLA", icao: "EGPF", name: "Glasgow Airport", city: "Glasgow", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 55.8719, longitude: -4.4331 },
  { iata: "BRS", icao: "EGGD", name: "Bristol Airport", city: "Bristol", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 51.3827, longitude: -2.7191 },
  { iata: "NCL", icao: "EGNT", name: "Newcastle Airport", city: "Newcastle", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 55.0375, longitude: -1.6917 },
  { iata: "LBA", icao: "EGNM", name: "Leeds Bradford Airport", city: "Leeds", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 53.8659, longitude: -1.6606 },
  { iata: "LPL", icao: "EGGP", name: "Liverpool Airport", city: "Liverpool", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 53.3336, longitude: -2.8497 },
  { iata: "DUB", icao: "EIDW", name: "Dublin Airport", city: "Dublin", country: "Ireland", countryCode: "IE", timezone: "Europe/Dublin", latitude: 53.4213, longitude: -6.27 },
  { iata: "BFS", icao: "EGAA", name: "Belfast Airport", city: "Belfast", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 54.6575, longitude: -6.2158 },
  { iata: "ABZ", icao: "EGPD", name: "Aberdeen Airport", city: "Aberdeen", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 57.2019, longitude: -2.1981 },
  
  // France
  { iata: "CDG", icao: "LFPG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 49.0097, longitude: 2.5479, metroArea: "PAR" },
  { iata: "ORY", icao: "LFPO", name: "Orly Airport", city: "Paris", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 48.7233, longitude: 2.3794, metroArea: "PAR" },
  { iata: "BVA", icao: "LFOB", name: "Beauvais Airport", city: "Paris", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 49.4544, longitude: 2.1128, metroArea: "PAR" },
  { iata: "NCE", icao: "LFMN", name: "Nice Côte d'Azur Airport", city: "Nice", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 43.6584, longitude: 7.2158 },
  { iata: "LYS", icao: "LFLL", name: "Lyon-Saint Exupéry Airport", city: "Lyon", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 45.7256, longitude: 5.0811 },
  { iata: "MRS", icao: "LFML", name: "Marseille Airport", city: "Marseille", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 43.4367, longitude: 5.215 },
  { iata: "TLS", icao: "LFBO", name: "Toulouse Airport", city: "Toulouse", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 43.6293, longitude: 1.3638 },
  { iata: "BOD", icao: "LFBD", name: "Bordeaux Airport", city: "Bordeaux", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 44.8283, longitude: -0.7156 },
  
  // Germany
  { iata: "FRA", icao: "EDDF", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", latitude: 50.0379, longitude: 8.5622 },
  { iata: "MUC", icao: "EDDM", name: "Munich Airport", city: "Munich", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", latitude: 48.3538, longitude: 11.7861 },
  { iata: "BER", icao: "EDDB", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", latitude: 52.3667, longitude: 13.5033, metroArea: "BER" },
  { iata: "HAM", icao: "EDDH", name: "Hamburg Airport", city: "Hamburg", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", latitude: 53.6304, longitude: 9.9882 },
  { iata: "DUS", icao: "EDDL", name: "Düsseldorf Airport", city: "Düsseldorf", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", latitude: 51.2895, longitude: 6.7668 },
  { iata: "CGN", icao: "EDDK", name: "Cologne Bonn Airport", city: "Cologne", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", latitude: 50.8659, longitude: 7.1427 },
  { iata: "STR", icao: "EDDS", name: "Stuttgart Airport", city: "Stuttgart", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", latitude: 48.6899, longitude: 9.2219 },
  { iata: "HHN", icao: "EDFH", name: "Frankfurt Hahn Airport", city: "Frankfurt", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", latitude: 49.9487, longitude: 7.2639 },
  
  // Netherlands
  { iata: "AMS", icao: "EHAM", name: "Schiphol Airport", city: "Amsterdam", country: "Netherlands", countryCode: "NL", timezone: "Europe/Amsterdam", latitude: 52.3105, longitude: 4.7683 },
  { iata: "RTM", icao: "EHRD", name: "Rotterdam Airport", city: "Rotterdam", country: "Netherlands", countryCode: "NL", timezone: "Europe/Amsterdam", latitude: 51.9569, longitude: 4.4372 },
  { iata: "EIN", icao: "EHEH", name: "Eindhoven Airport", city: "Eindhoven", country: "Netherlands", countryCode: "NL", timezone: "Europe/Amsterdam", latitude: 51.4501, longitude: 5.3745 },
  
  // Spain
  { iata: "MAD", icao: "LEMD", name: "Adolfo Suárez Airport", city: "Madrid", country: "Spain", countryCode: "ES", timezone: "Europe/Madrid", latitude: 40.4983, longitude: -3.5676 },
  { iata: "BCN", icao: "LEBL", name: "Barcelona Airport", city: "Barcelona", country: "Spain", countryCode: "ES", timezone: "Europe/Madrid", latitude: 41.2971, longitude: 2.0785 },
  { iata: "AGP", icao: "LEMG", name: "Málaga Airport", city: "Málaga", country: "Spain", countryCode: "ES", timezone: "Europe/Madrid", latitude: 36.6749, longitude: -4.4991 },
  { iata: "SVQ", icao: "LEZL", name: "Seville Airport", city: "Seville", country: "Spain", countryCode: "ES", timezone: "Europe/Madrid", latitude: 37.418, longitude: -5.8931 },
  { iata: "VLC", icao: "LEVC", name: "Valencia Airport", city: "Valencia", country: "Spain", countryCode: "ES", timezone: "Europe/Madrid", latitude: 39.4893, longitude: -0.4816 },
  { iata: "PMI", icao: "LEPA", name: "Palma de Mallorca Airport", city: "Palma", country: "Spain", countryCode: "ES", timezone: "Europe/Madrid", latitude: 39.5517, longitude: 2.7388 },
  { iata: "IBZ", icao: "LEIB", name: "Ibiza Airport", city: "Ibiza", country: "Spain", countryCode: "ES", timezone: "Europe/Madrid", latitude: 38.8729, longitude: 1.3731 },
  { iata: "TFS", icao: "GCTS", name: "Tenerife South Airport", city: "Tenerife", country: "Spain", countryCode: "ES", timezone: "Atlantic/Canary", latitude: 28.0445, longitude: -16.5725 },
  { iata: "LPA", icao: "GCLP", name: "Gran Canaria Airport", city: "Gran Canaria", country: "Spain", countryCode: "ES", timezone: "Atlantic/Canary", latitude: 27.9319, longitude: -15.3866 },
  { iata: "ALC", icao: "LEAL", name: "Alicante Airport", city: "Alicante", country: "Spain", countryCode: "ES", timezone: "Europe/Madrid", latitude: 38.2822, longitude: -0.5582 },
  
  // Italy
  { iata: "FCO", icao: "LIRF", name: "Leonardo da Vinci Airport", city: "Rome", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 41.8003, longitude: 12.2389, metroArea: "ROM" },
  { iata: "CIA", icao: "LIRA", name: "Ciampino Airport", city: "Rome", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 41.7994, longitude: 12.5949, metroArea: "ROM" },
  { iata: "MXP", icao: "LIMC", name: "Malpensa Airport", city: "Milan", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 45.6306, longitude: 8.7281, metroArea: "MIL" },
  { iata: "LIN", icao: "LIML", name: "Linate Airport", city: "Milan", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 45.4451, longitude: 9.2767, metroArea: "MIL" },
  { iata: "BGY", icao: "LIME", name: "Orio al Serio Airport", city: "Milan", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 45.6739, longitude: 9.7042, metroArea: "MIL" },
  { iata: "VCE", icao: "LIPZ", name: "Marco Polo Airport", city: "Venice", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 45.5053, longitude: 12.3519 },
  { iata: "NAP", icao: "LIRN", name: "Naples Airport", city: "Naples", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 40.886, longitude: 14.2908 },
  { iata: "BLQ", icao: "LIPE", name: "Bologna Airport", city: "Bologna", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 44.5354, longitude: 11.2887 },
  { iata: "PSA", icao: "LIRP", name: "Pisa Airport", city: "Pisa", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 43.6839, longitude: 10.3927 },
  { iata: "CTA", icao: "LICC", name: "Catania Airport", city: "Catania", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 37.4668, longitude: 15.0664 },
  { iata: "PMO", icao: "LICJ", name: "Palermo Airport", city: "Palermo", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 38.1759, longitude: 13.091 },
  { iata: "CAG", icao: "LIEE", name: "Cagliari Airport", city: "Cagliari", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", latitude: 39.2515, longitude: 9.0543 },
  
  // Switzerland
  { iata: "ZRH", icao: "LSZH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", countryCode: "CH", timezone: "Europe/Zurich", latitude: 47.4647, longitude: 8.5492 },
  { iata: "GVA", icao: "LSGG", name: "Geneva Airport", city: "Geneva", country: "Switzerland", countryCode: "CH", timezone: "Europe/Zurich", latitude: 46.2381, longitude: 6.1089 },
  { iata: "BSL", icao: "LFSB", name: "EuroAirport Basel", city: "Basel", country: "Switzerland", countryCode: "CH", timezone: "Europe/Zurich", latitude: 47.5896, longitude: 7.5299 },
  
  // Austria
  { iata: "VIE", icao: "LOWW", name: "Vienna Airport", city: "Vienna", country: "Austria", countryCode: "AT", timezone: "Europe/Vienna", latitude: 48.1103, longitude: 16.5697 },
  { iata: "SZG", icao: "LOWS", name: "Salzburg Airport", city: "Salzburg", country: "Austria", countryCode: "AT", timezone: "Europe/Vienna", latitude: 47.7933, longitude: 13.0043 },
  { iata: "INN", icao: "LOWI", name: "Innsbruck Airport", city: "Innsbruck", country: "Austria", countryCode: "AT", timezone: "Europe/Vienna", latitude: 47.2576, longitude: 11.3519 },
  
  // Belgium
  { iata: "BRU", icao: "EBBR", name: "Brussels Airport", city: "Brussels", country: "Belgium", countryCode: "BE", timezone: "Europe/Brussels", latitude: 50.9014, longitude: 4.4844 },
  { iata: "CRL", icao: "EBCI", name: "Charleroi Airport", city: "Brussels", country: "Belgium", countryCode: "BE", timezone: "Europe/Brussels", latitude: 50.4592, longitude: 4.4538 },
  
  // Portugal
  { iata: "LIS", icao: "LPPT", name: "Humberto Delgado Airport", city: "Lisbon", country: "Portugal", countryCode: "PT", timezone: "Europe/Lisbon", latitude: 38.7813, longitude: -9.1359 },
  { iata: "OPO", icao: "LPPR", name: "Porto Airport", city: "Porto", country: "Portugal", countryCode: "PT", timezone: "Europe/Lisbon", latitude: 41.2481, longitude: -8.6814 },
  { iata: "FAO", icao: "LPFR", name: "Faro Airport", city: "Faro", country: "Portugal", countryCode: "PT", timezone: "Europe/Lisbon", latitude: 37.0144, longitude: -7.9659 },
  
  // Scandinavia
  { iata: "CPH", icao: "EKCH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", countryCode: "DK", timezone: "Europe/Copenhagen", latitude: 55.618, longitude: 12.6508 },
  { iata: "ARN", icao: "ESSA", name: "Arlanda Airport", city: "Stockholm", country: "Sweden", countryCode: "SE", timezone: "Europe/Stockholm", latitude: 59.6519, longitude: 17.9186 },
  { iata: "OSL", icao: "ENGM", name: "Gardermoen Airport", city: "Oslo", country: "Norway", countryCode: "NO", timezone: "Europe/Oslo", latitude: 60.1939, longitude: 11.1004 },
  { iata: "HEL", icao: "EFHK", name: "Helsinki Airport", city: "Helsinki", country: "Finland", countryCode: "FI", timezone: "Europe/Helsinki", latitude: 60.3172, longitude: 24.9633 },
  
  // Greece
  { iata: "ATH", icao: "LGAV", name: "Athens Airport", city: "Athens", country: "Greece", countryCode: "GR", timezone: "Europe/Athens", latitude: 37.9364, longitude: 23.9445 },
  { iata: "JTR", icao: "LGSR", name: "Santorini Airport", city: "Santorini", country: "Greece", countryCode: "GR", timezone: "Europe/Athens", latitude: 36.3992, longitude: 25.4793 },
  { iata: "JMK", icao: "LGMK", name: "Mykonos Airport", city: "Mykonos", country: "Greece", countryCode: "GR", timezone: "Europe/Athens", latitude: 37.4351, longitude: 25.3481 },
  { iata: "HER", icao: "LGIR", name: "Heraklion Airport", city: "Crete", country: "Greece", countryCode: "GR", timezone: "Europe/Athens", latitude: 35.3397, longitude: 25.1803 },
  { iata: "RHO", icao: "LGRP", name: "Rhodes Airport", city: "Rhodes", country: "Greece", countryCode: "GR", timezone: "Europe/Athens", latitude: 36.4054, longitude: 28.0862 },
  
  // Eastern Europe
  { iata: "PRG", icao: "LKPR", name: "Václav Havel Airport", city: "Prague", country: "Czech Republic", countryCode: "CZ", timezone: "Europe/Prague", latitude: 50.1008, longitude: 14.26 },
  { iata: "BUD", icao: "LHBP", name: "Budapest Airport", city: "Budapest", country: "Hungary", countryCode: "HU", timezone: "Europe/Budapest", latitude: 47.4298, longitude: 19.2611 },
  { iata: "WAW", icao: "EPWA", name: "Chopin Airport", city: "Warsaw", country: "Poland", countryCode: "PL", timezone: "Europe/Warsaw", latitude: 52.1657, longitude: 20.9671 },
  { iata: "KRK", icao: "EPKK", name: "Balice Airport", city: "Krakow", country: "Poland", countryCode: "PL", timezone: "Europe/Warsaw", latitude: 50.0777, longitude: 19.7848 },
  
  // Turkey
  { iata: "IST", icao: "LTFM", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", countryCode: "TR", timezone: "Europe/Istanbul", latitude: 41.2753, longitude: 28.7519, metroArea: "IST" },
  { iata: "SAW", icao: "LTFJ", name: "Sabiha Gökçen Airport", city: "Istanbul", country: "Turkey", countryCode: "TR", timezone: "Europe/Istanbul", latitude: 40.8986, longitude: 29.3092, metroArea: "IST" },
  { iata: "AYT", icao: "LTAI", name: "Antalya Airport", city: "Antalya", country: "Turkey", countryCode: "TR", timezone: "Europe/Istanbul", latitude: 36.8987, longitude: 30.8005 },
  
  // USA - Northeast
  { iata: "JFK", icao: "KJFK", name: "John F. Kennedy Airport", city: "New York", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 40.6413, longitude: -73.7781, metroArea: "NYC" },
  { iata: "LGA", icao: "KLGA", name: "LaGuardia Airport", city: "New York", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 40.7769, longitude: -73.874, metroArea: "NYC" },
  { iata: "EWR", icao: "KEWR", name: "Newark Airport", city: "New York", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 40.6895, longitude: -74.1745, metroArea: "NYC" },
  { iata: "BOS", icao: "KBOS", name: "Logan Airport", city: "Boston", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 42.3656, longitude: -71.0096 },
  { iata: "PHL", icao: "KPHL", name: "Philadelphia Airport", city: "Philadelphia", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 39.8744, longitude: -75.2424 },
  { iata: "DCA", icao: "KDCA", name: "Reagan Airport", city: "Washington DC", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 38.8512, longitude: -77.0402, metroArea: "WAS" },
  { iata: "IAD", icao: "KIAD", name: "Dulles Airport", city: "Washington DC", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 38.9531, longitude: -77.4565, metroArea: "WAS" },
  { iata: "BWI", icao: "KBWI", name: "Baltimore Airport", city: "Baltimore", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 39.1754, longitude: -76.6684 },
  
  // USA - Southeast
  { iata: "ATL", icao: "KATL", name: "Hartsfield-Jackson Airport", city: "Atlanta", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 33.6407, longitude: -84.4277 },
  { iata: "MCO", icao: "KMCO", name: "Orlando Airport", city: "Orlando", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 28.4312, longitude: -81.3081 },
  { iata: "MIA", icao: "KMIA", name: "Miami Airport", city: "Miami", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 25.7959, longitude: -80.287 },
  { iata: "FLL", icao: "KFLL", name: "Fort Lauderdale Airport", city: "Fort Lauderdale", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 26.0742, longitude: -80.1506 },
  { iata: "TPA", icao: "KTPA", name: "Tampa Airport", city: "Tampa", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 27.9755, longitude: -82.5333 },
  { iata: "CLT", icao: "KCLT", name: "Douglas Airport", city: "Charlotte", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 35.214, longitude: -80.9431 },
  { iata: "RDU", icao: "KRDU", name: "Raleigh-Durham Airport", city: "Raleigh", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 35.8801, longitude: -78.788 },
  { iata: "BNA", icao: "KBNA", name: "Nashville Airport", city: "Nashville", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 36.1263, longitude: -86.6774 },
  { iata: "MSY", icao: "KMSY", name: "Louis Armstrong Airport", city: "New Orleans", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 29.9934, longitude: -90.258 },
  
  // USA - Midwest
  { iata: "ORD", icao: "KORD", name: "O'Hare Airport", city: "Chicago", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 41.9742, longitude: -87.9073, metroArea: "CHI" },
  { iata: "MDW", icao: "KMDW", name: "Midway Airport", city: "Chicago", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 41.7868, longitude: -87.7522, metroArea: "CHI" },
  { iata: "DTW", icao: "KDTW", name: "Detroit Airport", city: "Detroit", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 42.2124, longitude: -83.3534 },
  { iata: "MSP", icao: "KMSP", name: "Minneapolis Airport", city: "Minneapolis", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 44.8848, longitude: -93.2223 },
  { iata: "CLE", icao: "KCLE", name: "Cleveland Airport", city: "Cleveland", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 41.4117, longitude: -81.8498 },
  { iata: "CMH", icao: "KCMH", name: "Columbus Airport", city: "Columbus", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 39.998, longitude: -82.8919 },
  { iata: "IND", icao: "KIND", name: "Indianapolis Airport", city: "Indianapolis", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 39.7173, longitude: -86.2944 },
  { iata: "MKE", icao: "KMKE", name: "Milwaukee Airport", city: "Milwaukee", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 42.9476, longitude: -87.8966 },
  
  // USA - West
  { iata: "LAX", icao: "KLAX", name: "Los Angeles Airport", city: "Los Angeles", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 33.9425, longitude: -118.4081, metroArea: "LAX" },
  { iata: "BUR", icao: "KBUR", name: "Burbank Airport", city: "Los Angeles", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 34.2007, longitude: -118.3585, metroArea: "LAX" },
  { iata: "LGB", icao: "KLGB", name: "Long Beach Airport", city: "Los Angeles", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 33.8177, longitude: -118.1516, metroArea: "LAX" },
  { iata: "SNA", icao: "KSNA", name: "John Wayne Airport", city: "Orange County", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 33.6757, longitude: -117.8682 },
  { iata: "SAN", icao: "KSAN", name: "San Diego Airport", city: "San Diego", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 32.7336, longitude: -117.1897 },
  { iata: "SFO", icao: "KSFO", name: "San Francisco Airport", city: "San Francisco", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 37.6213, longitude: -122.379, metroArea: "SFO" },
  { iata: "OAK", icao: "KOAK", name: "Oakland Airport", city: "San Francisco", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 37.7214, longitude: -122.2208, metroArea: "SFO" },
  { iata: "SJC", icao: "KSJC", name: "San Jose Airport", city: "San Jose", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 37.3639, longitude: -121.9289 },
  { iata: "SEA", icao: "KSEA", name: "Seattle Airport", city: "Seattle", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 47.4502, longitude: -122.3088 },
  { iata: "PDX", icao: "KPDX", name: "Portland Airport", city: "Portland", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 45.5898, longitude: -122.5951 },
  { iata: "LAS", icao: "KLAS", name: "Harry Reid Airport", city: "Las Vegas", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 36.084, longitude: -115.1537 },
  { iata: "PHX", icao: "KPHX", name: "Sky Harbor Airport", city: "Phoenix", country: "United States", countryCode: "US", timezone: "America/Phoenix", latitude: 33.4343, longitude: -112.0116 },
  { iata: "DEN", icao: "KDEN", name: "Denver Airport", city: "Denver", country: "United States", countryCode: "US", timezone: "America/Denver", latitude: 39.8561, longitude: -104.6737 },
  { iata: "SLC", icao: "KSLC", name: "Salt Lake City Airport", city: "Salt Lake City", country: "United States", countryCode: "US", timezone: "America/Denver", latitude: 40.7883, longitude: -111.9778 },
  
  // USA - Texas
  { iata: "DFW", icao: "KDFW", name: "Dallas/Fort Worth Airport", city: "Dallas", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 32.8998, longitude: -97.0403, metroArea: "DFW" },
  { iata: "DAL", icao: "KDAL", name: "Love Field Airport", city: "Dallas", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 32.8481, longitude: -96.8514, metroArea: "DFW" },
  { iata: "IAH", icao: "KIAH", name: "Bush Airport", city: "Houston", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 29.9902, longitude: -95.3368, metroArea: "HOU" },
  { iata: "HOU", icao: "KHOU", name: "Hobby Airport", city: "Houston", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 29.6454, longitude: -95.2789, metroArea: "HOU" },
  { iata: "AUS", icao: "KAUS", name: "Austin Airport", city: "Austin", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 30.1945, longitude: -97.6699 },
  { iata: "SAT", icao: "KSAT", name: "San Antonio Airport", city: "San Antonio", country: "United States", countryCode: "US", timezone: "America/Chicago", latitude: 29.5337, longitude: -98.4698 },
  
  // Canada
  { iata: "YYZ", icao: "CYYZ", name: "Pearson Airport", city: "Toronto", country: "Canada", countryCode: "CA", timezone: "America/Toronto", latitude: 43.6777, longitude: -79.6248, metroArea: "YTO" },
  { iata: "YTZ", icao: "CYTZ", name: "Billy Bishop Airport", city: "Toronto", country: "Canada", countryCode: "CA", timezone: "America/Toronto", latitude: 43.6275, longitude: -79.3962, metroArea: "YTO" },
  { iata: "YVR", icao: "CYVR", name: "Vancouver Airport", city: "Vancouver", country: "Canada", countryCode: "CA", timezone: "America/Vancouver", latitude: 49.1967, longitude: -123.1815 },
  { iata: "YUL", icao: "CYUL", name: "Trudeau Airport", city: "Montreal", country: "Canada", countryCode: "CA", timezone: "America/Toronto", latitude: 45.4706, longitude: -73.7408 },
  { iata: "YYC", icao: "CYYC", name: "Calgary Airport", city: "Calgary", country: "Canada", countryCode: "CA", timezone: "America/Edmonton", latitude: 51.1139, longitude: -114.0203 },
  { iata: "YOW", icao: "CYOW", name: "Ottawa Airport", city: "Ottawa", country: "Canada", countryCode: "CA", timezone: "America/Toronto", latitude: 45.3225, longitude: -75.6692 },
  { iata: "YEG", icao: "CYEG", name: "Edmonton Airport", city: "Edmonton", country: "Canada", countryCode: "CA", timezone: "America/Edmonton", latitude: 53.3097, longitude: -113.5796 },
  { iata: "YWG", icao: "CYWG", name: "Winnipeg Airport", city: "Winnipeg", country: "Canada", countryCode: "CA", timezone: "America/Winnipeg", latitude: 49.91, longitude: -97.2399 },
  { iata: "YHZ", icao: "CYHZ", name: "Halifax Airport", city: "Halifax", country: "Canada", countryCode: "CA", timezone: "America/Halifax", latitude: 44.8808, longitude: -63.5086 },
  
  // Mexico
  { iata: "MEX", icao: "MMMX", name: "Benito Juárez Airport", city: "Mexico City", country: "Mexico", countryCode: "MX", timezone: "America/Mexico_City", latitude: 19.4363, longitude: -99.0721 },
  { iata: "CUN", icao: "MMUN", name: "Cancún Airport", city: "Cancún", country: "Mexico", countryCode: "MX", timezone: "America/Cancun", latitude: 21.0365, longitude: -86.8771 },
  { iata: "PVR", icao: "MMPR", name: "Puerto Vallarta Airport", city: "Puerto Vallarta", country: "Mexico", countryCode: "MX", timezone: "America/Mexico_City", latitude: 20.6801, longitude: -105.254 },
  { iata: "SJD", icao: "MMSD", name: "Los Cabos Airport", city: "San José del Cabo", country: "Mexico", countryCode: "MX", timezone: "America/Mazatlan", latitude: 23.1518, longitude: -109.721 },
  { iata: "GDL", icao: "MMGL", name: "Guadalajara Airport", city: "Guadalajara", country: "Mexico", countryCode: "MX", timezone: "America/Mexico_City", latitude: 20.5218, longitude: -103.3111 },
  { iata: "MTY", icao: "MMMY", name: "Monterrey Airport", city: "Monterrey", country: "Mexico", countryCode: "MX", timezone: "America/Monterrey", latitude: 25.7785, longitude: -100.107 },
  
  // Caribbean
  { iata: "MBJ", icao: "MKJS", name: "Sangster Airport", city: "Montego Bay", country: "Jamaica", countryCode: "JM", timezone: "America/Jamaica", latitude: 18.5043, longitude: -77.9134 },
  { iata: "BGI", icao: "TBPB", name: "Grantley Adams Airport", city: "Barbados", country: "Barbados", countryCode: "BB", timezone: "America/Barbados", latitude: 13.0746, longitude: -59.4925 },
  { iata: "NAS", icao: "MYNN", name: "Lynden Pindling Airport", city: "Nassau", country: "Bahamas", countryCode: "BS", timezone: "America/Nassau", latitude: 25.039, longitude: -77.4662 },
  { iata: "BDA", icao: "TXKF", name: "L.F. Wade Airport", city: "Hamilton", country: "Bermuda", countryCode: "BM", timezone: "Atlantic/Bermuda", latitude: 32.364, longitude: -64.6787 },
  { iata: "PUJ", icao: "MDPC", name: "Punta Cana Airport", city: "Punta Cana", country: "Dominican Republic", countryCode: "DO", timezone: "America/Santo_Domingo", latitude: 18.5674, longitude: -68.3634 },
  { iata: "SJU", icao: "TJSJ", name: "Luis Muñoz Marín Airport", city: "San Juan", country: "Puerto Rico", countryCode: "PR", timezone: "America/Puerto_Rico", latitude: 18.4394, longitude: -66.0018 },
  { iata: "HAV", icao: "MUHA", name: "José Martí Airport", city: "Havana", country: "Cuba", countryCode: "CU", timezone: "America/Havana", latitude: 22.9892, longitude: -82.4091 },
  
  // South America
  { iata: "GRU", icao: "SBGR", name: "Guarulhos Airport", city: "São Paulo", country: "Brazil", countryCode: "BR", timezone: "America/Sao_Paulo", latitude: -23.4356, longitude: -46.4731, metroArea: "SAO" },
  { iata: "CGH", icao: "SBSP", name: "Congonhas Airport", city: "São Paulo", country: "Brazil", countryCode: "BR", timezone: "America/Sao_Paulo", latitude: -23.6267, longitude: -46.6555, metroArea: "SAO" },
  { iata: "GIG", icao: "SBGL", name: "Galeão Airport", city: "Rio de Janeiro", country: "Brazil", countryCode: "BR", timezone: "America/Sao_Paulo", latitude: -22.809, longitude: -43.2506, metroArea: "RIO" },
  { iata: "SDU", icao: "SBRJ", name: "Santos Dumont Airport", city: "Rio de Janeiro", country: "Brazil", countryCode: "BR", timezone: "America/Sao_Paulo", latitude: -22.9105, longitude: -43.1631, metroArea: "RIO" },
  { iata: "BSB", icao: "SBBR", name: "Brasília Airport", city: "Brasília", country: "Brazil", countryCode: "BR", timezone: "America/Sao_Paulo", latitude: -15.8692, longitude: -47.9208 },
  { iata: "EZE", icao: "SAEZ", name: "Ministro Pistarini Airport", city: "Buenos Aires", country: "Argentina", countryCode: "AR", timezone: "America/Argentina/Buenos_Aires", latitude: -34.8222, longitude: -58.5358, metroArea: "BUE" },
  { iata: "AEP", icao: "SABE", name: "Jorge Newbery Airport", city: "Buenos Aires", country: "Argentina", countryCode: "AR", timezone: "America/Argentina/Buenos_Aires", latitude: -34.5592, longitude: -58.4156, metroArea: "BUE" },
  { iata: "SCL", icao: "SCEL", name: "Arturo Merino Airport", city: "Santiago", country: "Chile", countryCode: "CL", timezone: "America/Santiago", latitude: -33.393, longitude: -70.7858 },
  { iata: "LIM", icao: "SPJC", name: "Jorge Chávez Airport", city: "Lima", country: "Peru", countryCode: "PE", timezone: "America/Lima", latitude: -12.0219, longitude: -77.1143 },
  { iata: "BOG", icao: "SKBO", name: "El Dorado Airport", city: "Bogotá", country: "Colombia", countryCode: "CO", timezone: "America/Bogota", latitude: 4.7016, longitude: -74.1469 },
  { iata: "CTG", icao: "SKCG", name: "Rafael Núñez Airport", city: "Cartagena", country: "Colombia", countryCode: "CO", timezone: "America/Bogota", latitude: 10.4424, longitude: -75.513 },
  { iata: "MDE", icao: "SKRG", name: "José María Córdova Airport", city: "Medellín", country: "Colombia", countryCode: "CO", timezone: "America/Bogota", latitude: 6.1645, longitude: -75.4231 },
  { iata: "UIO", icao: "SEQM", name: "Mariscal Sucre Airport", city: "Quito", country: "Ecuador", countryCode: "EC", timezone: "America/Guayaquil", latitude: -0.1292, longitude: -78.3575 },
  { iata: "GYE", icao: "SEGU", name: "José Joaquín de Olmedo Airport", city: "Guayaquil", country: "Ecuador", countryCode: "EC", timezone: "America/Guayaquil", latitude: -2.1574, longitude: -79.8836 },
  { iata: "LPB", icao: "SLLP", name: "El Alto Airport", city: "La Paz", country: "Bolivia", countryCode: "BO", timezone: "America/La_Paz", latitude: -16.5133, longitude: -68.1923 },
  { iata: "VVI", icao: "SLVR", name: "Viru Viru Airport", city: "Santa Cruz", country: "Bolivia", countryCode: "BO", timezone: "America/La_Paz", latitude: -17.6448, longitude: -63.1354 },
  { iata: "CUZ", icao: "SPZO", name: "Alejandro Velasco Airport", city: "Cusco", country: "Peru", countryCode: "PE", timezone: "America/Lima", latitude: -13.5357, longitude: -71.9388 },
  
  // Asia - Japan
  { iata: "NRT", icao: "RJAA", name: "Narita Airport", city: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.7647, longitude: 140.3864, metroArea: "TYO" },
  { iata: "HND", icao: "RJTT", name: "Haneda Airport", city: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.5494, longitude: 139.7798, metroArea: "TYO" },
  { iata: "KIX", icao: "RJBB", name: "Kansai Airport", city: "Osaka", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 34.4273, longitude: 135.244, metroArea: "OSA" },
  { iata: "ITM", icao: "RJOO", name: "Itami Airport", city: "Osaka", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 34.7855, longitude: 135.438, metroArea: "OSA" },
  { iata: "FUK", icao: "RJFF", name: "Fukuoka Airport", city: "Fukuoka", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 33.5859, longitude: 130.4506 },
  { iata: "CTS", icao: "RJCC", name: "New Chitose Airport", city: "Sapporo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 42.7752, longitude: 141.6923 },
  { iata: "OKA", icao: "ROAH", name: "Naha Airport", city: "Okinawa", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 26.1958, longitude: 127.6458 },
  { iata: "NGO", icao: "RJGG", name: "Chubu Centrair Airport", city: "Nagoya", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 34.8584, longitude: 136.8054 },
  
  // Asia - South Korea
  { iata: "ICN", icao: "RKSI", name: "Incheon Airport", city: "Seoul", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 37.4602, longitude: 126.4407, metroArea: "SEL" },
  { iata: "GMP", icao: "RKSS", name: "Gimpo Airport", city: "Seoul", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 37.5583, longitude: 126.7906, metroArea: "SEL" },
  { iata: "PUS", icao: "RKPK", name: "Gimhae Airport", city: "Busan", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 35.1795, longitude: 128.9382 },
  { iata: "CJU", icao: "RKPC", name: "Jeju Airport", city: "Jeju", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 33.5113, longitude: 126.493 },
  
  // Asia - China
  { iata: "PEK", icao: "ZBAA", name: "Capital Airport", city: "Beijing", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 40.0799, longitude: 116.6031, metroArea: "BJS" },
  { iata: "PKX", icao: "ZBAD", name: "Daxing Airport", city: "Beijing", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 39.5098, longitude: 116.4105, metroArea: "BJS" },
  { iata: "PVG", icao: "ZSPD", name: "Pudong Airport", city: "Shanghai", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 31.1443, longitude: 121.8083, metroArea: "SHA" },
  { iata: "SHA", icao: "ZSSS", name: "Hongqiao Airport", city: "Shanghai", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 31.1979, longitude: 121.3356, metroArea: "SHA" },
  { iata: "CAN", icao: "ZGGG", name: "Baiyun Airport", city: "Guangzhou", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 23.3959, longitude: 113.2988 },
  { iata: "SZX", icao: "ZGSZ", name: "Bao'an Airport", city: "Shenzhen", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 22.6393, longitude: 113.8107 },
  { iata: "CTU", icao: "ZUUU", name: "Shuangliu Airport", city: "Chengdu", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 30.5785, longitude: 103.9471 },
  { iata: "TFU", icao: "ZUTF", name: "Tianfu Airport", city: "Chengdu", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 30.3072, longitude: 104.4444 },
  { iata: "XIY", icao: "ZLXY", name: "Xianyang Airport", city: "Xi'an", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 34.4471, longitude: 108.7516 },
  { iata: "HGH", icao: "ZSHC", name: "Xiaoshan Airport", city: "Hangzhou", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 30.2295, longitude: 120.4344 },
  { iata: "TAO", icao: "ZSQD", name: "Liuting Airport", city: "Qingdao", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 36.2663, longitude: 120.3822 },
  { iata: "XMN", icao: "ZSAM", name: "Gaoqi Airport", city: "Xiamen", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 24.544, longitude: 118.1277 },
  { iata: "WUH", icao: "ZHHH", name: "Tianhe Airport", city: "Wuhan", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 30.7838, longitude: 114.2081 },
  { iata: "NKG", icao: "ZSNJ", name: "Lukou Airport", city: "Nanjing", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 31.742, longitude: 118.862 },
  { iata: "CKG", icao: "ZUCK", name: "Jiangbei Airport", city: "Chongqing", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 29.7192, longitude: 106.6417 },
  { iata: "TSN", icao: "ZBTJ", name: "Binhai Airport", city: "Tianjin", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 39.1244, longitude: 117.3461 },
  { iata: "DLC", icao: "ZYTL", name: "Zhoushuizi Airport", city: "Dalian", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 38.9657, longitude: 121.5386 },
  { iata: "CGO", icao: "ZHCC", name: "Xinzheng Airport", city: "Zhengzhou", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 34.5197, longitude: 113.8409 },
  { iata: "CSX", icao: "ZGCS", name: "Huanghua Airport", city: "Changsha", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 28.1892, longitude: 113.2196 },
  { iata: "FOC", icao: "ZSFZ", name: "Changle Airport", city: "Fuzhou", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 25.9351, longitude: 119.6632 },
  
  // Asia - Hong Kong, Taiwan, Macau
  { iata: "HKG", icao: "VHHH", name: "Hong Kong Airport", city: "Hong Kong", country: "Hong Kong", countryCode: "HK", timezone: "Asia/Hong_Kong", latitude: 22.308, longitude: 113.9185 },
  { iata: "TPE", icao: "RCTP", name: "Taoyuan Airport", city: "Taipei", country: "Taiwan", countryCode: "TW", timezone: "Asia/Taipei", latitude: 25.0797, longitude: 121.2342 },
  { iata: "KHH", icao: "RCKH", name: "Kaohsiung Airport", city: "Kaohsiung", country: "Taiwan", countryCode: "TW", timezone: "Asia/Taipei", latitude: 22.5771, longitude: 120.35 },
  { iata: "MFM", icao: "VMMC", name: "Macau Airport", city: "Macau", country: "Macau", countryCode: "MO", timezone: "Asia/Macau", latitude: 22.1496, longitude: 113.5916 },
  
  // Asia - Southeast Asia
  { iata: "SIN", icao: "WSSS", name: "Changi Airport", city: "Singapore", country: "Singapore", countryCode: "SG", timezone: "Asia/Singapore", latitude: 1.3644, longitude: 103.9915 },
  { iata: "BKK", icao: "VTBS", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 13.69, longitude: 100.7501, metroArea: "BKK" },
  { iata: "DMK", icao: "VTBD", name: "Don Mueang Airport", city: "Bangkok", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 13.9126, longitude: 100.6068, metroArea: "BKK" },
  { iata: "HKT", icao: "VTSP", name: "Phuket Airport", city: "Phuket", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 8.1132, longitude: 98.3169 },
  { iata: "CNX", icao: "VTCC", name: "Chiang Mai Airport", city: "Chiang Mai", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 18.7668, longitude: 98.9626 },
  { iata: "KUL", icao: "WMKK", name: "Kuala Lumpur Airport", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", timezone: "Asia/Kuala_Lumpur", latitude: 2.7456, longitude: 101.7072 },
  { iata: "PEN", icao: "WMKP", name: "Penang Airport", city: "Penang", country: "Malaysia", countryCode: "MY", timezone: "Asia/Kuala_Lumpur", latitude: 5.2971, longitude: 100.2769 },
  { iata: "CGK", icao: "WIII", name: "Soekarno-Hatta Airport", city: "Jakarta", country: "Indonesia", countryCode: "ID", timezone: "Asia/Jakarta", latitude: -6.1256, longitude: 106.6559, metroArea: "JKT" },
  { iata: "DPS", icao: "WADD", name: "Ngurah Rai Airport", city: "Bali", country: "Indonesia", countryCode: "ID", timezone: "Asia/Makassar", latitude: -8.7482, longitude: 115.1672 },
  { iata: "SUB", icao: "WARR", name: "Juanda Airport", city: "Surabaya", country: "Indonesia", countryCode: "ID", timezone: "Asia/Jakarta", latitude: -7.3798, longitude: 112.7868 },
  { iata: "MNL", icao: "RPLL", name: "Ninoy Aquino Airport", city: "Manila", country: "Philippines", countryCode: "PH", timezone: "Asia/Manila", latitude: 14.5086, longitude: 121.0194 },
  { iata: "CEB", icao: "RPVM", name: "Mactan-Cebu Airport", city: "Cebu", country: "Philippines", countryCode: "PH", timezone: "Asia/Manila", latitude: 10.313, longitude: 123.9794 },
  { iata: "HAN", icao: "VVNB", name: "Noi Bai Airport", city: "Hanoi", country: "Vietnam", countryCode: "VN", timezone: "Asia/Bangkok", latitude: 21.2212, longitude: 105.8071 },
  { iata: "SGN", icao: "VVTS", name: "Tan Son Nhat Airport", city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", timezone: "Asia/Bangkok", latitude: 10.8188, longitude: 106.6519 },
  { iata: "DAD", icao: "VVDN", name: "Da Nang Airport", city: "Da Nang", country: "Vietnam", countryCode: "VN", timezone: "Asia/Bangkok", latitude: 16.0439, longitude: 108.199 },
  { iata: "PNH", icao: "VDPP", name: "Phnom Penh Airport", city: "Phnom Penh", country: "Cambodia", countryCode: "KH", timezone: "Asia/Bangkok", latitude: 11.5466, longitude: 104.844 },
  { iata: "REP", icao: "VDSR", name: "Siem Reap Airport", city: "Siem Reap", country: "Cambodia", countryCode: "KH", timezone: "Asia/Bangkok", latitude: 13.4105, longitude: 103.8131 },
  { iata: "RGN", icao: "VYYY", name: "Yangon Airport", city: "Yangon", country: "Myanmar", countryCode: "MM", timezone: "Asia/Yangon", latitude: 16.9073, longitude: 96.1332 },
  { iata: "VTE", icao: "VLVT", name: "Wattay Airport", city: "Vientiane", country: "Laos", countryCode: "LA", timezone: "Asia/Bangkok", latitude: 17.9883, longitude: 102.5633 },
  
  // Asia - India
  { iata: "DEL", icao: "VIDP", name: "Indira Gandhi Airport", city: "Delhi", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 28.5562, longitude: 77.1 },
  { iata: "BOM", icao: "VABB", name: "Chhatrapati Shivaji Airport", city: "Mumbai", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 19.0896, longitude: 72.8656 },
  { iata: "BLR", icao: "VOBL", name: "Kempegowda Airport", city: "Bangalore", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 13.1986, longitude: 77.7066 },
  { iata: "MAA", icao: "VOMM", name: "Chennai Airport", city: "Chennai", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 12.9941, longitude: 80.1709 },
  { iata: "HYD", icao: "VOHS", name: "Rajiv Gandhi Airport", city: "Hyderabad", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 17.2313, longitude: 78.4298 },
  { iata: "CCU", icao: "VECC", name: "Netaji Subhas Airport", city: "Kolkata", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 22.6547, longitude: 88.4467 },
  { iata: "COK", icao: "VOCI", name: "Cochin Airport", city: "Kochi", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 10.152, longitude: 76.4019 },
  { iata: "TRV", icao: "VOTV", name: "Trivandrum Airport", city: "Thiruvananthapuram", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 8.4821, longitude: 76.9201 },
  { iata: "AMD", icao: "VAAH", name: "Sardar Patel Airport", city: "Ahmedabad", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 23.0772, longitude: 72.6347 },
  { iata: "Pune", icao: "VAPO", name: "Pune Airport", city: "Pune", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 18.5822, longitude: 73.9197 },
  { iata: "GOI", icao: "VOGO", name: "Goa Airport", city: "Goa", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 15.3808, longitude: 73.8314 },
  { iata: "JAI", icao: "VIJP", name: "Jaipur Airport", city: "Jaipur", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", latitude: 26.8242, longitude: 75.8122 },
  
  // Asia - Middle East
  { iata: "DXB", icao: "OMDB", name: "Dubai Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai", latitude: 25.2532, longitude: 55.3657, metroArea: "DXB" },
  { iata: "DWC", icao: "OMDW", name: "Al Maktoum Airport", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai", latitude: 24.8964, longitude: 55.1614, metroArea: "DXB" },
  { iata: "AUH", icao: "OMAA", name: "Abu Dhabi Airport", city: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai", latitude: 24.433, longitude: 54.6511 },
  { iata: "SHJ", icao: "OMSJ", name: "Sharjah Airport", city: "Sharjah", country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai", latitude: 25.3286, longitude: 55.5172 },
  { iata: "DOH", icao: "OTHH", name: "Hamad Airport", city: "Doha", country: "Qatar", countryCode: "QA", timezone: "Asia/Qatar", latitude: 25.2731, longitude: 51.6081 },
  { iata: "JED", icao: "OEJN", name: "King Abdulaziz Airport", city: "Jeddah", country: "Saudi Arabia", countryCode: "SA", timezone: "Asia/Riyadh", latitude: 21.6796, longitude: 39.1565 },
  { iata: "RUH", icao: "OERK", name: "King Khalid Airport", city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", timezone: "Asia/Riyadh", latitude: 24.9576, longitude: 46.6988 },
  { iata: "MED", icao: "OEMA", name: "Prince Mohammad Airport", city: "Medina", country: "Saudi Arabia", countryCode: "SA", timezone: "Asia/Riyadh", latitude: 24.5534, longitude: 39.7051 },
  { iata: "DMM", icao: "OEDF", name: "King Fahd Airport", city: "Dammam", country: "Saudi Arabia", countryCode: "SA", timezone: "Asia/Riyadh", latitude: 26.4712, longitude: 49.7979 },
  { iata: "MCT", icao: "OOMS", name: "Muscat Airport", city: "Muscat", country: "Oman", countryCode: "OM", timezone: "Asia/Muscat", latitude: 23.5933, longitude: 58.2844 },
  { iata: "BAH", icao: "OBBI", name: "Bahrain Airport", city: "Manama", country: "Bahrain", countryCode: "BH", timezone: "Asia/Bahrain", latitude: 26.2708, longitude: 50.6336 },
  { iata: "KWI", icao: "OKBK", name: "Kuwait Airport", city: "Kuwait City", country: "Kuwait", countryCode: "KW", timezone: "Asia/Kuwait", latitude: 29.2266, longitude: 47.9689 },
  { iata: "TLV", icao: "LLBG", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel", countryCode: "IL", timezone: "Asia/Jerusalem", latitude: 32.0114, longitude: 34.8867 },
  { iata: "AMM", icao: "OJAI", name: "Queen Alia Airport", city: "Amman", country: "Jordan", countryCode: "JO", timezone: "Asia/Amman", latitude: 31.7226, longitude: 35.9932 },
  { iata: "BEY", icao: "OLBA", name: "Rafic Hariri Airport", city: "Beirut", country: "Lebanon", countryCode: "LB", timezone: "Asia/Beirut", latitude: 33.8209, longitude: 35.4884 },
  { iata: "BGW", icao: "ORBI", name: "Baghdad Airport", city: "Baghdad", country: "Iraq", countryCode: "IQ", timezone: "Asia/Baghdad", latitude: 33.2625, longitude: 44.2346 },
  { iata: "IKA", icao: "OIIE", name: "Imam Khomeini Airport", city: "Tehran", country: "Iran", countryCode: "IR", timezone: "Asia/Tehran", latitude: 35.4161, longitude: 51.1522 },
  
  // Africa
  { iata: "CAI", icao: "HECA", name: "Cairo Airport", city: "Cairo", country: "Egypt", countryCode: "EG", timezone: "Africa/Cairo", latitude: 30.1219, longitude: 31.4056 },
  { iata: "HRG", icao: "HEGN", name: "Hurghada Airport", city: "Hurghada", country: "Egypt", countryCode: "EG", timezone: "Africa/Cairo", latitude: 27.1783, longitude: 33.7994 },
  { iata: "SSH", icao: "HESH", name: "Sharm El Sheikh Airport", city: "Sharm El Sheikh", country: "Egypt", countryCode: "EG", timezone: "Africa/Cairo", latitude: 27.9773, longitude: 34.395 },
  { iata: "LXR", icao: "HELX", name: "Luxor Airport", city: "Luxor", country: "Egypt", countryCode: "EG", timezone: "Africa/Cairo", latitude: 25.671, longitude: 32.7066 },
  { iata: "JNB", icao: "FAOR", name: "O.R. Tambo Airport", city: "Johannesburg", country: "South Africa", countryCode: "ZA", timezone: "Africa/Johannesburg", latitude: -26.1392, longitude: 28.246, metroArea: "JNB" },
  { iata: "HLA", icao: "FALA", name: "Lanseria Airport", city: "Johannesburg", country: "South Africa", countryCode: "ZA", timezone: "Africa/Johannesburg", latitude: -25.9385, longitude: 27.9261, metroArea: "JNB" },
  { iata: "CPT", icao: "FACT", name: "Cape Town Airport", city: "Cape Town", country: "South Africa", countryCode: "ZA", timezone: "Africa/Johannesburg", latitude: -33.9648, longitude: 18.6017 },
  { iata: "DUR", icao: "FALE", name: "King Shaka Airport", city: "Durban", country: "South Africa", countryCode: "ZA", timezone: "Africa/Johannesburg", latitude: -29.6144, longitude: 31.1197 },
  { iata: "LOS", icao: "DNMM", name: "Murtala Muhammed Airport", city: "Lagos", country: "Nigeria", countryCode: "NG", timezone: "Africa/Lagos", latitude: 6.5774, longitude: 3.3212 },
  { iata: "ADD", icao: "HAAB", name: "Bole Airport", city: "Addis Ababa", country: "Ethiopia", countryCode: "ET", timezone: "Africa/Addis_Ababa", latitude: 8.9779, longitude: 38.7993 },
  { iata: "NBO", icao: "HKJK", name: "Jomo Kenyatta Airport", city: "Nairobi", country: "Kenya", countryCode: "KE", timezone: "Africa/Nairobi", latitude: -1.3192, longitude: 36.9278 },
  { iata: "DAR", icao: "HTDA", name: "Julius Nyerere Airport", city: "Dar es Salaam", country: "Tanzania", countryCode: "TZ", timezone: "Africa/Dar_es_Salaam", latitude: -6.8781, longitude: 39.2026 },
  { iata: "ACC", icao: "DGAA", name: "Kotoka Airport", city: "Accra", country: "Ghana", countryCode: "GH", timezone: "Africa/Accra", latitude: 5.6052, longitude: -0.1668 },
  { iata: "CMN", icao: "GMMN", name: "Mohammed V Airport", city: "Casablanca", country: "Morocco", countryCode: "MA", timezone: "Africa/Casablanca", latitude: 33.3675, longitude: -7.5898 },
  { iata: "RAK", icao: "GMMX", name: "Marrakesh Airport", city: "Marrakesh", country: "Morocco", countryCode: "MA", timezone: "Africa/Casablanca", latitude: 31.6069, longitude: -8.0363 },
  { iata: "TUN", icao: "DTTA", name: "Carthage Airport", city: "Tunis", country: "Tunisia", countryCode: "TN", timezone: "Africa/Tunis", latitude: 36.851, longitude: 10.2272 },
  { iata: "ALG", icao: "DAAG", name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria", countryCode: "DZ", timezone: "Africa/Algiers", latitude: 36.691, longitude: 3.2154 },
  
  // Oceania
  { iata: "SYD", icao: "YSSY", name: "Kingsford Smith Airport", city: "Sydney", country: "Australia", countryCode: "AU", timezone: "Australia/Sydney", latitude: -33.9399, longitude: 151.1753 },
  { iata: "MEL", icao: "YMML", name: "Tullamarine Airport", city: "Melbourne", country: "Australia", countryCode: "AU", timezone: "Australia/Melbourne", latitude: -37.6733, longitude: 144.843 },
  { iata: "BNE", icao: "YBBN", name: "Brisbane Airport", city: "Brisbane", country: "Australia", countryCode: "AU", timezone: "Australia/Brisbane", latitude: -27.3942, longitude: 153.1218 },
  { iata: "PER", icao: "YPPH", name: "Perth Airport", city: "Perth", country: "Australia", countryCode: "AU", timezone: "Australia/Perth", latitude: -31.9403, longitude: 115.9669 },
  { iata: "ADL", icao: "YPAD", name: "Adelaide Airport", city: "Adelaide", country: "Australia", countryCode: "AU", timezone: "Australia/Adelaide", latitude: -34.945, longitude: 138.5306 },
  { iata: "OOL", icao: "YBCG", name: "Gold Coast Airport", city: "Gold Coast", country: "Australia", countryCode: "AU", timezone: "Australia/Brisbane", latitude: -28.1644, longitude: 153.5047 },
  { iata: "CNS", icao: "YBCS", name: "Cairns Airport", city: "Cairns", country: "Australia", countryCode: "AU", timezone: "Australia/Brisbane", latitude: -16.8858, longitude: 145.7553 },
  { iata: "AKL", icao: "NZAA", name: "Auckland Airport", city: "Auckland", country: "New Zealand", countryCode: "NZ", timezone: "Pacific/Auckland", latitude: -37.0082, longitude: 174.7917 },
  { iata: "CHC", icao: "NZCH", name: "Christchurch Airport", city: "Christchurch", country: "New Zealand", countryCode: "NZ", timezone: "Pacific/Auckland", latitude: -43.4894, longitude: 172.5322 },
  { iata: "WLG", icao: "NZWN", name: "Wellington Airport", city: "Wellington", country: "New Zealand", countryCode: "NZ", timezone: "Pacific/Auckland", latitude: -41.3272, longitude: 174.8047 },
  { iata: "NAN", icao: "NFFN", name: "Nadi Airport", city: "Nadi", country: "Fiji", countryCode: "FJ", timezone: "Pacific/Fiji", latitude: -17.7554, longitude: 177.4434 },
  { iata: "PPT", icao: "NTAA", name: "Faa'a Airport", city: "Papeete", country: "Tahiti", countryCode: "PF", timezone: "Pacific/Tahiti", latitude: -17.5567, longitude: -149.6114 },
  { iata: "RAR", icao: "NCRG", name: "Rarotonga Airport", city: "Rarotonga", country: "Cook Islands", countryCode: "CK", timezone: "Pacific/Rarotonga", latitude: -21.2027, longitude: -159.8057 },
  
  // Central Asia
  { iata: "TAS", icao: "UTTT", name: "Tashkent Airport", city: "Tashkent", country: "Uzbekistan", countryCode: "UZ", timezone: "Asia/Tashkent", latitude: 41.2579, longitude: 69.2812 },
  { iata: "ALA", icao: "UAAA", name: "Almaty Airport", city: "Almaty", country: "Kazakhstan", countryCode: "KZ", timezone: "Asia/Almaty", latitude: 43.3521, longitude: 77.0405 },
  { iata: "TSE", icao: "UACC", name: "Nursultan Airport", city: "Nur-Sultan", country: "Kazakhstan", countryCode: "KZ", timezone: "Asia/Almaty", latitude: 51.0222, longitude: 71.4669 },
  { iata: "GYD", icao: "UBBB", name: "Heydar Aliyev Airport", city: "Baku", country: "Azerbaijan", countryCode: "AZ", timezone: "Asia/Baku", latitude: 40.4675, longitude: 50.0467 },
];

// Helper functions
export function getAirportByIATA(iata: string): GlobalAirport | undefined {
  return GLOBAL_AIRPORTS.find(airport => airport.iata === iata.toUpperCase());
}

export function getAirportsByCity(city: string): GlobalAirport[] {
  return GLOBAL_AIRPORTS.filter(airport => 
    airport.city.toLowerCase() === city.toLowerCase()
  );
}

export function getAirportsByCountry(countryCode: string): GlobalAirport[] {
  return GLOBAL_AIRPORTS.filter(airport => 
    airport.countryCode === countryCode.toUpperCase()
  );
}

export function getMetroAirports(metroCode: string): GlobalAirport[] {
  return GLOBAL_AIRPORTS.filter(airport => 
    airport.metroArea === metroCode.toUpperCase()
  );
}

export function searchAirports(query: string): GlobalAirport[] {
  const normalizedQuery = query.toLowerCase();
  return GLOBAL_AIRPORTS.filter(airport => 
    airport.iata.toLowerCase().includes(normalizedQuery) ||
    airport.city.toLowerCase().includes(normalizedQuery) ||
    airport.name.toLowerCase().includes(normalizedQuery) ||
    airport.country.toLowerCase().includes(normalizedQuery)
  );
}

export function getAllAirportCodes(): string[] {
  return GLOBAL_AIRPORTS.map(airport => airport.iata);
}

export function getAllMetroAreas(): string[] {
  const metros = new Set(GLOBAL_AIRPORTS.map(airport => airport.metroArea).filter(Boolean));
  return Array.from(metros) as string[];
}

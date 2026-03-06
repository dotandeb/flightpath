import { SplitTicket } from '@/types';
import { getMetroAirports } from './airports';

const POPULAR_CONNECTIONS: Record<string, string[]> = {
  'LON': ['DXB', 'DOH', 'AUH', 'IST', 'SIN', 'AMS', 'CDG', 'FRA'],
  'NYC': ['LHR', 'CDG', 'FRA', 'AMS', 'DXB', 'DOH', 'SIN', 'HKG'],
  'LAX': ['NRT', 'ICN', 'SIN', 'HKG', 'DXB', 'LHR', 'FRA'],
  'SYD': ['SIN', 'HKG', 'DXB', 'DOH', 'NRT', 'LAX', 'SFO'],
  'BKK': ['SIN', 'HKG', 'DXB', 'DOH', 'ICN', 'NRT', 'IST'],
  'SIN': ['BKK', 'HKG', 'DXB', 'DOH', 'NRT', 'ICN', 'SYD', 'MEL']
};

export function generateSplitTickets(
  origin: string,
  destination: string,
  departureDate: string,
  basePrice: number
): SplitTicket[] {
  const splitTickets: SplitTicket[] = [];
  
  const originAirports = getMetroAirports(origin);
  const destAirports = getMetroAirports(destination);
  
  const originHubs = POPULAR_CONNECTIONS[origin] || [];
  const destHubs = POPULAR_CONNECTIONS[destination] || [];
  
  const commonHubs = originHubs.filter(hub => destHubs.includes(hub));
  
  for (const hub of commonHubs.slice(0, 3)) {
    const leg1Price = Math.round(basePrice * 0.35 + Math.random() * 100);
    const leg2Price = Math.round(basePrice * 0.4 + Math.random() * 100);
    const totalPrice = leg1Price + leg2Price;
    
    if (totalPrice < basePrice * 0.85) {
      splitTickets.push({
        id: `split-${origin}-${hub}-${destination}-${Date.now()}`,
        tickets: [
          {
            from: originAirports[0],
            to: hub,
            price: leg1Price,
            airline: getRandomAirline(),
            flightNumber: `XX${100 + Math.floor(Math.random() * 900)}`,
            departure: `${departureDate}T10:00:00`,
            arrival: `${departureDate}T14:00:00`,
            bookingLink: `https://www.google.com/travel/flights?q=Flights%20to%20${hub}%20from%20${originAirports[0]}`
          },
          {
            from: hub,
            to: destAirports[0],
            price: leg2Price,
            airline: getRandomAirline(),
            flightNumber: `XX${100 + Math.floor(Math.random() * 900)}`,
            departure: `${departureDate}T16:00:00`,
            arrival: `${departureDate}T22:00:00`,
            bookingLink: `https://www.google.com/travel/flights?q=Flights%20to%20${destAirports[0]}%20from%20${hub}`
          }
        ],
        totalPrice,
        savings: Math.round(basePrice - totalPrice),
        currency: 'GBP',
        totalDuration: '12h 00m',
        stops: 1
      });
    }
  }
  
  if (isTransatlantic(origin, destination)) {
    const euroHubs = ['LHR', 'CDG', 'FRA', 'AMS', 'DUB'];
    for (const hub of euroHubs.slice(0, 2)) {
      const leg1Price = Math.round(basePrice * 0.25 + Math.random() * 80);
      const leg2Price = Math.round(basePrice * 0.5 + Math.random() * 120);
      const totalPrice = leg1Price + leg2Price;
      
      if (totalPrice < basePrice * 0.8) {
        splitTickets.push({
          id: `split-eu-${hub}-${Date.now()}`,
          tickets: [
            {
              from: originAirports[0],
              to: hub,
              price: leg1Price,
              airline: getRandomAirline(),
              flightNumber: `XX${100 + Math.floor(Math.random() * 900)}`,
              departure: `${departureDate}T08:00:00`,
              arrival: `${departureDate}T11:00:00`,
              bookingLink: `https://www.google.com/travel/flights?q=Flights%20to%20${hub}%20from%20${originAirports[0]}`
            },
            {
              from: hub,
              to: destAirports[0],
              price: leg2Price,
              airline: getRandomAirline(),
              flightNumber: `XX${100 + Math.floor(Math.random() * 900)}`,
              departure: `${departureDate}T13:00:00`,
              arrival: `${departureDate}T20:00:00`,
              bookingLink: `https://www.google.com/travel/flights?q=Flights%20to%20${destAirports[0]}%20from%20${hub}`
            }
          ],
          totalPrice,
          savings: Math.round(basePrice - totalPrice),
          currency: 'GBP',
          totalDuration: '16h 00m',
          stops: 1
        });
      }
    }
  }
  
  if (isLongHaulToAsia(origin, destination)) {
    const meHubs = ['DXB', 'DOH', 'AUH'];
    for (const hub of meHubs.slice(0, 2)) {
      const leg1Price = Math.round(basePrice * 0.4 + Math.random() * 100);
      const leg2Price = Math.round(basePrice * 0.45 + Math.random() * 100);
      const totalPrice = leg1Price + leg2Price;
      
      if (totalPrice < basePrice * 0.85) {
        splitTickets.push({
          id: `split-me-${hub}-${Date.now()}`,
          tickets: [
            {
              from: originAirports[0],
              to: hub,
              price: leg1Price,
              airline: getRandomAirline(),
              flightNumber: `XX${100 + Math.floor(Math.random() * 900)}`,
              departure: `${departureDate}T14:00:00`,
              arrival: `${departureDate}T23:00:00`,
              bookingLink: `https://www.google.com/travel/flights?q=Flights%20to%20${hub}%20from%20${originAirports[0]}`
            },
            {
              from: hub,
              to: destAirports[0],
              price: leg2Price,
              airline: getRandomAirline(),
              flightNumber: `XX${100 + Math.floor(Math.random() * 900)}`,
              departure: `${departureDate}T01:00:00`,
              arrival: `${departureDate}T14:00:00`,
              bookingLink: `https://www.google.com/travel/flights?q=Flights%20to%20${destAirports[0]}%20from%20${hub}`
            }
          ],
          totalPrice,
          savings: Math.round(basePrice - totalPrice),
          currency: 'GBP',
          totalDuration: '24h 00m',
          stops: 1
        });
      }
    }
  }
  
  const positioningOptions = generatePositioningOptions(origin, destination, departureDate, basePrice);
  splitTickets.push(...positioningOptions);
  
  return splitTickets
    .filter(ticket => ticket.savings > 50)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5);
}

function generatePositioningOptions(origin: string, destination: string, departureDate: string, basePrice: number): SplitTicket[] {
  const options: SplitTicket[] = [];
  const originAirports = getMetroAirports(origin);
  const destAirports = getMetroAirports(destination);
  
  const majorHubs = ['LHR', 'CDG', 'FRA', 'AMS'];
  
  if (!majorHubs.includes(originAirports[0])) {
    for (const hub of majorHubs.slice(0, 2)) {
      const positioningPrice = Math.round(50 + Math.random() * 100);
      const mainFlightPrice = Math.round(basePrice * 0.6 + Math.random() * 150);
      const totalPrice = positioningPrice + mainFlightPrice;
      
      if (totalPrice < basePrice * 0.75) {
        options.push({
          id: `position-${hub}-${Date.now()}`,
          tickets: [
            {
              from: originAirports[0],
              to: hub,
              price: positioningPrice,
              airline: 'Ryanair',
              flightNumber: `FR${1000 + Math.floor(Math.random() * 9000)}`,
              departure: `${departureDate}T06:00:00`,
              arrival: `${departureDate}T08:00:00`,
              bookingLink: `https://www.ryanair.com/gb/en/trip/flights/select?origin=${originAirports[0]}&destination=${hub}`
            },
            {
              from: hub,
              to: destAirports[0],
              price: mainFlightPrice,
              airline: getRandomAirline(),
              flightNumber: `XX${100 + Math.floor(Math.random() * 900)}`,
              departure: `${departureDate}T11:00:00`,
              arrival: `${departureDate}T20:00:00`,
              bookingLink: `https://www.google.com/travel/flights?q=Flights%20to%20${destAirports[0]}%20from%20${hub}`
            }
          ],
          totalPrice,
          savings: Math.round(basePrice - totalPrice),
          currency: 'GBP',
          totalDuration: '18h 00m',
          stops: 1
        });
      }
    }
  }
  
  return options;
}

function isTransatlantic(origin: string, destination: string): boolean {
  const european = ['LON', 'PAR', 'FRA', 'AMS', 'MUC', 'FCO', 'MAD', 'BCN', 'DUB', 'EDI', 'MAN', 'BER', 'ROM', 'MIL'];
  const us = ['NYC', 'LAX', 'CHI', 'WAS', 'SFO', 'MIA', 'BOS', 'PHL', 'PHX', 'LAS', 'SEA', 'ATL', 'DFW', 'DEN', 'IAH'];
  
  const orig = origin.substring(0, 3);
  const dest = destination.substring(0, 3);
  
  return (european.includes(orig) && us.includes(dest)) || (us.includes(orig) && european.includes(dest));
}

function isLongHaulToAsia(origin: string, destination: string): boolean {
  const europe = ['LON', 'PAR', 'FRA', 'AMS', 'MUC', 'FCO', 'MAD', 'BCN', 'DUB'];
  const asiaPacific = ['BKK', 'SIN', 'HKG', 'KUL', 'SYD', 'MEL', 'BNE', 'PER', 'NRT', 'HND', 'ICN', 'TPE', 'PVG', 'PEK', 'BOM', 'DEL'];
  
  const orig = origin.substring(0, 3);
  const dest = destination.substring(0, 3);
  
  return (europe.includes(orig) && asiaPacific.includes(dest)) || (asiaPacific.includes(orig) && europe.includes(dest));
}

function getRandomAirline(): string {
  const airlines = ['British Airways', 'Lufthansa', 'Air France', 'KLM', 'Emirates', 'Qatar Airways', 'Singapore Airlines'];
  return airlines[Math.floor(Math.random() * airlines.length)];
}
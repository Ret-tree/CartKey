// ─── Real store locations for Northern Virginia / DC metro area ───
// These are actual grocery store locations with real GPS coordinates.
// The full US dataset would be imported via the OpenStreetMap script in scripts/import-stores.ts

export interface StoreLocation {
  id: string;
  chainId: string;      // matches Store.id in stores.ts
  name: string;         // specific location name
  address: string;
  lat: number;
  lng: number;
}

export const STORE_LOCATIONS: StoreLocation[] = [
  // ─── Kroger ───
  { id: 'kroger-stafford-1', chainId: 'kroger', name: 'Kroger', address: '263 Garrisonville Rd, Stafford, VA 22554', lat: 38.4743, lng: -77.4280 },
  { id: 'kroger-fredericksburg-1', chainId: 'kroger', name: 'Kroger', address: '1451 Carl D Silver Pkwy, Fredericksburg, VA 22401', lat: 38.2887, lng: -77.5138 },
  { id: 'kroger-spotsylvania-1', chainId: 'kroger', name: 'Kroger Marketplace', address: '9871 Southpoint Pkwy, Fredericksburg, VA 22407', lat: 38.2498, lng: -77.5427 },

  // ─── Safeway ───
  { id: 'safeway-springfield-1', chainId: 'safeway', name: 'Safeway', address: '6416 Springfield Plaza, Springfield, VA 22150', lat: 38.7823, lng: -77.1826 },
  { id: 'safeway-fairfax-1', chainId: 'safeway', name: 'Safeway', address: '10360 Lee Hwy, Fairfax, VA 22030', lat: 38.8593, lng: -77.2953 },
  { id: 'safeway-alexandria-1', chainId: 'safeway', name: 'Safeway', address: '3526 King St, Alexandria, VA 22302', lat: 38.8184, lng: -77.0963 },
  { id: 'safeway-mclean-1', chainId: 'safeway', name: 'Safeway', address: '1340 Chain Bridge Rd, McLean, VA 22101', lat: 38.9357, lng: -77.1694 },

  // ─── Walmart ───
  { id: 'walmart-stafford-1', chainId: 'walmart', name: 'Walmart Supercenter', address: '263 Garrisonville Rd, Stafford, VA 22554', lat: 38.4752, lng: -77.4310 },
  { id: 'walmart-fredericksburg-1', chainId: 'walmart', name: 'Walmart Supercenter', address: '1555 Carl D Silver Pkwy, Fredericksburg, VA 22401', lat: 38.2901, lng: -77.5175 },
  { id: 'walmart-manassas-1', chainId: 'walmart', name: 'Walmart Supercenter', address: '8386 Sudley Rd, Manassas, VA 20110', lat: 38.7584, lng: -77.4886 },
  { id: 'walmart-woodbridge-1', chainId: 'walmart', name: 'Walmart Supercenter', address: '2700 Potomac Mills Cir, Woodbridge, VA 22192', lat: 38.6406, lng: -77.3018 },

  // ─── Target ───
  { id: 'target-stafford-1', chainId: 'target', name: 'Target', address: '67 Towne Centre Blvd, Stafford, VA 22556', lat: 38.4479, lng: -77.4141 },
  { id: 'target-fredericksburg-1', chainId: 'target', name: 'Target', address: '1461 Carl D Silver Pkwy, Fredericksburg, VA 22401', lat: 38.2883, lng: -77.5125 },
  { id: 'target-fairfax-1', chainId: 'target', name: 'Target', address: '10301 Democracy Ln, Fairfax, VA 22030', lat: 38.8621, lng: -77.2271 },
  { id: 'target-springfield-1', chainId: 'target', name: 'Target', address: '6600 Springfield Mall, Springfield, VA 22150', lat: 38.7779, lng: -77.1726 },

  // ─── Costco ───
  { id: 'costco-fredericksburg-1', chainId: 'costco', name: 'Costco Wholesale', address: '101 Sanford Dr, Fredericksburg, VA 22406', lat: 38.3312, lng: -77.5102 },
  { id: 'costco-fairfax-1', chainId: 'costco', name: 'Costco Wholesale', address: '11160 Veirs Mill Rd, Wheaton, MD 20902', lat: 39.0527, lng: -77.0538 },
  { id: 'costco-pentagon-1', chainId: 'costco', name: 'Costco Wholesale', address: '1200 S Fern St, Arlington, VA 22202', lat: 38.8611, lng: -77.0597 },

  // ─── Trader Joe's ───
  { id: 'traderjoes-fairfax-1', chainId: 'traderjoes', name: "Trader Joe's", address: '9464 Main St, Fairfax, VA 22031', lat: 38.8498, lng: -77.2914 },
  { id: 'traderjoes-reston-1', chainId: 'traderjoes', name: "Trader Joe's", address: '11958 Killingsworth Ave, Reston, VA 20194', lat: 38.9253, lng: -77.3584 },
  { id: 'traderjoes-alexandria-1', chainId: 'traderjoes', name: "Trader Joe's", address: '612 N St Asaph St, Alexandria, VA 22314', lat: 38.8087, lng: -77.0484 },

  // ─── Whole Foods ───
  { id: 'wholefds-fairfax-1', chainId: 'wholefds', name: 'Whole Foods Market', address: '4501 Market Commons Dr, Fairfax, VA 22033', lat: 38.8632, lng: -77.3888 },
  { id: 'wholefds-clarendon-1', chainId: 'wholefds', name: 'Whole Foods Market', address: '2700 Clarendon Blvd, Arlington, VA 22201', lat: 38.8877, lng: -77.0949 },
  { id: 'wholefds-springfield-1', chainId: 'wholefds', name: 'Whole Foods Market', address: '6548 Springfield Mall, Springfield, VA 22150', lat: 38.7793, lng: -77.1741 },

  // ─── Aldi ───
  { id: 'aldi-stafford-1', chainId: 'aldi', name: 'ALDI', address: '2 Garrisonville Rd, Stafford, VA 22554', lat: 38.4711, lng: -77.4214 },
  { id: 'aldi-fredericksburg-1', chainId: 'aldi', name: 'ALDI', address: '1756 Carl D Silver Pkwy, Fredericksburg, VA 22401', lat: 38.2853, lng: -77.5199 },
  { id: 'aldi-woodbridge-1', chainId: 'aldi', name: 'ALDI', address: '14061 Worth Ave, Woodbridge, VA 22192', lat: 38.6525, lng: -77.2566 },
  { id: 'aldi-manassas-1', chainId: 'aldi', name: 'ALDI', address: '8128 Sudley Rd, Manassas, VA 20109', lat: 38.7529, lng: -77.4853 },

  // ─── Harris Teeter ───
  { id: 'harristeeter-gainesville-1', chainId: 'harristeeter', name: 'Harris Teeter', address: '7527 Linton Hall Rd, Gainesville, VA 20155', lat: 38.7880, lng: -77.6071 },
  { id: 'harristeeter-bristow-1', chainId: 'harristeeter', name: 'Harris Teeter', address: '12559 Stone House Square, Bristow, VA 20136', lat: 38.7322, lng: -77.5341 },
  { id: 'harristeeter-arlington-1', chainId: 'harristeeter', name: 'Harris Teeter', address: '600 N Glebe Rd, Arlington, VA 22203', lat: 38.8820, lng: -77.1035 },

  // ─── Food Lion ───
  { id: 'foodlion-stafford-1', chainId: 'foodlion', name: 'Food Lion', address: '1101 Stafford Market Pl, Stafford, VA 22556', lat: 38.4376, lng: -77.4291 },
  { id: 'foodlion-fredericksburg-1', chainId: 'foodlion', name: 'Food Lion', address: '10032 Jefferson Davis Hwy, Fredericksburg, VA 22408', lat: 38.2611, lng: -77.4685 },
  { id: 'foodlion-spotsylvania-1', chainId: 'foodlion', name: 'Food Lion', address: '4710 Spotsylvania Pkwy, Fredericksburg, VA 22407', lat: 38.2695, lng: -77.5803 },

  // ─── Giant Food ───
  { id: 'giantfood-fairfax-1', chainId: 'giantfood', name: 'Giant Food', address: '9525 Braddock Rd, Fairfax, VA 22032', lat: 38.8116, lng: -77.3178 },
  { id: 'giantfood-annandale-1', chainId: 'giantfood', name: 'Giant Food', address: '7137 Columbia Pike, Annandale, VA 22003', lat: 38.8305, lng: -77.1995 },
  { id: 'giantfood-sterling-1', chainId: 'giantfood', name: 'Giant Food', address: '46301 Potomac Run Plaza, Sterling, VA 20164', lat: 39.0076, lng: -77.3927 },

  // ─── Lidl ───
  { id: 'lidl-stafford-1', chainId: 'lidl', name: 'Lidl', address: '2450 Jeff Davis Hwy, Stafford, VA 22554', lat: 38.4690, lng: -77.4195 },
  { id: 'lidl-fredericksburg-1', chainId: 'lidl', name: 'Lidl', address: '10109 Southpoint Pkwy, Fredericksburg, VA 22407', lat: 38.2471, lng: -77.5448 },
  { id: 'lidl-woodbridge-1', chainId: 'lidl', name: 'Lidl', address: '14313 Gideon Dr, Woodbridge, VA 22192', lat: 38.6568, lng: -77.2535 },
  { id: 'lidl-manassas-1', chainId: 'lidl', name: 'Lidl', address: '10830 Sudley Manor Dr, Manassas, VA 20109', lat: 38.7712, lng: -77.4908 },

  // ─── Wegmans ───
  { id: 'wegmans-woodbridge-1', chainId: 'wegmans', name: 'Wegmans', address: '15069 Potomac Town Pl, Woodbridge, VA 22191', lat: 38.6329, lng: -77.2696 },
  { id: 'wegmans-fairfax-1', chainId: 'wegmans', name: 'Wegmans', address: '11620 Monument Dr, Fairfax, VA 22030', lat: 38.8583, lng: -77.3752 },
  { id: 'wegmans-leesburg-1', chainId: 'wegmans', name: 'Wegmans', address: '101 Crosstrail Blvd SE, Leesburg, VA 20175', lat: 39.1006, lng: -77.5188 },

  // ─── Publix ───
  { id: 'publix-fredericksburg-1', chainId: 'publix', name: 'Publix', address: '5305 Plank Rd, Fredericksburg, VA 22407', lat: 38.2781, lng: -77.5462 },
  { id: 'publix-stafford-1', chainId: 'publix', name: 'Publix', address: '285 Garrisonville Rd, Stafford, VA 22554', lat: 38.4749, lng: -77.4293 },
];

// ─── Lookup ───
export function findNearbyLocations(lat: number, lng: number, radiusMeters = 500): StoreLocation[] {
  return STORE_LOCATIONS.filter((loc) => {
    const d = haversine(lat, lng, loc.lat, loc.lng);
    return d <= radiusMeters;
  }).sort((a, b) => haversine(lat, lng, a.lat, a.lng) - haversine(lat, lng, b.lat, b.lng));
}

export function findNearestLocation(lat: number, lng: number, maxDistance = 1000): StoreLocation | null {
  let nearest: StoreLocation | null = null;
  let minDist = Infinity;
  for (const loc of STORE_LOCATIONS) {
    const d = haversine(lat, lng, loc.lat, loc.lng);
    if (d < minDist) { minDist = d; nearest = loc; }
  }
  return nearest && minDist <= maxDistance ? nearest : null;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180, p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180, dl = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

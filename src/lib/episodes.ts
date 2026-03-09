export const CLEANING_CONFIG = {
  omissions: [
    /A Very Doughboys Christmas/i,
    /Mash Off 7: Mashin': Impossible - Fed Reckoning/i,
    /Soup's Up with Joe Hartzler/i,
    /The 2018 Doughboys Christmas Special: Wiger Alone/i,
    /Oops! All Segments! 4!I/i,
    /Oops! All Segments! 3!/i,
    /Mash Off 6: The Chompit: The Battle of the 5 Cookies/i,
    /Garden of Eatin':/i,
    /Munch Madness Finale/i,
    /Chomp-Out Round/i,
    /Doughscord Doughcision: School Lunch/i,
    /Gorko's Planet Clergmas Spectacular/i,
    /Shockdoughbooerdeath: Doughschord Doughcision: Candy Corn/,
  ],
  protectedNames: [
    "Big Mama's & Papa's Pizzeria",
    'A&W',
    'Salt & Straw',
    'Backyard Bowls',
    'Ameci Pizza and Pasta',
    "Ben & Jerry's",
  ],
  prefixes: [
    /^UNLOCKED!\s*/i,
    /^Octdoughberblessed:\s*/i,
    /^Soup's Up\s*/i,
    /^UNLOCKED:\s*/i,
    /^Crock-Dough-Burn-Pho-Est:\s*/i,
    /^Munch Madness X:\s*/i,
    /^Munch Madness XI:\s*/i,
    /^Toront-dough:\s*/i,
    /^Munch Madness:\s*/i,
    /^Episode 200 -\s*/i,
    /^SHAQ WEEK:\s*/i,
    /^The Ate-TL:\s*/i,
    /^Shockdoughbooerdeath:\s*/i,
  ],
  delimiters: [
    /\s+vs\.?\s+/i,
    /\s+w\/\s+/i,
    /\s+and\s+/i,
    /\s*&\s*/,
    /\s*\/\s*/,
  ],
  suffixes: [
    /\s+\d+$/g,
    /\s+\(LIVE\)$/i,
    /\s+Solo Menu$/i,
    /\s+IX$/i,
    /\s+5: Doritos Footlong Nachos$/i,
    /\s+Bowls$/i,
    /\s+9: Slice House$/i,
    /\s+Xbox Indiana Jones Menu$/i,
    /\s+3 Zach Cherry$/i,
    /\s+6: Sonic Menu$/i,
    /\s+3: Saucy Nuggets$/i,
  ],
};

function cleanSuffixes(name: string): string {
  let cleaned = name;
  for (const suff of CLEANING_CONFIG.suffixes) {
    cleaned = cleaned.replace(suff, '');
  }
  return cleaned.trim();
}

export function cleanRestaurantName(name: string): string[] {
  const shouldOmit = CLEANING_CONFIG.omissions.some((pattern) => {
    return typeof pattern === 'string'
      ? name.includes(pattern)
      : pattern.test(name);
  });

  if (shouldOmit) {
    return [];
  }

  let segment = name;
  for (const prefix of CLEANING_CONFIG.prefixes) {
    segment = segment.replace(prefix, '');
  }
  segment = segment.split(/\s+with\s+/i)[0] as string;

  const protectedMatch = CLEANING_CONFIG.protectedNames.find((n) =>
    segment.toLowerCase().includes(n.toLowerCase())
  );

  if (protectedMatch) {
    return [cleanSuffixes(protectedMatch)];
  }

  let results = [segment];
  for (const delim of CLEANING_CONFIG.delimiters) {
    results = results.flatMap((item) => item.split(delim));
  }

  return results
    .map((res) => cleanSuffixes(res))
    .filter((res) => res.length > 0);
}

export interface Episode {
  title: string;
  description: string;
  type: string;
  number: number | null;
  pubDate: string;
  restaurants: string[];
}

export function episodeHref(episode: Episode): string {
  return `/episode/${episode.number || `bonus-${encodeURIComponent(episode.title)}`}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const restaurantLocations: Record<
  string,
  { lat: number; lng: number; address: string }
> = {
  'Ggiata Delicatessen': {
    lat: 34.0407,
    lng: -118.2468,
    address: 'Los Angeles, CA',
  },
  'In-N-Out Burger': {
    lat: 34.0522,
    lng: -118.2437,
    address: 'Los Angeles, CA',
  },
  'Shake Shack': {
    lat: 34.0195,
    lng: -118.4912,
    address: 'Los Angeles, CA',
  },
  'Taco Bell': { lat: 34.0689, lng: -118.0056, address: 'Los Angeles, CA' },
  "McDonald's": { lat: 34.0736, lng: -118.4004, address: 'Los Angeles, CA' },
  "Wendy's": { lat: 34.1478, lng: -118.1445, address: 'Pasadena, CA' },
  "Arby's": { lat: 33.9425, lng: -118.4081, address: 'El Segundo, CA' },
  'Del Taco': { lat: 34.1808, lng: -118.309, address: 'Burbank, CA' },
  "Carl's Jr.": { lat: 33.8358, lng: -118.3406, address: 'Torrance, CA' },
  'Jack in the Box': {
    lat: 34.0259,
    lng: -118.2965,
    address: 'Los Angeles, CA',
  },
  'Edible Arrangements': {
    lat: 34.0525,
    lng: -118.2551,
    address: 'Los Angeles, CA',
  },
  "Chili's": { lat: 34.058, lng: -118.4165, address: 'Los Angeles, CA' },
  "Applebee's": { lat: 34.1561, lng: -118.2536, address: 'Glendale, CA' },
  'Olive Garden': { lat: 34.1865, lng: -118.308, address: 'Burbank, CA' },
  'Cheesecake Factory': {
    lat: 34.0592,
    lng: -118.4174,
    address: 'Beverly Hills, CA',
  },
  'Buffalo Wild Wings': {
    lat: 34.0211,
    lng: -118.3965,
    address: 'Culver City, CA',
  },
  Wingstop: { lat: 34.0634, lng: -118.3076, address: 'Los Angeles, CA' },
  Popeyes: { lat: 34.0485, lng: -118.2545, address: 'Los Angeles, CA' },
  'Chick-fil-A': { lat: 34.0623, lng: -118.3541, address: 'Los Angeles, CA' },
  'Five Guys': {
    lat: 34.0731,
    lng: -118.3794,
    address: 'West Hollywood, CA',
  },
  'Panda Express': {
    lat: 34.0456,
    lng: -118.2672,
    address: 'Los Angeles, CA',
  },
  Chipotle: { lat: 34.0589, lng: -118.4452, address: 'Santa Monica, CA' },
  Subway: { lat: 34.0498, lng: -118.259, address: 'Los Angeles, CA' },
  "Domino's": { lat: 34.0695, lng: -118.2912, address: 'Los Angeles, CA' },
  'Pizza Hut': { lat: 34.0823, lng: -118.3215, address: 'Los Angeles, CA' },
  "Papa John's": { lat: 34.0912, lng: -118.2845, address: 'Los Angeles, CA' },
  KFC: { lat: 34.0567, lng: -118.2732, address: 'Los Angeles, CA' },
  Sonic: { lat: 34.1234, lng: -118.2156, address: 'Pasadena, CA' },
  'Dairy Queen': { lat: 34.1456, lng: -118.1523, address: 'Pasadena, CA' },
  'Baskin-Robbins': {
    lat: 34.0345,
    lng: -118.4523,
    address: 'Santa Monica, CA',
  },
  "Dunkin'": { lat: 34.0678, lng: -118.3512, address: 'Los Angeles, CA' },
  Starbucks: { lat: 34.0512, lng: -118.2478, address: 'Los Angeles, CA' },
  'Jamba Juice': { lat: 34.0398, lng: -118.4678, address: 'Santa Monica, CA' },
};

export const defaultLocation = { lat: 34.0522, lng: -118.2437 };

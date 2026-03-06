import { XMLParser } from 'fast-xml-parser';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const CLEANING_CONFIG = {
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
  // These split the restaurant string into an array
  delimiters: [
    /\s+vs\.?\s+/i,
    /\s+w\/\s+/i,
    /\s+and\s+/i,
    /\s*&\s*/,
    /\s*\/\s*/, // For "Souplantation/Sweet Tomatoes"
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

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/api/episodes', async (c) => {
  const rawResponse = await fetch('https://rss.art19.com/doughboys');
  const rawContent = await rawResponse.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const jsonContent = parser.parse(rawContent);
  const episodes = jsonContent.rss.channel.item;
  const cleanedEpisodes = episodes.map((episode: any) => {
    return {
      title: episode.title,
      description: episode.description,
      type: episode['itunes:episodeType'],
      number: episode['itunes:episode'],
      pubDate: episode.pubDate,
      restaurants: cleanRestaurantName(episode.title),
    };
  });
  return c.json(cleanedEpisodes);
});

app.get('/api/nearby', async (c) => {
  const { lat, lng, restaurants } = c.req.query();

  if (!lat || !lng) {
    return c.json({ error: 'Missing lat or lng query parameters' }, 400);
  }

  if (!process.env.GOOGLE_API_KEY) {
    return c.json({ error: 'Missing Authentication Token' }, 500);
  }

  const apiKey = process.env.GOOGLE_API_KEY;

  const textSearchResponse = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({
        textQuery: restaurants,
        pageSize: 10,
        locationBias: {
          circle: {
            center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
            radius: 50000.0,
          },
        },
      }),
    }
  );
  const textSearchData = await textSearchResponse.json();
  console.log(textSearchData.places.map((place: any) => place.displayName.text));
  const restaurantLocations =
    textSearchData.places?.filter((place: any) => {
      const placeName = place.displayName.text.toLowerCase();
      return restaurants
        .toLowerCase()
        .split(',')
        .some((res: string) => placeName.includes(res.trim()));
    }) || [];
  return c.json(restaurantLocations);
});

function cleanRestaurantName(name: string): string[] {
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

  const protectedMatch = CLEANING_CONFIG.protectedNames.find((name) =>
    segment.toLowerCase().includes(name.toLowerCase())
  );

  if (protectedMatch) {
    // We still run suffix cleaning on the match just in case
    return [cleanSuffixes(protectedMatch)];
  }

  // Otherwise, proceed with the split logic
  let results = [segment];
  for (const delim of CLEANING_CONFIG.delimiters) {
    results = results.flatMap((item) => item.split(delim));
  }

  return results
    .map((res) => cleanSuffixes(res))
    .filter((res) => res.length > 0);
}

function cleanSuffixes(name: string): string {
  let cleaned = name;
  for (const suff of CLEANING_CONFIG.suffixes) {
    cleaned = cleaned.replace(suff, '');
  }
  return cleaned.trim();
}

// API routes will go here
// app.route("/api", apiRoutes);

// Serve static files
app.use('/*', serveStatic({ root: './public' }));

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};

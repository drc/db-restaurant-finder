import { json } from '@sveltejs/kit';
import { GOOGLE_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  const restaurants = url.searchParams.get('restaurants');

  if (!lat || !lng) {
    return json(
      { error: 'Missing lat or lng query parameters' },
      { status: 400 }
    );
  }

  if (!GOOGLE_API_KEY) {
    return json({ error: 'Missing Authentication Token' }, { status: 500 });
  }

  const textSearchResponse = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({
        textQuery: restaurants,
        pageSize: 10,
        locationBias: {
          circle: {
            center: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
            },
            radius: 50000.0,
          },
        },
      }),
    }
  );
  const textSearchData: any = await textSearchResponse.json();
  const restaurantLocations =
    textSearchData.places?.filter((place: any) => {
      const placeName = place.displayName.text.toLowerCase();
      return restaurants
        ?.toLowerCase()
        .split(',')
        .some((res: string) => placeName.includes(res.trim()));
    }) || [];
  return json(restaurantLocations);
};

import * as Sentry from '@sentry/sveltekit';
import { json } from '@sveltejs/kit';
import { GOOGLE_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  const restaurants = url.searchParams.get('restaurants');

  if (!lat || !lng) {
    Sentry.logger.warn('Nearby search missing coordinates', {
      endpoint: '/api/nearby',
      hasLat: Boolean(lat),
      hasLng: Boolean(lng),
    });

    return json(
      { error: 'Missing lat or lng query parameters' },
      { status: 400 }
    );
  }

  if (!GOOGLE_API_KEY) {
    Sentry.logger.error('Nearby search missing Google API key', {
      endpoint: '/api/nearby',
      upstream: 'google-places',
    });

    return json({ error: 'Missing Authentication Token' }, { status: 500 });
  }

  try {
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

    if (!textSearchResponse.ok) {
      Sentry.logger.error('Google Places text search failed', {
        endpoint: '/api/nearby',
        status: textSearchResponse.status,
        upstream: 'google-places',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        restaurantCount: restaurants?.split(',').length ?? 0,
      });

      return json(
        { error: 'Failed to fetch nearby restaurants' },
        { status: 502 }
      );
    }

    const textSearchData: any = await textSearchResponse.json();

    if (!Array.isArray(textSearchData.places)) {
      Sentry.logger.warn('Google Places returned unexpected shape', {
        endpoint: '/api/nearby',
        upstream: 'google-places',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });

      return json([]);
    }

    const restaurantLocations = textSearchData.places.filter((place: any) => {
      const placeName = place.displayName.text.toLowerCase();
      return restaurants
        ?.toLowerCase()
        .split(',')
        .some((res: string) => placeName.includes(res.trim()));
    });

    if (restaurantLocations.length === 0) {
      Sentry.logger.warn('Nearby search returned no matching restaurants', {
        endpoint: '/api/nearby',
        upstream: 'google-places',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        restaurantCount: restaurants?.split(',').length ?? 0,
      });
    }

    return json(restaurantLocations);
  } catch (error) {
    Sentry.logger.error('Nearby search failed unexpectedly', {
      endpoint: '/api/nearby',
      upstream: 'google-places',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      restaurantCount: restaurants?.split(',').length ?? 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};

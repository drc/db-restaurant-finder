import * as Sentry from '@sentry/sveltekit';
import { json } from '@sveltejs/kit';
import { XMLParser } from 'fast-xml-parser';
import { cleanRestaurantName } from '$lib/episodes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const rawResponse = await fetch('https://rss.art19.com/doughboys');

    if (!rawResponse.ok) {
      Sentry.logger.error('Episodes feed request failed', {
        endpoint: '/api/episodes',
        status: rawResponse.status,
        upstream: 'art19-rss',
      });

      return json({ error: 'Failed to fetch episodes feed' }, { status: 502 });
    }

    const rawContent = await rawResponse.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const jsonContent = parser.parse(rawContent);
    const episodes = jsonContent.rss?.channel?.item;

    if (!Array.isArray(episodes)) {
      Sentry.logger.warn('Episodes feed returned unexpected shape', {
        endpoint: '/api/episodes',
        upstream: 'art19-rss',
      });

      return json({ error: 'Unexpected episodes feed shape' }, { status: 502 });
    }

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

    return json(cleanedEpisodes);
  } catch (error) {
    Sentry.logger.error('Episodes feed parse failed', {
      endpoint: '/api/episodes',
      upstream: 'art19-rss',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};

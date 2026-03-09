import { json } from '@sveltejs/kit';
import { XMLParser } from 'fast-xml-parser';
import { cleanRestaurantName } from '$lib/episodes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
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
  return json(cleanedEpisodes);
};

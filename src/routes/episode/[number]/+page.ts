import type { Episode } from '$lib/episodes';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  const response = await fetch('/api/episodes');
  const episodes: Episode[] = await response.json();

  // Find the episode by number or by title (for bonus episodes)
  const index = episodes.findIndex((ep) => {
    if (params.number.startsWith('bonus-')) {
      const title = decodeURIComponent(params.number.replace('bonus-', ''));
      return ep.title === title;
    }
    return ep.number === parseInt(params.number, 10);
  });

  const episode = index !== -1 ? episodes[index]! : null;
  const prevEpisode = index > 0 ? episodes[index - 1]! : null;
  const nextEpisode =
    index !== -1 && index < episodes.length - 1 ? episodes[index + 1]! : null;

  return { episode, prevEpisode, nextEpisode };
};

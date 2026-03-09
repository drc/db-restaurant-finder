import type { Episode } from '$lib/episodes';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch('/api/episodes');
  const episodes: Episode[] = await response.json();
  return { episodes };
};

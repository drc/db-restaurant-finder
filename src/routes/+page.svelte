<script lang="ts">
import type { Episode } from '$lib/episodes';
import { episodeHref, formatDate } from '$lib/episodes';

let { data } = $props();
let searchQuery = $state('');

let filteredEpisodes = $derived.by(() => {
  const q = searchQuery.toLowerCase().trim();
  if (!q) return data.episodes;
  return data.episodes.filter((ep: Episode) => {
    const titleMatch = ep.title.toLowerCase().includes(q);
    const restaurantMatch = (ep.restaurants || []).some((r: string) =>
      r.toLowerCase().includes(q)
    );
    return titleMatch || restaurantMatch;
  });
});
</script>

<div class="search-box">
  <input
    type="text"
    placeholder="Search episodes or restaurants..."
    bind:value={searchQuery}
  />
</div>

<div class="episode-list">
  {#each filteredEpisodes as episode}
    <a
      class="episode-item"
      href={episodeHref(episode)}
    >
      <span
        class="episode-number"
        class:bonus={episode.type?.toLowerCase() === 'bonus' || episode.number == null}
      >
        {episode.number || 'Bonus'}
      </span>
      <div class="episode-content">
        <div class="episode-item-title">{episode.title}</div>
        <div class="episode-item-meta">{formatDate(episode.pubDate)}</div>
      </div>
      <div class="episode-restaurants">
        {#each (episode.restaurants || []).slice(0, 3) as restaurant}
          <span class="restaurant-tag">{restaurant}</span>
        {/each}
      </div>
    </a>
  {/each}
</div>

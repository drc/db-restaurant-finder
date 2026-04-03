<script lang="ts">
import EpisodeLocation from '$lib/EpisodeLocation.svelte';
import { episodeHref, formatDate } from '$lib/episodes';

let { data } = $props();
let episode = $derived(data.episode);
let prevEpisode = $derived(data.prevEpisode);
let nextEpisode = $derived(data.nextEpisode);
</script>

{#if episode}
  <nav class="episode-nav">
    {#if prevEpisode}
      <a class="nav-btn nav-prev" href={episodeHref(prevEpisode)}>
        <span class="nav-arrow">&larr;</span>
        <span class="nav-label">
          <span class="nav-direction">Previous</span>
          <span class="nav-title">{prevEpisode.title}</span>
        </span>
      </a>
    {:else}
      <span class="nav-btn nav-placeholder"></span>
    {/if}

    {#if nextEpisode}
      <a class="nav-btn nav-next" href={episodeHref(nextEpisode)}>
        <span class="nav-label">
          <span class="nav-direction">Next</span>
          <span class="nav-title">{nextEpisode.title}</span>
        </span>
        <span class="nav-arrow">&rarr;</span>
      </a>
    {:else}
      <span class="nav-btn nav-placeholder"></span>
    {/if}
  </nav>

  <div class="episode-header">
    <span
      class="episode-number"
      class:bonus={episode.type === 'bonus'}
    >
      {episode.number ? `#${episode.number}` : 'Bonus'}
    </span>
    <h2 class="episode-title">{episode.title}</h2>
    <p class="episode-date">{formatDate(episode.pubDate)}</p>
    <div class="episode-description">{@html episode.description}</div>
  </div>

  {#key episodeHref(episode)}
    <EpisodeLocation {episode} />
  {/key}
{:else}
  <div class="loading">
    <p>Episode not found</p>
  </div>
{/if}

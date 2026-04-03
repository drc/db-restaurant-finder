<script module lang="ts">
let cachedLocationResult: Promise<{
  location: { lat: number; lng: number };
  isDefault: boolean;
}> | null = null;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import {
    defaultLocation,
    getDistance,
    restaurantLocations,
    type Episode,
  } from '$lib/episodes';

  let { episode }: { episode: Episode } = $props();

  let mapContainer: HTMLDivElement = $state(
    undefined as unknown as HTMLDivElement
  );
  let map: any = null;
  let L: any = null;

  let locationStatusText = $state('');
  let locationStatusClass = $state('');
  let showLocationStatus = $state(false);

  let restaurantLoading = $state(true);
  let showRestaurantInfo = $state(false);
  let showNoRestaurant = $state(false);

  let closestName = $state('');
  let closestDistance = $state('');
  let allRestaurants: RestaurantLocation[] = $state([]);

  interface RestaurantLocation {
    name: string;
    lat: number;
    lng: number;
    address: string;
    distance: number;
  }

  function getUserLocation(): Promise<{
    location: { lat: number; lng: number };
    isDefault: boolean;
  }> {
    if (cachedLocationResult) {
      return cachedLocationResult;
    }

    cachedLocationResult = new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve({ location: defaultLocation, isDefault: true });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            isDefault: false,
          });
        },
        () => {
          resolve({ location: defaultLocation, isDefault: true });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    return cachedLocationResult;
  }

  function initMap(center: { lat: number; lng: number }) {
    if (map) {
      map.remove();
    }

    map = L.map(mapContainer).setView([center.lat, center.lng], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);
  }

  async function findClosestForEpisode(
    restaurants: string[],
    userLat: number,
    userLng: number
  ): Promise<RestaurantLocation[] | null> {
    if (!restaurants || restaurants.length === 0) {
      return null;
    }

    try {
      const response = await fetch(
        `/api/nearby?lat=${userLat}&lng=${userLng}&restaurants=${encodeURIComponent(restaurants.join(','))}`,
        { headers: { 'Cache-Control': 'max-age=10800' } }
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const locations = data.map((place: any) => {
          const lat = place.location.latitude;
          const lng = place.location.longitude;
          const distance = getDistance(userLat, userLng, lat, lng);

          return {
            name: place.displayName?.text || restaurants[0],
            lat,
            lng,
            address: place.formattedAddress,
            distance,
          };
        });

        locations.sort(
          (a: RestaurantLocation, b: RestaurantLocation) => a.distance - b.distance
        );
        return locations;
      }
    } catch (err) {
      console.error('Error fetching nearby restaurants:', err);
    }

    let closest: RestaurantLocation | null = null;
    let closestDist = Infinity;

    for (const restaurantName of restaurants) {
      const location =
        restaurantLocations[restaurantName as keyof typeof restaurantLocations];
      if (!location) continue;

      const distance = getDistance(userLat, userLng, location.lat, location.lng);
      if (distance < closestDist) {
        closestDist = distance;
        closest = { name: restaurantName, ...location, distance };
      }
    }

    return closest ? [closest] : null;
  }

  onMount(() => {
    if (!browser) return;

    let cancelled = false;

    void (async () => {
      L = await import('leaflet');

      if (cancelled) {
        return;
      }

      const result = await getUserLocation();

      if (cancelled) {
        return;
      }

      showLocationStatus = true;
      if (result.isDefault) {
        locationStatusClass = 'location-status warning';
        locationStatusText = '⚠️ Using default Los Angeles location';
      } else {
        locationStatusClass = 'location-status success';
        locationStatusText = '📍 Using your location';
      }

      initMap(result.location);

      const restaurants = await findClosestForEpisode(
        episode.restaurants,
        result.location.lat,
        result.location.lng
      );

      if (cancelled) {
        return;
      }

      restaurantLoading = false;

      if (!restaurants || restaurants.length === 0) {
        showNoRestaurant = true;
        return;
      }

      const closest = restaurants[0]!;
      showRestaurantInfo = true;
      closestName = closest.name;
      closestDistance = `${closest.distance.toFixed(1)} miles away`;
      allRestaurants = restaurants;

      const userIcon = L.divIcon({
        className: 'user-marker',
        html: '<div style="background:#4285f4;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const restaurantIcon = L.divIcon({
        className: 'restaurant-marker',
        html: '<div style="background:#f5a623;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🍔</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([result.location.lat, result.location.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('You are here');

      const allCoords: [number, number][] = [
        [result.location.lat, result.location.lng],
      ];

      restaurants.forEach((restaurant: RestaurantLocation, index: number) => {
        const marker = L.marker([restaurant.lat, restaurant.lng], {
          icon: restaurantIcon,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${restaurant.name}</strong><br>${restaurant.address || ''}<br><em>${restaurant.distance.toFixed(1)} miles</em>`
          );

        if (index === 0) {
          marker.openPopup();
        }

        allCoords.push([restaurant.lat, restaurant.lng]);

        L.polyline(
          [
            [result.location.lat, result.location.lng],
            [restaurant.lat, restaurant.lng],
          ],
          {
            color: index === 0 ? '#f5a623' : '#888',
            weight: index === 0 ? 2 : 1,
            dashArray: '5, 10',
          }
        ).addTo(map);
      });

      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    })();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        map = null;
      }
    };
  });
</script>

<div class="main-content">
  <div class="card">
    <h2>Closest Location</h2>

    {#if showLocationStatus}
      <div class={locationStatusClass}>
        {locationStatusText}
      </div>
    {/if}

    {#if restaurantLoading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Finding closest location...</p>
      </div>
    {/if}

    {#if showRestaurantInfo}
      <div class="restaurant-info visible">
        <span class="distance-badge">{closestDistance}</span>
        <h3 class="restaurant-name">{closestName}</h3>
        <div class="restaurant-meta">
          <div class="location-list">
            {#each allRestaurants as restaurant}
              <div class="location-item">
                <span class="location-address"
                  >{restaurant.address || 'Location approximate'}</span
                >
                <span class="location-distance"
                  >{restaurant.distance.toFixed(1)} mi</span
                >
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    {#if showNoRestaurant}
      <div class="no-restaurant">
        <p>No restaurant location available for this episode</p>
      </div>
    {/if}
  </div>

  <div class="card">
    <h2>Map</h2>
    <div id="map" bind:this={mapContainer}></div>
  </div>
</div>

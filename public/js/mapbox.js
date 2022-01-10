/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibmFyaW1hbjc3IiwiYSI6ImNreG1laXI5djFwcXoyd3ViNWNwOTZ5YnoifQ.rJI6_D5ZbaqYcN6F363aUw';
  const map = new mapboxgl.Map({
    container: 'map', // ID called in HTML
    //   style: 'mapbox://styles/nariman77/ckxmew14n19bs14p3vhg48tes',
    style: 'mapbox://styles/nariman77/ckxmf4pkg69yz15nxni3dki1a',
    scrollZoom: false,
    //   center: [-118, 34],
    //   zoom: 8,
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add pop-up
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} : ${loc.description}}</P>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};

/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoiam9uZXNrYjEiLCJhIjoiY2xkcWE0MDlhMTFnbDN2cXJqM254M3IyeSJ9.WPzepKEq8EK9Jz9wPR6OdA';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/joneskb1/cldqaw9uj000r01mlf0fwhd3l',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //add marker
    const el = document.createElement('div');
    el.className = 'marker';

    // add marker
    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //extend map to include cur loc
    bounds.extend(loc.coordinates);

    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100,
      },
    });
  });
};

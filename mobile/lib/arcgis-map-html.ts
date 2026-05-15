export function getMapHtml(apiKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Rwanda AgriSense Map</title>
  <link rel="stylesheet" href="https://js.arcgis.com/4.30/esri/themes/light/main.css" />
  <script src="https://js.arcgis.com/4.30/"></script>
  <style>
    html, body, #viewDiv { padding: 0; margin: 0; height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="viewDiv"></div>
  <script>
    const apiKey = ${JSON.stringify(apiKey)};

    require([
      'esri/config',
      'esri/Map',
      'esri/views/MapView',
      'esri/layers/TileLayer',
      'esri/layers/GraphicsLayer',
      'esri/Graphic',
      'esri/geometry/Point',
      'esri/symbols/SimpleMarkerSymbol'
    ], function(esriConfig, Map, MapView, TileLayer, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol) {
      esriConfig.apiKey = apiKey;

      const map = new Map({ basemap: 'arcgis-topographic' });

      const view = new MapView({
        container: 'viewDiv',
        map: map,
        center: [29.8739, -1.9403],
        zoom: 8,
        ui: { components: ['zoom'] }
      });

      window.view = view;

      const markerLayer = new GraphicsLayer();
      map.add(markerLayer);

      const layers = {
        soilph: new TileLayer({ url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Soil_pH/MapServer', opacity: 0.6, visible: false }),
        elevation: new TileLayer({ url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer', opacity: 0.5, visible: false }),
        rainfall: new TileLayer({ url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Climate_Zones/MapServer', opacity: 0.5, visible: false }),
      };

      Object.values(layers).forEach(l => map.add(l));

      window.setLayerVisible = function(key, visible) {
        if (layers[key]) layers[key].visible = visible;
      };

      view.on('click', function(event) {
        const { latitude, longitude } = event.mapPoint;
        markerLayer.removeAll();
        markerLayer.add(new Graphic({
          geometry: new Point({ latitude, longitude }),
          symbol: new SimpleMarkerSymbol({ color: '#1B5E20', size: 12, outline: { color: 'white', width: 2 } }),
        }));
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ latitude, longitude }));
        }
      });
    });
  </script>
</body>
</html>`;
}

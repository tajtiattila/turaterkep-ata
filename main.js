var map, measureControls;
var domborzat = null;
var kontur = null;

function init(){
    map = new OpenLayers.Map('map',
            {controls: [
            new OpenLayers.Control.Permalink('permalink'),
            new OpenLayers.Control.KeyboardDefaults()],
            units: "m",
            tileSize: new OpenLayers.Size(512,512),
            projection: new OpenLayers.Projection("EPSG:900913"),
            displayProjection: new OpenLayers.Projection("EPSG:4326"),
            maxExtent: new OpenLayers.Bounds( lonToMercator(16), latToMercator(45), lonToMercator(23), latToMercator(49))
            });

    domborzat =  new OpenLayers.Layer.TUHU.SRTM("Domborzat", 
            "http://turaterkep.hostcity.hu/srtm/",  {});
    layerMapnik = new OpenLayers.Layer.TUHU.Mapnik("Turstautak.hu (by Mapnik)",
            "http://turaterkep.hostcity.hu/tiles/", {});

    layerMapnik.isBaseLayer = true;
    domborzat.isBaseLayer = false;
    domborzat.transparent= false;
    domborzat.setVisibility(true);

    map.addLayers([layerMapnik, domborzat]);

    map.addControl(new OpenLayers.Control.LayerSwitcher({title:"Réteg választó."}));


    map.addControl(new OpenLayers.Control.ScaleLine({div: document.getElementById("scale")}));

    
    map.events.register("mousemove", map, function(e) { 
        var position = this.events.getMousePosition(e);
        var LonLat = map.getLonLatFromPixel(position);
        OpenLayers.Util.getElement("coords").innerHTML = mercatorToLatDM(LonLat) + " " + mercatorToLonDM(LonLat);
    });

    var PanZoomBar = new OpenLayers.Control.PanZoomBar();
    var panel = new OpenLayers.Control.Panel({defaultControl: PanZoomBar});

    var navControl = new OpenLayers.Control.Navigation({title:'Mozgatás', zoomWheelEnabled:false});
    panel.addControls([
        PanZoomBar,
        navControl,
        new OpenLayers.Control.ZoomBox({title:"Nagyítás kijelöléssel."})
    ]);
    
    // style the sketch fancy
    var sketchSymbolizers = {
        "Point": {
            pointRadius: 4,
            graphicName: "square",
            fillColor: "#FFCC00",
            fillOpacity: 1,
            strokeWidth: 1,
            strokeOpacity: 1,
            strokeColor: "#333333"
        },
        "Line": {
            strokeWidth: 3,
            strokeOpacity: 1,
            strokeColor: "#FF1111",
            strokeDashstyle: "dash"
        }
    };
    var style = new OpenLayers.Style();
    style.addRules([
        new OpenLayers.Rule({symbolizer: sketchSymbolizers})
    ]);
    var styleMap = new OpenLayers.StyleMap({"default": style});

    var options = {
        handlerOptions: {
            style: "default", // this forces default render intent
            layerOptions: {styleMap: styleMap},
            persist: true
        },
        title: "Mérőszalag: Egy kattintás pont letételéhez, dupla kattintás befejezéshez."
    };
    measureControls = {
        line: new OpenLayers.Control.Measure(
          OpenLayers.Handler.Path, options
        )
    };

    var control;
    for(var key in measureControls) {
        control = measureControls[key];
        control.events.on({
            "measure": handleMeasurements,
            "measurepartial": handleMeasurements
        });
        panel.addControls([control]);
    }

    map.addControl(panel);
    panel.activateControl(navControl);

    mapElement = document.getElementById("map").addEventListener("mousewheel", mousewheelHandler, false);
    if(!map.getCenter()) map.setCenter(lonLatToMercator( new OpenLayers.LonLat(19.41199, 47.16085)), 7);

    document.getElementById('lineToggle').checked = false;
}

function hideshow(which){ 
  if (!document.getElementById)
  return
  if(which.style.visibility == 'visible'){
    which.style.visibility = 'hidden';
  } else {
    which.style.visibility = 'visible';
  }
}

function mousewheelHandler(e) {
  map.pan(-e.wheelDeltaX, -e.wheelDeltaY, {animate:false});
}

function calcVincenty(geometry) {
    var dist = 0;
    for (var i = 1; i < geometry.components.length; i++) {
        var first = geometry.components[i-1];
        var second = geometry.components[i];
        var merc1 = new OpenLayers.LonLat(first.x,first.y);
        var merc2 = new OpenLayers.LonLat(second.x,second.y);
        dist += OpenLayers.Util.distVincenty(new mercatorToLonLat(merc1), new mercatorToLonLat(merc2));
    }
    return dist;
}

function handleMeasurements(event) {
    var geometry = event.geometry;
    var units = event.units;
    var order = event.order;
    var measure = event.measure;
    var element = document.getElementById('output');
    var out = "";
    if(order == 1) {
        out += calcVincenty(geometry).toFixed(3) + " km";
    } else {
        out += calcVincenty(geometry).toFixed(3) + " km<sup>2</" + "sup>";
    }
    element.innerHTML = out;
}

function toggleControl(element) {
    for(key in measureControls) {
        var control = measureControls[key];
        if(element.checked) {
            control.activate();
        } else {
            control.deactivate();
        }
    }
}

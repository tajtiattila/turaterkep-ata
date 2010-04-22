
/**
 * Namespace: Util.TUHU
 */
OpenLayers.Util.TUHU = {};

/**
 * Constant: MISSING_TILE_URL
 * {String} URL of image to display for missing tiles
 */
OpenLayers.Util.TUHU.MISSING_TILE_URL = "404.png";

/**
 * Property: originalOnImageLoadError
 * {Function} Original onImageLoadError function.
 */
OpenLayers.Util.TUHU.originalOnImageLoadError = OpenLayers.Util.onImageLoadError;

/**
 * Function: onImageLoadError
 */
OpenLayers.Util.onImageLoadError = function() {
    if ((this.src.match(/^http:\/\/terkep\.hostcity\.hu\//))||(this.src.match(/^http:\/\/turaterkep\.hostcity\.hu\//))) {
        this.src = OpenLayers.Util.TUHU.MISSING_TILE_URL;
    } else if ((this.src.match(/^http:\/\terkep\.hostcity\.hu\//))||(this.src.match(/^http:\/\/turaterkep\.hostcity\.hu\//))) {
        // do nothing - this layer is transparent
    } else {
        OpenLayers.Util.TUHU.originalOnImageLoadError;
    }
};

function lonToMercator(lon) {
  return lon * 20037508.34 / 180;
}

function latToMercator(lat) {
  var lat = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
  return lat * 20037508.34 / 180;

}

function mercatorToLonLat(merc) {
   var lon = (merc.lon / 20037508.34) * 180;
   var lat = (merc.lat / 20037508.34) * 180;

   lat = 180/Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);

   return new OpenLayers.LonLat(lon, lat);
}

function mercatorToLonDM(merc) {
   var lonpref = "E";
   var lon = (merc.lon / 20037508.34) * 180;
   if (lon < 0){
     lonpref = "W";
   }
   var lond = Math.floor(Math.abs(lon));
   var lonm = (lon-lond)*60;
   var lonmc = Math.floor(lonm);
   if (lonmc<10){
     var lonms = "0" + lonm.toString().substring(0,5);
    } else {
     var lonms = lonm.toString().substring(0,6);
    }

   return lonpref + lond.toString() + "°" + lonms;
}

function mercatorToLatDM(merc) {
   var latpref = "N";
   var lat = (merc.lat / 20037508.34) * 180;
   lat = 180/Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
   if(lat < 0){ 
     latpref = "S";
   }
   var latd = Math.floor(Math.abs(lat));
   var latm = (lat-latd)*60;
   var latmc = Math.floor(latm);
   if (latmc<10){
     var latms = "0" + latm.toString().substring(0,5);
    } else {
     var latms = latm.toString().substring(0,6);
    }
   return latpref + latd.toString() + "°" + latms;
}

function lonLatToMercator(ll) {
   var lon = lonToMercator(ll.lon);
   var lat = latToMercator(ll.lat);
   return new OpenLayers.LonLat(lon, lat);
}

function scaleToZoom(scale) {
   return Math.log(360.0/(scale * 512.0)) / Math.log(2.0);
}

/**
 * @requires OpenLayers/Layer/TMS.js
 *
 * Class: OpenLayers.Layer.TUHU
 *
 * Inherits from:
 *  - <OpenLayers.Layer.TMS>
 */
OpenLayers.Layer.TUHU = OpenLayers.Class(OpenLayers.Layer.TMS, {
    /**
     * Constructor: OpenLayers.Layer.TUHU
     *
     * Parameters:
     * name - {String}
     * url - {String}
     * options - {Object} Hashtable of extra options to tag onto the layer
     */

    initialize: function(name, url, options) {
        options = OpenLayers.Util.extend({
            attribution: "Data by <a href='http://turistautak.hu/'>Turistautak.hu</a>",
            maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
            restrictedExtent: new OpenLayers.Bounds(lonToMercator(16), latToMercator(45), lonToMercator(23), latToMercator(49)),
            maxResolution: 156543.0339,
            units: "m",
            projection: "EPSG:900913",
			numZoomLevels: 17,
            transitionEffect: "resize"
        }, options);
        var newArguments = [name, url, options];
        OpenLayers.Layer.TMS.prototype.initialize.apply(this, newArguments);
    },

    /**
     * Method: getUrl
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     *
     * Returns:
     * {String} A string with the layer's url and parameters and also the
     *          passed-in bounds and appropriate tile size specified as
     *          parameters
     */
    getURL: function (bounds) {
        var res = this.map.getResolution();
        var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
        var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
        var z = this.map.getZoom();
        var limit = Math.pow(2, z);

        if (y < 0 || y >= limit)
        {
            return OpenLayers.Util.TUHU.MISSING_TILE_URL;
        }
        else
        {
            x = ((x % limit) + limit) % limit;

            var url = this.url;
            var path = z + "/" + x + "/" + y + ".png";

            if (url instanceof Array)
            {
                url = this.selectUrl(path, url);
            }

            return url + path;
        }
    },

    CLASS_NAME: "OpenLayers.Layer.TUHU"
});


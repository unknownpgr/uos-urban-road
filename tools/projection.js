const proj4 = require('proj4');

var from = 'TM128-2';
var to = 'WGS84';

// proj4.defs('WGS84', "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");
proj4.defs('TM128-1', '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43');
proj4.defs('TM128-2', '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +elips=bessel +towgs84=-146.43,507.89,681.46 +units=m +no_defs');
proj4.defs('WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
proj4.defs('EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs');
proj4.defs('EPSG:32651', '+proj=utm +zone=51 +ellps=WGS84 +datum=WGS84 +units=m +no_defs');

var xy = [469600, 197500];
var result = proj4(from, to, xy);
console.log(result[1], result[0]);

var xy = [197500, 469600];
var result = proj4(from, to, xy);
console.log(result[1], result[0]);
INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-26877100',
  'Marina 26877100',
  51.2045238,
  -114.7598,
  '26877100',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-28578699',
  'Otter Creek Marina',
  41.8434103,
  -83.4050071,
  '28578699',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-28578728',
  'Marina 28578728',
  41.8432473,
  -83.4118271,
  '28578728',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-30308443',
  'Toledo Beach Marina',
  41.8278675,
  -83.4122133,
  '30308443',
  'node',
  'https://shmarinas.com/locations/safe-harbor-toledo-beach/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-30308444',
  'North Cape Yacht Club',
  41.8290507,
  -83.4105933,
  '30308444',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-105020139',
  'Key Harbor Marina',
  39.7718274,
  -74.1874812,
  '105020139',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-155110335',
  'Bay Head Marina',
  48.5987635,
  -122.9370182,
  '155110335',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-214170927',
  'Surfside 3 Modern Yachts',
  40.8912562,
  -72.5033869,
  '214170927',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-259182700',
  'Marina 259182700',
  25.7936374,
  -80.145076,
  '259182700',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-262025467',
  'Marina 262025467',
  37.7193681,
  -84.7374567,
  '262025467',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-262032799',
  'Marina 262032799',
  37.7251508,
  -84.7183967,
  '262032799',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-262032805',
  'Marina 262032805',
  37.7448932,
  -84.7028832,
  '262032805',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-262032808',
  'Marina 262032808',
  37.7507189,
  -84.7056882,
  '262032808',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-262032814',
  'Kamp Kennedy Marina',
  37.7501434,
  -84.7021705,
  '262032814',
  'node',
  'https://kampkennedymarina.com',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-262032815',
  'Marina 262032815',
  37.7554441,
  -84.6984385,
  '262032815',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-262032819',
  'Marina 262032819',
  37.757688,
  -84.7198854,
  '262032819',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-270612804',
  'Marina 270612804',
  36.9920888,
  -88.2856915,
  '270612804',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-270612805',
  'Marina 270612805',
  37.0004383,
  -88.2400725,
  '270612805',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-278684664',
  'Marina 278684664',
  41.4955689,
  -73.4652972,
  '278684664',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-280310653',
  'Terminal marítima',
  20.6541864,
  -105.240749,
  '280310653',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-287493909',
  'Marina 287493909',
  42.3007027,
  -82.7090109,
  '287493909',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-292656815',
  'Huntsville Marine',
  45.3386717,
  -79.1849416,
  '292656815',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-293250076',
  'Marina 293250076',
  44.1952614,
  -76.4389607,
  '293250076',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-308414956',
  'Marina 308414956',
  48.5853251,
  -122.8146523,
  '308414956',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-317964605',
  'Marjorie Park Marina',
  27.9308144,
  -82.4538468,
  '317964605',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-320986962',
  'Pleasant Harbor Marina',
  33.8527313,
  -112.2593931,
  '320986962',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-338280540',
  'Harilla Landing',
  43.6404996,
  -71.3399555,
  '338280540',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-339956361',
  'Tacoma Sea Scout Base',
  47.255492,
  -122.432371,
  '339956361',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-356541611',
  'Newport Yacht Basin',
  47.5760304,
  -122.187912,
  '356541611',
  'node',
  'http://www.newportyachtbasin.com/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-356709230',
  'Juniper Cove Marina',
  31.9833564,
  -97.3706754,
  '356709230',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-356846419',
  'Grandpappy Point Resort and Marina',
  33.8507318,
  -96.6418377,
  '356846419',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-357320171',
  'Port of Brookings',
  42.047615,
  -124.268352,
  '357320171',
  'node',
  'https://www.port-brookings-harbor.com/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-357717939',
  'Alpine Boat Basin',
  40.9458333,
  -73.9183333,
  '357717939',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-357974863',
  'Biloxi Small Craft Harbor',
  30.3916504,
  -88.8842527,
  '357974863',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-358650149',
  'Buffington Harbor',
  41.6436345,
  -87.4146231,
  '358650149',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-358765400',
  'Glen Cove Marina',
  38.0668688,
  -122.2132808,
  '358765400',
  'node',
  'https://glencovemarina.net/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-358777087',
  'Highland Marina Resort',
  33.0590886,
  -85.1095587,
  '358777087',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-358796100',
  'Marina Bay',
  37.910561,
  -122.352058,
  '358796100',
  'node',
  'https://www.mbyh.com/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-358829677',
  'East Basin',
  33.4591946,
  -117.696163,
  '358829677',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-358829720',
  'West Basin',
  33.4603057,
  -117.7017187,
  '358829720',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-358833332',
  'Waldo Point Harbor',
  37.8733362,
  -122.5024787,
  '358833332',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-367818647',
  'Palm Bay Club',
  25.8379117,
  -80.1799021,
  '367818647',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-367907117',
  'Spooners Creek Marina',
  34.7265592,
  -76.8056416,
  '367907117',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-368943612',
  'Richmond Yacht Basin',
  37.3911608,
  -77.3631849,
  '368943612',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-369021430',
  'Hammond Bay State Harbor',
  45.5904203,
  -84.1614806,
  '369021430',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-369144146',
  'Bartlett Cove Marina',
  58.4552661,
  -135.8859012,
  '369144146',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-369163340',
  'Point San Pablo Yacht Harbor',
  37.9635493,
  -122.4180667,
  '369163340',
  'node',
  'https://www.pspharbor.com/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-370725901',
  'Lindon Marina',
  40.3275426,
  -111.7653232,
  '370725901',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-375822258',
  'Houston Yacht Club',
  29.6180857,
  -95.0008375,
  '375822258',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-378346537',
  'Club Nautico De Santo Domingo',
  18.4449753,
  -69.6266902,
  '378346537',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-382497807',
  'Marina 382497807',
  43.7074931,
  -79.2308156,
  '382497807',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-385027413',
  'Bronte Outer Harbour Marina',
  43.3941739,
  -79.7038821,
  '385027413',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-412045305',
  'Marina 412045305',
  43.8139795,
  -79.0834347,
  '412045305',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-412051153',
  'Marina 412051153',
  43.8136908,
  -79.0958004,
  '412051153',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-412338625',
  'Marina 412338625',
  40.4694442,
  -75.2241336,
  '412338625',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-420913719',
  'Deebold Marina',
  39.4101457,
  -74.3698512,
  '420913719',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-435638116',
  'Marina 435638116',
  49.9804367,
  -124.7624084,
  '435638116',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-441285510',
  'Marina 441285510',
  44.6781794,
  -76.3932857,
  '441285510',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-442122035',
  'Cherry Point Marina',
  48.7353789,
  -123.5900901,
  '442122035',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-448439355',
  'Fischer''s Marina',
  43.4739596,
  -73.6277022,
  '448439355',
  'node',
  'https://www.fischersmarina.org/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-448459802',
  'Henderson''s Marina',
  43.4739845,
  -73.6402828,
  '448459802',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-452129995',
  'Crown Bay Marina',
  18.3339885,
  -64.9522155,
  '452129995',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-453040017',
  'American Yacht Harbor',
  18.3252689,
  -64.8520709,
  '453040017',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-465050216',
  'Harbour Cove Marina',
  39.3136512,
  -74.5905611,
  '465050216',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-465077626',
  'Smith''s Marina',
  39.3092417,
  -74.5958998,
  '465077626',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-465080186',
  'Somers Point Marina',
  39.3098792,
  -74.5951187,
  '465080186',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-471528758',
  'Marina 471528758',
  44.5712067,
  -76.0001949,
  '471528758',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-471528761',
  'Kelsey''s Marina LTD',
  44.5724349,
  -76.0011777,
  '471528761',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-474829263',
  'Brewer Marine South Freeport',
  43.8208965,
  -70.1050331,
  '474829263',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-475870705',
  'Marina de Hull',
  45.4318127,
  -75.7070611,
  '475870705',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-479600485',
  'Marina 479600485',
  48.1003235,
  -66.1289473,
  '479600485',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-480968614',
  'Marina Cayo Largo',
  21.6227786,
  -81.5642172,
  '480968614',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-487046069',
  'Bethlehem Boating Club',
  40.6416767,
  -75.2830249,
  '487046069',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-523116583',
  'Barr Lake Boat Ramp',
  39.9480258,
  -104.7490155,
  '523116583',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-526600018',
  'Marina de Baie St-Paul',
  47.4321485,
  -70.4917238,
  '526600018',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-528616146',
  'Marina 528616146',
  36.3724522,
  -92.250759,
  '528616146',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-528616147',
  'Marina 528616147',
  36.3734197,
  -92.2330779,
  '528616147',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-528616148',
  'Marina 528616148',
  36.3713464,
  -92.228958,
  '528616148',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-528616149',
  'Marina 528616149',
  36.4065846,
  -92.2478407,
  '528616149',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-529176707',
  'Marina 529176707',
  44.2238622,
  -76.4843972,
  '529176707',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-529176709',
  'Marina 529176709',
  44.2361211,
  -76.4792921,
  '529176709',
  'node',
  'https://www.kingstonmarina.ca/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-529602194',
  'Marina 529602194',
  44.2598106,
  -76.3711824,
  '529602194',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-529602195',
  'Peck''s Marina',
  44.3592952,
  -76.021586,
  '529602195',
  'node',
  'http://pecksmarina.ca/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-529602196',
  'Marina 529602196',
  44.3552491,
  -76.0294394,
  '529602196',
  'node',
  'https://ivyleaclub.ca/ivy-lea-marina/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-529602199',
  'Marina 529602199',
  44.2581016,
  -76.4796442,
  '529602199',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-529602200',
  'Trident Yacht Club',
  44.3052197,
  -76.2593908,
  '529602200',
  'node',
  'https://trident-yc.ca/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-529602201',
  'Clark''s Marina',
  44.3222296,
  -76.2078548,
  '529602201',
  'node',
  'https://clarksmarina.ca/',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-529602203',
  'Marina 529602203',
  44.4382537,
  -76.3881201,
  '529602203',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-555443325',
  'Marina 555443325',
  43.657046,
  -79.3088285,
  '555443325',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-555443333',
  'Bluffer''s Park Yacht Club',
  43.7092917,
  -79.2289145,
  '555443333',
  'node',
  'https://bpyc.on.ca/area.html',
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-555443338',
  'Marina 555443338',
  43.6339904,
  -79.4414449,
  '555443338',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-558604491',
  'Marina 558604491',
  43.5501737,
  -79.5844235,
  '558604491',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-558604492',
  'Marina 558604492',
  43.7465092,
  -79.7335061,
  '558604492',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-558655950',
  'Marina 558655950',
  43.4412035,
  -79.6685039,
  '558655950',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-558756149',
  'Royal Hamilton Yacht Club',
  43.2755218,
  -79.8631144,
  '558756149',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-558756150',
  'Bronte Harbour',
  43.3932783,
  -79.7103354,
  '558756150',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-558756152',
  'Marina 558756152',
  43.2716497,
  -79.8689205,
  '558756152',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-558756153',
  'Marina 558756153',
  43.3005393,
  -79.8442496,
  '558756153',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-574257205',
  'Bob''s Marina',
  39.4097282,
  -74.3720698,
  '574257205',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();

INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  'osm-node-576008859',
  'Jolly Roger Marina',
  39.3965711,
  -74.3876378,
  '576008859',
  'node',
  NULL,
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();
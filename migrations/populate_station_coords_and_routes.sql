-- Populate station_coordinates for all events that don't have them
-- Uses a standard HYROX layout (8 stations + start/finish + roxzone)
-- arranged in an oval pattern typical of HYROX venue layouts

UPDATE hyrox_events
SET station_coordinates = '{
  "start_finish": {"x": 50, "y": 92, "name": "Start / Finish"},
  "station_1": {"x": 20, "y": 78, "name": "SkiErg"},
  "station_2": {"x": 15, "y": 58, "name": "Sled Push"},
  "station_3": {"x": 20, "y": 38, "name": "Sled Pull"},
  "station_4": {"x": 35, "y": 18, "name": "Burpee Broad Jump"},
  "station_5": {"x": 65, "y": 18, "name": "Rowing"},
  "station_6": {"x": 80, "y": 38, "name": "Farmers Carry"},
  "station_7": {"x": 85, "y": 58, "name": "Sandbag Lunges"},
  "station_8": {"x": 80, "y": 78, "name": "Wall Balls"},
  "roxzone": {"x": 50, "y": 50, "name": "Roxzone"}
}'::jsonb
WHERE station_coordinates IS NULL;

-- Populate event_name from name for any events missing it
UPDATE hyrox_events
SET event_name = name
WHERE event_name IS NULL AND name IS NOT NULL;

-- Generate synthetic route GeoJSON for events that have lat/lng but no route
-- Creates an oval loop centered on the venue (~200m radius)
-- approximating a HYROX course layout
UPDATE hyrox_events
SET route_geojson = jsonb_build_object(
  'type', 'LineString',
  'coordinates', jsonb_build_array(
    -- Start/Finish (south)
    jsonb_build_array(venue_longitude, venue_latitude - 0.0016),
    -- SE curve
    jsonb_build_array(venue_longitude + 0.001, venue_latitude - 0.0014),
    -- Station 1 area (east-south)
    jsonb_build_array(venue_longitude + 0.0016, venue_latitude - 0.0008),
    -- Station 2 area (east)
    jsonb_build_array(venue_longitude + 0.0018, venue_latitude),
    -- Station 3 area (east-north)
    jsonb_build_array(venue_longitude + 0.0016, venue_latitude + 0.0008),
    -- NE curve
    jsonb_build_array(venue_longitude + 0.001, venue_latitude + 0.0014),
    -- Station 4 area (north-east)
    jsonb_build_array(venue_longitude + 0.0004, venue_latitude + 0.0016),
    -- Station 5 area (north)
    jsonb_build_array(venue_longitude - 0.0004, venue_latitude + 0.0016),
    -- NW curve
    jsonb_build_array(venue_longitude - 0.001, venue_latitude + 0.0014),
    -- Station 6 area (west-north)
    jsonb_build_array(venue_longitude - 0.0016, venue_latitude + 0.0008),
    -- Station 7 area (west)
    jsonb_build_array(venue_longitude - 0.0018, venue_latitude),
    -- Station 8 area (west-south)
    jsonb_build_array(venue_longitude - 0.0016, venue_latitude - 0.0008),
    -- SW curve
    jsonb_build_array(venue_longitude - 0.001, venue_latitude - 0.0014),
    -- Close the loop back to start
    jsonb_build_array(venue_longitude, venue_latitude - 0.0016)
  )
)
WHERE venue_latitude IS NOT NULL
  AND venue_longitude IS NOT NULL
  AND route_geojson IS NULL;

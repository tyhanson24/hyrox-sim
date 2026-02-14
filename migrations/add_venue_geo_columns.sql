-- Migration: add_venue_geo_columns
-- Adds geographic coordinate columns for satellite map and geocoding support

ALTER TABLE hyrox_events ADD COLUMN IF NOT EXISTS venue_latitude DOUBLE PRECISION;
ALTER TABLE hyrox_events ADD COLUMN IF NOT EXISTS venue_longitude DOUBLE PRECISION;
ALTER TABLE hyrox_events ADD COLUMN IF NOT EXISTS route_geojson JSONB;

-- Index for geographic queries (only on rows that have coordinates)
CREATE INDEX IF NOT EXISTS idx_hyrox_events_geo
  ON hyrox_events(venue_latitude, venue_longitude)
  WHERE venue_latitude IS NOT NULL;

-- Comment the columns
COMMENT ON COLUMN hyrox_events.venue_latitude IS 'Venue geographic latitude (from geocoding)';
COMMENT ON COLUMN hyrox_events.venue_longitude IS 'Venue geographic longitude (from geocoding)';
COMMENT ON COLUMN hyrox_events.route_geojson IS 'GeoJSON LineString of the race route (for map overlays)';

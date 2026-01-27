-- Enable realtime for regattas table
-- This allows the app to subscribe to INSERT, UPDATE, DELETE events on regattas
ALTER PUBLICATION supabase_realtime ADD TABLE regattas;

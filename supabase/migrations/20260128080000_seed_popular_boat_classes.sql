-- Seed popular sail racing boat classes
-- Covers Olympic classes, one-design keelboats, sport boats, dinghies, and multihulls

-- Add unique constraint on name so ON CONFLICT works (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS boat_classes_name_unique ON boat_classes (name);

INSERT INTO boat_classes (name, class_association, metadata) VALUES

-- === Olympic & Olympic-pathway classes ===
('ILCA 7 (Laser)', 'International Laser Class Association', '{"type":"dinghy","crew":1,"olympic":true,"aka":"Laser Standard","loa_m":4.23}'::jsonb),
('ILCA 6 (Laser Radial)', 'International Laser Class Association', '{"type":"dinghy","crew":1,"olympic":true,"aka":"Laser Radial","loa_m":4.23}'::jsonb),
('ILCA 4 (Laser 4.7)', 'International Laser Class Association', '{"type":"dinghy","crew":1,"olympic":false,"aka":"Laser 4.7","loa_m":4.23}'::jsonb),
('49er', 'International 49er Class Association', '{"type":"skiff","crew":2,"olympic":true,"loa_m":4.99}'::jsonb),
('49er FX', 'International 49er Class Association', '{"type":"skiff","crew":2,"olympic":true,"loa_m":4.99}'::jsonb),
('Nacra 17', 'Nacra Class Association', '{"type":"multihull","crew":2,"olympic":true,"loa_m":5.25}'::jsonb),
('470', 'International 470 Class Association', '{"type":"dinghy","crew":2,"olympic":true,"loa_m":4.70}'::jsonb),
('iQFoil', 'iQFoil Class', '{"type":"windsurf","crew":1,"olympic":true}'::jsonb),
('IKA Formula Kite', 'International Kiteboarding Association', '{"type":"kite","crew":1,"olympic":true}'::jsonb),

-- === One-design keelboats ===
('J/70', 'J/70 Class Association', '{"type":"keelboat","crew":5,"one_design":true,"loa_m":6.93}'::jsonb),
('J/80', 'J/80 Class Association', '{"type":"keelboat","crew":5,"one_design":true,"loa_m":8.00}'::jsonb),
('J/105', 'J/105 Class Association', '{"type":"keelboat","crew":6,"one_design":true,"loa_m":10.52}'::jsonb),
('J/24', 'International J/24 Class Association', '{"type":"keelboat","crew":5,"one_design":true,"loa_m":7.32}'::jsonb),
('J/22', 'J/22 Class Association', '{"type":"keelboat","crew":3,"one_design":true,"loa_m":6.71}'::jsonb),
('J/109', 'J/109 Class Association', '{"type":"keelboat","crew":7,"one_design":true,"loa_m":10.92}'::jsonb),
('Etchells', 'International Etchells Class Association', '{"type":"keelboat","crew":3,"one_design":true,"loa_m":9.30}'::jsonb),
('Sonar', 'International Sonar Class Association', '{"type":"keelboat","crew":3,"one_design":true,"loa_m":7.00}'::jsonb),
('Star', 'International Star Class Yacht Racing Association', '{"type":"keelboat","crew":2,"one_design":true,"loa_m":6.92}'::jsonb),
('Dragon', 'International Dragon Class Association', '{"type":"keelboat","crew":3,"one_design":true,"loa_m":8.90}'::jsonb),
('Melges 24', 'International Melges 24 Class Association', '{"type":"sport_boat","crew":5,"one_design":true,"loa_m":7.32}'::jsonb),
('Melges 20', 'Melges 20 Class Association', '{"type":"sport_boat","crew":3,"one_design":true,"loa_m":6.10}'::jsonb),
('Melges 32', 'Melges 32 Class Association', '{"type":"sport_boat","crew":6,"one_design":true,"loa_m":9.75}'::jsonb),
('Viper 640', 'Viper 640 Class Association', '{"type":"sport_boat","crew":3,"one_design":true,"loa_m":6.40}'::jsonb),
('VX One', 'VX One Class Association', '{"type":"sport_boat","crew":3,"one_design":true,"loa_m":5.94}'::jsonb),
('RS21', 'RS Sailing', '{"type":"keelboat","crew":5,"one_design":true,"loa_m":6.40}'::jsonb),
('SB20', 'SB20 Class Association', '{"type":"sport_boat","crew":3,"one_design":true,"loa_m":6.15}'::jsonb),
('Beneteau First 36.7', 'First 36.7 Class Association', '{"type":"keelboat","crew":7,"one_design":true,"loa_m":11.22}'::jsonb),

-- === Popular dinghies ===
('Optimist', 'International Optimist Dinghy Association', '{"type":"dinghy","crew":1,"one_design":true,"youth":true,"loa_m":2.30}'::jsonb),
('420', 'International 420 Class Association', '{"type":"dinghy","crew":2,"one_design":true,"loa_m":4.20}'::jsonb),
('29er', 'International 29er Class Association', '{"type":"skiff","crew":2,"one_design":true,"youth":true,"loa_m":4.35}'::jsonb),
('RS Feva', 'RS Sailing', '{"type":"dinghy","crew":2,"one_design":true,"youth":true,"loa_m":3.64}'::jsonb),
('RS Aero', 'RS Sailing', '{"type":"dinghy","crew":1,"one_design":true,"loa_m":4.01}'::jsonb),
('Snipe', 'Snipe Class International Racing Association', '{"type":"dinghy","crew":2,"one_design":true,"loa_m":4.72}'::jsonb),
('Sunfish', 'International Sunfish Class Association', '{"type":"dinghy","crew":1,"one_design":true,"loa_m":4.19}'::jsonb),
('Finn', 'International Finn Class Association', '{"type":"dinghy","crew":1,"one_design":true,"loa_m":4.50}'::jsonb),
('505', 'International 505 Class Association', '{"type":"dinghy","crew":2,"one_design":true,"loa_m":5.05}'::jsonb),
('Fireball', 'International Fireball Class Association', '{"type":"dinghy","crew":2,"one_design":true,"loa_m":4.93}'::jsonb),
('Flying Dutchman', 'International Flying Dutchman Class Association', '{"type":"dinghy","crew":2,"one_design":true,"loa_m":6.05}'::jsonb),
('Topper', 'International Topper Class', '{"type":"dinghy","crew":1,"one_design":true,"youth":true,"loa_m":3.40}'::jsonb),
('Moth', 'International Moth Class Association', '{"type":"dinghy","crew":1,"foiling":true,"loa_m":3.35}'::jsonb),
('Waszp', 'WASZP Class', '{"type":"dinghy","crew":1,"foiling":true,"one_design":true,"loa_m":3.35}'::jsonb),
('OK Dinghy', 'OK Dinghy International Association', '{"type":"dinghy","crew":1,"one_design":true,"loa_m":4.00}'::jsonb),
('Europe', 'International Europe Class', '{"type":"dinghy","crew":1,"one_design":true,"loa_m":3.35}'::jsonb),
('Mirror', 'International Mirror Class Association', '{"type":"dinghy","crew":2,"one_design":true,"youth":true,"loa_m":3.30}'::jsonb),
('Laser 2000', 'Laser 2000 Class Association', '{"type":"dinghy","crew":2,"one_design":true,"loa_m":4.39}'::jsonb),

-- === Multihulls ===
('Hobie 16', 'Hobie Class Association', '{"type":"multihull","crew":2,"one_design":true,"loa_m":5.05}'::jsonb),
('Hobie Wave', 'Hobie Class Association', '{"type":"multihull","crew":2,"one_design":true,"youth":true,"loa_m":3.96}'::jsonb),
('F18', 'International Formula 18 Class Association', '{"type":"multihull","crew":2,"one_design":false,"loa_m":5.52}'::jsonb),
('Dart 18', 'Dart 18 Class Association', '{"type":"multihull","crew":2,"one_design":true,"loa_m":5.49}'::jsonb),
('A-Class Catamaran', 'International A-Class Catamaran Association', '{"type":"multihull","crew":1,"foiling":true,"loa_m":5.49}'::jsonb),
('Tornado', 'International Tornado Class Association', '{"type":"multihull","crew":2,"one_design":true,"loa_m":6.10}'::jsonb),

-- === Offshore / handicap racing ===
('Farr 40', 'Farr 40 Class Association', '{"type":"keelboat","crew":11,"one_design":true,"loa_m":12.19}'::jsonb),
('TP52', 'TP52 Class', '{"type":"keelboat","crew":14,"one_design":true,"loa_m":15.85}'::jsonb),
('IRC (rated)', 'Royal Ocean Racing Club', '{"type":"handicap","crew":null,"one_design":false,"rating_system":"IRC"}'::jsonb),
('ORC (rated)', 'Offshore Racing Congress', '{"type":"handicap","crew":null,"one_design":false,"rating_system":"ORC"}'::jsonb),
('PHRF (rated)', 'US Sailing', '{"type":"handicap","crew":null,"one_design":false,"rating_system":"PHRF"}'::jsonb),
('Clipper 70', 'Clipper Race', '{"type":"keelboat","crew":18,"one_design":true,"loa_m":21.34}'::jsonb),
('Volvo 65', 'The Ocean Race', '{"type":"keelboat","crew":8,"one_design":true,"loa_m":19.81}'::jsonb),
('IMOCA 60', 'IMOCA', '{"type":"keelboat","crew":1,"foiling":true,"loa_m":18.28}'::jsonb),
('Mini 6.50', 'Classe Mini', '{"type":"keelboat","crew":1,"one_design":false,"loa_m":6.50}'::jsonb),
('Class40', 'Class40', '{"type":"keelboat","crew":2,"one_design":false,"loa_m":12.19}'::jsonb),

-- === Foiling / high performance ===
('SailGP F50', 'SailGP', '{"type":"multihull","crew":5,"foiling":true,"loa_m":15.24}'::jsonb),
('AC75', 'Americas Cup', '{"type":"monohull","crew":11,"foiling":true,"loa_m":22.86}'::jsonb),
('AC40', 'Americas Cup', '{"type":"monohull","crew":4,"foiling":true,"loa_m":12.19}'::jsonb),
('ETF26', 'ETF26 Class', '{"type":"multihull","crew":4,"foiling":true,"loa_m":7.92}'::jsonb),
('69F', '69F Class', '{"type":"multihull","crew":4,"foiling":true,"one_design":true,"loa_m":6.90}'::jsonb)

ON CONFLICT (name) DO UPDATE SET
  class_association = EXCLUDED.class_association,
  metadata = EXCLUDED.metadata;

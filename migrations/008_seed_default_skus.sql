INSERT INTO skus (brand, size, is_carton, units_per_carton)
VALUES
  ('King''s Oil', '1L', false, 12),
  ('Mamador', '1L', false, 12),
  ('Golden Terra', '1L', false, 12),
  ('Devon Kings', '1L', false, 12),
  ('Golden Penny', '1L', false, 12),
  ('Power Oil', '1L', false, 12),
  ('Gino', '1L', false, 12),
  ('Soya Gold', '1L', false, 12),
  ('Tropical', '1L', false, 12),
  ('Grand Pure', '1L', false, 12)
ON CONFLICT (brand, size, is_carton) DO NOTHING;

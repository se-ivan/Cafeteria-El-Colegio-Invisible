-- Seed data for "El Colegio Invisible" POS System

-- Insert admin user (password: admin123 - bcrypt hash)
INSERT INTO users (id, email, password, name, role) VALUES
  ('admin001', 'admin@colegioinvisible.com', '$2a$10$rQZQj6J3YQZwqKqp3qKqp.qKqp3qKqp3qKqp3qKqp3qKqp3qKqpC', 'Administrador', 'ADMIN'),
  ('cajero001', 'cajero@colegioinvisible.com', '$2a$10$rQZQj6J3YQZwqKqp3qKqp.qKqp3qKqp3qKqp3qKqp3qKqp3qKqpC', 'Cajero Principal', 'CASHIER');

-- Insert categories
INSERT INTO categories (id, name, sort_order) VALUES
  ('cat001', 'DESAYUNOS', 1),
  ('cat002', 'CHAPATAS & OTROS', 2),
  ('cat003', 'POSTRES', 3),
  ('cat004', 'BEBIDAS', 4),
  ('cat005', 'PEDIDOS PARA LLEVAR', 5);

-- Insert all supplies from inventory list
INSERT INTO supplies (id, name, quantity, unit, reorder_point, status) VALUES
  ('sup001', 'LECHE DESLACTOSADA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup002', 'LECHE ENTERA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup003', 'POLVO FRAPPE', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup004', 'POLVO TARO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup005', 'POLVO RED VELVET', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup006', 'POLVO COOKIES AND CREAM', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup007', 'CREMA BATIDA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup008', 'MANGO CONGELADO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup009', 'FRUTOS ROJOS CONGELADOS', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup010', 'HARINA PARA CREPA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup011', 'CAFÉ DESCAFEINADO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup012', 'POLVO DE CARNATION', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup013', 'LECHE NIDO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup014', 'POLVO COFFE MATE', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup015', 'CROTONES', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup016', 'GALLETAS OREO', 4, 'unidad', 4, 'LOW'),
  ('sup017', 'MIEL MAPLE', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup018', 'MANTEQUILLA DE MANÍ', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup019', 'YOGURTH NATURAL', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup020', 'PLATANO', 4, 'unidad', 4, 'LOW'),
  ('sup021', 'NUTELLA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup022', 'AGUA MINERAL', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup023', 'REFRESCOS', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup024', 'JUGO MINI', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup025', 'SALAMI', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup026', 'JAMON', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup027', 'PEPERONI', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup028', 'MANTEQUILLA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup029', 'QUESO PHILADELPHIA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup030', '3 QUESOS', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup031', 'AGUA EMBOTELLADA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup032', 'COCA COLA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup033', 'MERMELADA DE FRESA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup034', 'MERMELADA DE FRUTOS ROJOS', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup035', 'MERMELADA DE ARANDANOS', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup036', 'TÉ DE MANZANILLA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup037', 'TÉ NEGRO CON DURAZNO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup038', 'JARABE MOKA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup039', 'JARABE FRUTOS ROJOS', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup040', 'JARABE AVELLANA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup041', 'JARABE CREMA IRLANDESA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup042', 'JARABE MORA AZUL', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup043', 'JARABE MANGO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup044', 'JARABE FRESA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup045', 'POLVO MATCHA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup046', 'CRANBERRY', 4, 'unidad', 4, 'LOW'),
  ('sup047', 'AGUA DE COCO CALAHUA', 4, 'unidad', 4, 'LOW'),
  ('sup048', 'LECHERA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup049', 'LECHE EVAPORADA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup050', 'VALENTINA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup051', 'KETCHUP', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup052', 'RANCH', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup053', 'MAYONESA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup054', 'MOSTAZA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup055', 'HERSHEYS COCOA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup056', 'EXTRACTO DE VAINILLA', 4, 'unidad', 4, 'LOW'),
  ('sup057', 'CHOCOLATE LIQUIDO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup058', 'TÉ GENGIBRE Y LIMÓN', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup059', 'TÉ BLANCO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup060', 'TÉ LAVANDA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup061', 'TÉ SANCHA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup062', 'TÉ VERDE', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup063', 'HARINA PARA STRUDEL', 0, 'unidad', 4, 'OUT'),
  ('sup064', 'CHAROLA PARA CREPA', 0, 'unidad', 4, 'OUT'),
  ('sup065', 'VASOS DESECHABLES', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup066', 'TAPAS PARA VASOS', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup067', 'POPOTES', 4, 'unidad', 4, 'LOW'),
  ('sup068', 'CUCHARAS DESECHABLES', 4, 'unidad', 4, 'LOW'),
  ('sup069', 'DESECHABLES PARA LLEVAR', 4, 'unidad', 4, 'LOW'),
  -- Additional supplies for recipes
  ('sup070', 'HUEVOS', 10, 'unidad', 4, 'AVAILABLE'),
  ('sup071', 'TORTILLA DE MAÍZ', 10, 'unidad', 4, 'AVAILABLE'),
  ('sup072', 'FRIJOLES REFRITOS', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup073', 'SALSA VERDE', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup074', 'SALSA ROJA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup075', 'QUESO FRESCO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup076', 'CREMA ÁCIDA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup077', 'POLLO DESHEBRADO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup078', 'CARNE DESHEBRADA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup079', 'SALCHICHA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup080', 'PAN CHAPATA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup081', 'PAN PARA MOLLETE', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup082', 'FRUTA FRESCA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup083', 'PAY DE MANZANA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup084', 'BISQUETS', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup085', 'PAN DULCE VARIADO', 10, 'unidad', 4, 'AVAILABLE'),
  ('sup086', 'MEZCLA HOT CAKES', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup087', 'CAFÉ MOLIDO', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup088', 'JAMAICA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup089', 'HIERBABUENA', 5, 'unidad', 4, 'AVAILABLE'),
  ('sup090', 'APORREADILLO', 5, 'unidad', 4, 'AVAILABLE');

-- Insert products from menu
INSERT INTO products (id, name, price, category_id, is_active) VALUES
  -- DESAYUNOS
  ('prod001', 'Aporreadillo estilo Apatzingán', 110.00, 'cat001', true),
  ('prod002', 'Chilaquiles verdes o rojos', 80.00, 'cat001', true),
  ('prod003', 'Chilaquiles verdes o rojos (con 2 huevos)', 100.00, 'cat001', true),
  ('prod004', 'Huevos con jamón o salchicha', 80.00, 'cat001', true),
  ('prod005', 'Enmoladas Colegio con pollo o con 2 huevos', 100.00, 'cat001', true),
  ('prod006', 'Enfrijoladas con huevos (2) o adobera asada', 85.00, 'cat001', true),
  -- CHAPATAS & OTROS
  ('prod007', 'Chapata de Jamón con queso', 80.00, 'cat002', true),
  ('prod008', 'Chapata de Salami y queso', 80.00, 'cat002', true),
  ('prod009', 'Molletes Colegio de quesos', 80.00, 'cat002', true),
  ('prod010', 'Molletes de jamón o salchicha', 80.00, 'cat002', true),
  ('prod011', 'Plato de fruta', 50.00, 'cat002', true),
  -- POSTRES
  ('prod012', 'Pay de Manzana casero', 50.00, 'cat003', true),
  ('prod013', 'Bisquets con mermelada o lechera', 30.00, 'cat003', true),
  ('prod014', 'Variedad de Pan Dulce (1 Pza)', 18.00, 'cat003', true),
  ('prod015', 'Hot cakes (2 piezas)', 50.00, 'cat003', true),
  -- BEBIDAS
  ('prod016', 'Refrescos', 20.00, 'cat004', true),
  ('prod017', 'Agua del día', 25.00, 'cat004', true),
  ('prod018', 'Variedad de tés', 35.00, 'cat004', true),
  ('prod019', 'Café americano caliente', 40.00, 'cat004', true),
  ('prod020', 'Café de olla', 45.00, 'cat004', true),
  ('prod021', 'Capuchino', 45.00, 'cat004', true),
  ('prod022', 'Latte', 60.00, 'cat004', true),
  ('prod023', 'Agua de jamaica con hierbabuena', 30.00, 'cat004', true),
  -- PEDIDOS PARA LLEVAR
  ('prod024', 'Aporreadillo 1 litro', 220.00, 'cat005', true),
  ('prod025', 'Aporreadillo 1/2 litro', 110.00, 'cat005', true),
  ('prod026', 'Frijoles refritos medio litro', 30.00, 'cat005', true);

-- Insert some basic recipe items (can be customized later)
-- Chilaquiles verdes
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec001', 'prod002', 'sup071', 3),   -- 3 tortillas
  ('rec002', 'prod002', 'sup073', 1),   -- 1 porción salsa verde
  ('rec003', 'prod002', 'sup075', 1),   -- 1 porción queso
  ('rec004', 'prod002', 'sup076', 1),   -- 1 porción crema
  ('rec005', 'prod002', 'sup072', 1);   -- 1 porción frijoles

-- Chilaquiles con huevos
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec006', 'prod003', 'sup071', 3),   -- 3 tortillas
  ('rec007', 'prod003', 'sup073', 1),   -- 1 porción salsa verde
  ('rec008', 'prod003', 'sup075', 1),   -- 1 porción queso
  ('rec009', 'prod003', 'sup076', 1),   -- 1 porción crema
  ('rec010', 'prod003', 'sup072', 1),   -- 1 porción frijoles
  ('rec011', 'prod003', 'sup070', 2);   -- 2 huevos

-- Huevos con jamón
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec012', 'prod004', 'sup070', 2),   -- 2 huevos
  ('rec013', 'prod004', 'sup026', 1),   -- 1 porción jamón
  ('rec014', 'prod004', 'sup072', 1);   -- 1 porción frijoles

-- Chapata de Jamón
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec015', 'prod007', 'sup080', 1),   -- 1 pan chapata
  ('rec016', 'prod007', 'sup026', 1),   -- 1 porción jamón
  ('rec017', 'prod007', 'sup030', 1);   -- 1 porción queso

-- Chapata de Salami
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec018', 'prod008', 'sup080', 1),   -- 1 pan chapata
  ('rec019', 'prod008', 'sup025', 1),   -- 1 porción salami
  ('rec020', 'prod008', 'sup030', 1);   -- 1 porción queso

-- Molletes de queso
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec021', 'prod009', 'sup081', 1),   -- 1 pan mollete
  ('rec022', 'prod009', 'sup072', 1),   -- 1 porción frijoles
  ('rec023', 'prod009', 'sup030', 1);   -- 1 porción queso

-- Café americano
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec024', 'prod019', 'sup087', 1),   -- 1 porción café
  ('rec025', 'prod019', 'sup065', 1);   -- 1 vaso

-- Capuchino
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec026', 'prod021', 'sup087', 1),   -- 1 porción café
  ('rec027', 'prod021', 'sup002', 1),   -- 1 porción leche
  ('rec028', 'prod021', 'sup065', 1);   -- 1 vaso

-- Latte
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec029', 'prod022', 'sup087', 1),   -- 1 porción café
  ('rec030', 'prod022', 'sup002', 1),   -- 1 porción leche
  ('rec031', 'prod022', 'sup065', 1);   -- 1 vaso

-- Agua de jamaica
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec032', 'prod023', 'sup088', 1),   -- 1 porción jamaica
  ('rec033', 'prod023', 'sup089', 1),   -- 1 porción hierbabuena
  ('rec034', 'prod023', 'sup065', 1);   -- 1 vaso

-- Refrescos
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec035', 'prod016', 'sup023', 1);   -- 1 refresco

-- Hot cakes
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec036', 'prod015', 'sup086', 1),   -- 1 mezcla
  ('rec037', 'prod015', 'sup017', 1),   -- 1 miel maple
  ('rec038', 'prod015', 'sup028', 1);   -- 1 mantequilla

-- Bisquets
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec039', 'prod013', 'sup084', 1),   -- 1 bisquet
  ('rec040', 'prod013', 'sup033', 1);   -- 1 mermelada

-- Pan dulce
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec041', 'prod014', 'sup085', 1);   -- 1 pan dulce

-- Pay de manzana
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec042', 'prod012', 'sup083', 1);   -- 1 porción pay

-- Plato de fruta
INSERT INTO recipe_items (id, product_id, supply_id, quantity) VALUES
  ('rec043', 'prod011', 'sup082', 1);   -- 1 porción fruta

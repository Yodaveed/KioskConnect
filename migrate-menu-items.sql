-- Migration script to convert single menu_id to many-to-many relationship

-- First, create the new junction table
CREATE TABLE IF NOT EXISTS menu_items_to_menus (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id),
    menu_id INTEGER REFERENCES menus(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing data from menu_items.menu_id to the junction table
INSERT INTO menu_items_to_menus (menu_item_id, menu_id)
SELECT id, menu_id FROM menu_items WHERE menu_id IS NOT NULL;

-- Now we can safely drop the menu_id column
ALTER TABLE menu_items DROP COLUMN menu_id;
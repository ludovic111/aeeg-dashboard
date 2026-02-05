-- Structured customer order items (product + quantity + sweat variants)

CREATE OR REPLACE FUNCTION public.parse_customer_order_items(raw_details TEXT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  line TEXT;
  line_match TEXT[];
  quantity INTEGER;
  descriptor TEXT;
  descriptor_normalized TEXT;
  segments TEXT[];
  color_value TEXT;
  size_value TEXT;
  items JSONB := '[]'::JSONB;
BEGIN
  IF raw_details IS NULL OR btrim(raw_details) = '' THEN
    RETURN items;
  END IF;

  FOR line IN
    SELECT btrim(value)
    FROM regexp_split_to_table(raw_details, '\s*\+\s*') AS value
  LOOP
    IF line = '' THEN
      CONTINUE;
    END IF;

    line_match := regexp_match(line, '^\s*(\d+)\s*x\s*(.+)$', 'i');

    IF line_match IS NULL THEN
      quantity := 1;
      descriptor := line;
    ELSE
      quantity := GREATEST((line_match[1])::INTEGER, 1);
      descriptor := btrim(line_match[2]);
    END IF;

    descriptor_normalized := lower(
      translate(
        replace(replace(descriptor, '-', ' '), '_', ' '),
        'éèêëàâäîïôöùûüç',
        'eeeeaaaiioouuuc'
      )
    );
    descriptor_normalized := regexp_replace(descriptor_normalized, '\s+', ' ', 'g');
    descriptor_normalized := btrim(descriptor_normalized);

    IF descriptor_normalized LIKE 'sweat emilie gourd%' THEN
      segments := string_to_array(descriptor, '-');
      color_value := NULL;
      size_value := NULL;

      IF array_length(segments, 1) >= 2 THEN
        color_value := lower(btrim(segments[2]));
      END IF;

      IF array_length(segments, 1) >= 3 THEN
        size_value := lower(btrim(segments[3]));
      END IF;

      color_value := CASE color_value
        WHEN 'gris' THEN 'gris'
        WHEN 'bleu marine' THEN 'bleu_marine'
        WHEN 'bleu_marine' THEN 'bleu_marine'
        WHEN 'vert' THEN 'vert'
        WHEN 'noir' THEN 'noir'
        WHEN 'rose' THEN 'rose'
        ELSE NULL
      END;

      size_value := CASE size_value
        WHEN 's' THEN 's'
        WHEN 'm' THEN 'm'
        WHEN 'l' THEN 'l'
        WHEN 'xl' THEN 'xl'
        ELSE NULL
      END;

      items := items || jsonb_build_array(
        jsonb_strip_nulls(
          jsonb_build_object(
            'product', 'sweat_emilie_gourd',
            'quantity', quantity,
            'color', color_value,
            'size', size_value
          )
        )
      );
    ELSIF descriptor_normalized LIKE '%gourde%' THEN
      items := items || jsonb_build_array(
        jsonb_build_object(
          'product', 'emilie_gourde',
          'quantity', quantity
        )
      );
    END IF;
  END LOOP;

  RETURN items;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_customer_order_items(items JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  item JSONB;
  product_value TEXT;
  quantity_value TEXT;
  color_value TEXT;
  size_value TEXT;
BEGIN
  IF items IS NULL OR jsonb_typeof(items) <> 'array' OR jsonb_array_length(items) = 0 THEN
    RETURN FALSE;
  END IF;

  FOR item IN
    SELECT value
    FROM jsonb_array_elements(items)
  LOOP
    IF jsonb_typeof(item) <> 'object' THEN
      RETURN FALSE;
    END IF;

    product_value := item->>'product';
    quantity_value := item->>'quantity';

    IF quantity_value IS NULL OR quantity_value !~ '^[1-9][0-9]*$' THEN
      RETURN FALSE;
    END IF;

    IF product_value = 'emilie_gourde' THEN
      CONTINUE;
    END IF;

    IF product_value <> 'sweat_emilie_gourd' THEN
      RETURN FALSE;
    END IF;

    color_value := item->>'color';
    size_value := item->>'size';

    IF color_value NOT IN ('gris', 'bleu_marine', 'vert', 'noir', 'rose') THEN
      RETURN FALSE;
    END IF;

    IF size_value NOT IN ('s', 'm', 'l', 'xl') THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$;

ALTER TABLE public.customer_orders
ADD COLUMN IF NOT EXISTS order_items JSONB NOT NULL DEFAULT '[]'::JSONB;

UPDATE public.customer_orders
SET order_items = public.parse_customer_order_items(order_details)
WHERE order_items IS NULL
  OR jsonb_typeof(order_items) <> 'array'
  OR jsonb_array_length(order_items) = 0;

ALTER TABLE public.customer_orders
ALTER COLUMN order_items SET DEFAULT '[]'::JSONB,
ALTER COLUMN order_items SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customer_orders_order_items_valid'
  ) THEN
    ALTER TABLE public.customer_orders
    ADD CONSTRAINT customer_orders_order_items_valid
    CHECK (public.validate_customer_order_items(order_items));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_customer_orders_order_items
  ON public.customer_orders USING GIN (order_items);

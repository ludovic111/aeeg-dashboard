-- Remove Shopify-specific sales integration
UPDATE public.sales_entries
SET source = 'manual'
WHERE source <> 'manual';

ALTER TABLE public.sales_entries
DROP COLUMN IF EXISTS shopify_order_id;

ALTER TABLE public.sales_entries
DROP CONSTRAINT IF EXISTS sales_entries_source_manual_only;

ALTER TABLE public.sales_entries
ADD CONSTRAINT sales_entries_source_manual_only
CHECK (source = 'manual');

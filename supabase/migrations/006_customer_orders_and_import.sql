-- Customer orders import from commandes_clients.numbers
CREATE TABLE IF NOT EXISTS public.customer_orders (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  order_details TEXT NOT NULL,
  email TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_orders_imported_at
  ON public.customer_orders(imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_orders_email
  ON public.customer_orders(email);

ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders are viewable by approved members" ON public.customer_orders;
CREATE POLICY "Orders are viewable by approved members"
ON public.customer_orders
FOR SELECT
TO authenticated
USING (
  (select public.get_user_role((select auth.uid()))) = ANY (ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role])
);

DROP POLICY IF EXISTS "Committee members and above can create orders" ON public.customer_orders;
CREATE POLICY "Committee members and above can create orders"
ON public.customer_orders
FOR INSERT
TO authenticated
WITH CHECK (
  (select public.get_user_role((select auth.uid()))) = ANY (ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role])
);

DROP POLICY IF EXISTS "Committee members and above can update orders" ON public.customer_orders;
CREATE POLICY "Committee members and above can update orders"
ON public.customer_orders
FOR UPDATE
TO authenticated
USING (
  (select public.get_user_role((select auth.uid()))) = ANY (ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role])
);

DROP POLICY IF EXISTS "Admins can delete orders" ON public.customer_orders;
CREATE POLICY "Admins can delete orders"
ON public.customer_orders
FOR DELETE
TO authenticated
USING (
  (select public.get_user_role((select auth.uid()))) = ANY (ARRAY['superadmin'::user_role, 'admin'::user_role])
);

DROP TRIGGER IF EXISTS update_customer_orders_updated_at ON public.customer_orders;
CREATE TRIGGER update_customer_orders_updated_at
BEFORE UPDATE ON public.customer_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.customer_orders (order_number, full_name, order_details, email)
VALUES
  ('#1001', 'Ludovic Marie', '1x Sweat Emilie Gourd - Rose - L', 'ludo47j@gmail.com'),
  ('#1002', 'Joséphine Amar Waber', '1x Sweat Emilie Gourd - Bleu Marine - L', 'josephine@infomaniak.ch'),
  ('#1003', 'Frank Souiller', '1x Sweat Emilie Gourd - Rose - L', 'Frank.souiller@gmail.com'),
  ('#1004', 'Mauricio Plumley', '1x Sweat Emilie Gourd - Bleu Marine - M', 'mauricio.plumley@bluewin.ch'),
  ('#1005', 'Ashli Dervishi', '1x Sweat Emilie Gourd - Noir - S', 'dervishiashli8@gmail.com'),
  ('#1006', 'Petra Rulic', '1x Sweat Emilie Gourd - Rose - S', 'petra.rlc@eduge.ch'),
  ('#1007', 'Alix Tschopp', '1x Sweat Emilie Gourd - Vert - S', 'alix.tschopp@icloud.com'),
  ('#1008', 'Joséphine Amar Waber', '1x Émilie-Gourde', 'josephine@infomaniak.ch'),
  ('#1009', 'Valentin Brunie', '1x Sweat Emilie Gourd - Noir - S', 'valentinbrunie3@gmail.com'),
  ('#1010', 'Jacques Richard', '1x Sweat Emilie Gourd - Rose - S', 'jacquesrichard19@icloud.com'),
  ('#1011', 'Claus Olivier', '1x Sweat Emilie Gourd - Vert - S + 1x Émilie-Gourde', 'olivier.claus@bluewin.ch'),
  ('#1012', 'Patrice Pizza', '1x Sweat Emilie Gourd - Bleu Marine - S + 1x Sweat Emilie Gourd - Vert - S + 1x Sweat Emilie Gourd - Noir - S', 'Pizzapatrice@gmail.com'),
  ('#1013', 'Joséphine Amar Waber', '3x Émilie-Gourde', 'josephine@infomaniak.ch'),
  ('#1014', 'Marilyn Gil', '1x Sweat Emilie Gourd - Rose - S + 1x Émilie-Gourde', 'marilynglmrn@gmail.com'),
  ('#1015', 'Cardoso Pereira Isabella', '1x Sweat Emilie Gourd - Bleu Marine - S', 'isabellaesusy31@icloud.com'),
  ('#1016', 'Anton Sulinov', '1x Sweat Emilie Gourd - Rose - L', 'ansesul@mail.ru'),
  ('#1017', 'Elvina Mudry', '1x Sweat Emilie Gourd - Noir - XL', 'elvina.uy07@gmail.com'),
  ('#1018', 'Elvina Mudry', '1x Sweat Emilie Gourd - Bleu Marine - XL', 'elvina.uy07@gmail.com'),
  ('#1019', 'Elona Elmaleh', '1x Sweat Emilie Gourd - Bleu Marine - M + 1x Sweat Emilie Gourd - Bleu Marine - L', 'elona.elmaleh@gmail.com'),
  ('#1020', 'Lou Glarner', '1x Sweat Emilie Gourd - Bleu Marine - M', 'glarner.lou@gmail.com'),
  ('#1021', 'Sophie Streit', '1x Sweat Emilie Gourd - Bleu Marine - M', 'sophiestreit22@gmail.com'),
  ('#1022', 'Thalia Middleton', '1x Émilie-Gourde', 'thalia.middleton@icloud.com'),
  ('#1023', 'Elodie Lausenaz', '1x Sweat Emilie Gourd - Noir - L', 'elodie.lausenaz@gmail.com'),
  ('#1024', 'Arthur Devis', '1x Sweat Emilie Gourd - Bleu Marine - L', 'arthur_devos@outlook.com'),
  ('#1025', 'Mika', '1x Sweat Emilie Gourd - Vert - M', NULL),
  ('#1026', 'Benjamin', '1x Sweat Emilie Gourd - Bleu Marine - L', NULL),
  ('#1027', 'Leonard', '1x Sweat Emilie Gourd - Bleu Marine - M', NULL),
  ('#1028', 'Arthur', '1x Sweat Emilie Gourd - Vert - M', NULL),
  ('#1029', 'Sophie', '1x Sweat Emilie Gourd - Bleu Marine - M', NULL),
  ('#1030', 'Marc Deshusses', '1x Sweat Emilie Gourd - Gris - L', NULL)
ON CONFLICT (order_number) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  order_details = EXCLUDED.order_details,
  email = EXCLUDED.email,
  imported_at = NOW();

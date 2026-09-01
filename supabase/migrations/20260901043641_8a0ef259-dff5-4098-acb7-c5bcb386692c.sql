-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CONTACTS
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  org TEXT NOT NULL DEFAULT '—',
  role TEXT NOT NULL DEFAULT '—',
  affiliation TEXT NOT NULL DEFAULT '—',
  tags TEXT[] NOT NULL DEFAULT '{}',
  stage TEXT NOT NULL DEFAULT 'not_contacted',
  starred BOOLEAN NOT NULL DEFAULT false,
  next_action TEXT,
  next_action_due DATE,
  ai_summary TEXT,
  ai_summary_date DATE,
  position DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_own" ON public.contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX contacts_user_idx ON public.contacts (user_id, position);

-- NOTES
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  note_date DATE NOT NULL DEFAULT current_date,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_own" ON public.notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX notes_contact_idx ON public.notes (contact_id, note_date DESC);

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '—',
  applied_on DATE NOT NULL DEFAULT current_date,
  resume_version TEXT NOT NULL DEFAULT 'Base',
  stage TEXT NOT NULL DEFAULT 'applied',
  set_aside TEXT,
  referred_by_contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  posting_url TEXT,
  location TEXT,
  seniority TEXT,
  position DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_own" ON public.applications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX applications_user_idx ON public.applications (user_id, position);

-- ONE-TIME DEMO SEED
CREATE OR REPLACE FUNCTION public.seed_demo_data(_user UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.contacts WHERE user_id = _user) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.applications WHERE user_id = _user) THEN RETURN; END IF;

  INSERT INTO public.contacts
    (user_id, name, org, role, affiliation, tags, stage, starred, next_action, next_action_due, position)
  VALUES
    (_user, 'Neela Ramachandran', 'Nimbus Forge', 'Platform PM', 'Haas 2027', ARRAY['Infra'], 'not_contacted', false, NULL, NULL, 1),
    (_user, 'Tobias Fennwick', 'Nimbus Forge', 'Director of DevRel', 'Haas alum 2019', ARRAY['DevRel'], 'not_contacted', true, 'Send intro note before the infra meetup', current_date - 3, 2),
    (_user, 'Priya Ellingsworth', 'Nimbus Forge', 'Staff Engineer', 'Haas 2026', ARRAY['Infra'], 'not_contacted', false, NULL, NULL, 3),
    (_user, 'Marcus Adeyemi', 'Ledgerlane', 'Payments PM', 'Haas alum 2021', ARRAY['Fintech'], 'not_contacted', false, NULL, NULL, 4),
    (_user, 'Sofia Vandermeer', 'Synthograph AI', 'Head of Brand', 'Referred by Jae', ARRAY['Brand'], 'not_contacted', false, NULL, NULL, 5),
    (_user, 'Devon Kirtland', 'Synthograph AI', 'ML Engineer', 'Haas 2027', ARRAY['AI'], 'not_contacted', true, NULL, NULL, 6),
    (_user, 'Hana Wexley', 'Corvus Health', 'Clinical Product Lead', 'Haas alum 2017', ARRAY[]::text[], 'not_contacted', false, NULL, NULL, 7),
    (_user, 'Ilya Brackenbury', 'Ledgerlane', 'Risk Lead', 'Undergrad friend', ARRAY['Warm'], 'not_contacted', false, NULL, NULL, 8),
    (_user, 'Rosalind Achterberg', 'Tessellate', 'Design Lead', 'Haas 2026', ARRAY['Design tools'], 'reached_out', false, 'Nudge if no reply', current_date + 2, 9),
    (_user, 'Emeka Thorvald', 'Tessellate', 'Head of Ops', 'Haas alum 2015', ARRAY['Referral offered'], 'reached_out', false, NULL, NULL, 10),
    (_user, 'Junie Castellanos', 'Voltway', 'Growth PM', 'Haas alum 2020', ARRAY['Growth'], 'reached_out', true, 'Follow up on her intro to the PM lead', current_date - 1, 11),
    (_user, 'Anselm Petrakis', 'Helios Grid', 'Climate Data Lead', 'Haas 2027', ARRAY['Climate tech'], 'responded', false, 'Send three time slots', current_date + 1, 12),
    (_user, 'Beatriz Nkemdirim', 'Rowan Data', 'Analytics PM', 'Haas alum 2018', ARRAY['Data'], 'responded', false, NULL, NULL, 13),
    (_user, 'Rafael Ostrowski', 'Sable Robotics', 'PM, Autonomy', 'Haas 2026', ARRAY['Robotics'], 'chat_scheduled', false, 'Coffee chat, 9:30am', current_date + 3, 14),
    (_user, 'Ingrid Solvang', 'Corvus Health', 'Principal PM', 'Haas alum 2014', ARRAY['Senior'], 'chat_scheduled', true, 'Zoom, prep questions on their PM ladder', current_date + 5, 15),
    (_user, 'Callum Winterbourne', 'Voltway', 'Staff PM, Charging', 'Haas alum 2022', ARRAY['Hardware'], 'first_chat', false, 'Send thank-you + the postmortem he mentioned', current_date + 1, 16),
    (_user, 'Yuki Marchetti', 'Synthograph AI', 'Developer Experience Lead', 'Haas 2026', ARRAY['DX'], 'first_chat', false, NULL, NULL, 17),
    (_user, 'Oluwaseun Bright', 'Rowan Data', 'Founding Engineer', 'Haas alum 2016', ARRAY['Referral offered'], 'first_chat', false, NULL, NULL, 18),
    (_user, 'Marguerite Faslow', 'Beacon Security', 'Chief of Staff', 'Former manager', ARRAY['Warm'], 'ongoing', false, 'Monthly check-in', current_date + 9, 19),
    (_user, 'Theo Lindqvist', 'Sable Robotics', 'VP Engineering', 'Haas alum 2013', ARRAY['Mentor'], 'ongoing', false, NULL, NULL, 20);

  INSERT INTO public.notes (user_id, contact_id, note_date, body)
  SELECT _user, c.id, x.d, x.b
  FROM (VALUES
    ('Rosalind Achterberg', current_date - 6, 'Cold email sent — mentioned her talk on pricing design tooling for small teams.'),
    ('Anselm Petrakis', current_date - 2, 'Replied same day, very warm. Wants to hear about the grid-modeling coursework.'),
    ('Rafael Ostrowski', current_date - 4, 'Booked 30 min. He asked me to send the autonomy deck ahead of time.'),
    ('Callum Winterbourne', current_date - 3, 'Great chat. Their PM org is flat — two levels, lots of ownership. The hiring loop leans on a written exercise, so I should have a sample spec ready. Offered to look at my resume if I send it before the end of the month.'),
    ('Yuki Marchetti', current_date - 11, 'Friendly but not hiring. Keep her in the loop in the spring when the DX team grows.'),
    ('Marguerite Faslow', current_date - 20, 'Told me to stop applying broadly and pick four companies. Hard to hear, probably right.'),
    ('Marguerite Faslow', current_date - 5, 'Sent her the shortlist. She flagged two people at Ledgerlane to reach out to.'),
    ('Theo Lindqvist', current_date - 14, 'Checks in unprompted every few weeks. Genuinely generous with intros.')
  ) AS x(n, d, b)
  JOIN public.contacts c ON c.user_id = _user AND c.name = x.n;

  INSERT INTO public.applications
    (user_id, company, role, applied_on, resume_version, stage, set_aside, referred_by_contact_id, location, seniority, position)
  SELECT _user, x.company, x.role, x.applied_on, x.resume_version, x.stage, x.set_aside,
    (SELECT c.id FROM public.contacts c WHERE c.user_id = _user AND c.name = x.ref),
    x.location, x.seniority, x.pos
  FROM (VALUES
    ('Nimbus Forge', 'Product Manager, Build Platform', current_date - 4, 'Nimbus_Infra', 'applied', NULL, NULL, 'San Francisco, CA', 'Mid', 1),
    ('Rowan Data', 'Senior PM, Pipelines', current_date - 9, 'Rowan_Data', 'applied', NULL, NULL, 'Remote (US)', 'Senior', 2),
    ('Ledgerlane', 'PM, Merchant Tools', current_date - 12, 'Ledger_Fin', 'referred', NULL, 'Marcus Adeyemi', 'New York, NY', 'Mid', 3),
    ('Tessellate', 'PM, Design Systems', current_date - 16, 'Tess_Design', 'referred', NULL, 'Emeka Thorvald', 'Remote', 'Mid', 4),
    ('Helios Grid', 'PM, Demand Response', current_date - 21, 'Helios_Climate', 'screen', NULL, NULL, 'Oakland, CA', 'Mid', 5),
    ('Sable Robotics', 'Product Manager, Fleet Autonomy', current_date - 26, 'Sable_Robotics', 'round_1', NULL, 'Rafael Ostrowski', 'Sunnyvale, CA', 'Mid', 6),
    ('Voltway', 'PM II, Rider Growth', current_date - 31, 'Voltway_Growth', 'round_1', NULL, 'Callum Winterbourne', 'Seattle, WA', 'Mid', 7),
    ('Corvus Health', 'PM, Clinician Platform', current_date - 38, 'Corvus_Health', 'final', NULL, NULL, 'Boston, MA', 'Senior', 8),
    ('Synthograph AI', 'Product Lead, Agents', current_date - 45, 'Synth_AI', 'offer', NULL, NULL, 'San Francisco, CA', 'Lead', 9),
    ('Beacon Security', 'PM, Threat Detection', current_date - 40, 'Beacon_Sec', 'screen', 'rejected', NULL, 'Austin, TX', 'Mid', 10),
    ('Kindling', 'PM, Subscriptions', current_date - 52, 'Kindling_Edu', 'applied', 'ghosted', NULL, 'Remote', 'Mid', 11)
  ) AS x(company, role, applied_on, resume_version, stage, set_aside, ref, location, seniority, pos);
END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_demo_data(UUID) TO authenticated, service_role;
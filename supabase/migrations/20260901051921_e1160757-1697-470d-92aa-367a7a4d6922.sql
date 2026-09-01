ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.seed_demo_data(_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  u UUID := auth.uid();
BEGIN
  IF u IS NULL OR (_user IS NOT NULL AND _user <> u) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.contacts WHERE user_id = u) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.applications WHERE user_id = u) THEN RETURN; END IF;

  INSERT INTO public.contacts
    (user_id, name, org, role, affiliation, tags, stage, starred, next_action, next_action_due, position)
  VALUES
    (u, 'Neela Ramachandran', 'Nimbus Forge', 'Platform PM', 'Haas 2027', ARRAY['Infra'], 'not_contacted', false, NULL, NULL, 1),
    (u, 'Tobias Fennwick', 'Nimbus Forge', 'Director of DevRel', 'Haas alum 2019', ARRAY['DevRel'], 'not_contacted', true, 'Send intro note before the infra meetup', current_date - 3, 2),
    (u, 'Priya Ellingsworth', 'Nimbus Forge', 'Staff Engineer', 'Haas 2026', ARRAY['Infra'], 'not_contacted', false, NULL, NULL, 3),
    (u, 'Marcus Adeyemi', 'Ledgerlane', 'Payments PM', 'Haas alum 2021', ARRAY['Fintech'], 'not_contacted', false, NULL, NULL, 4),
    (u, 'Sofia Vandermeer', 'Synthograph AI', 'Head of Brand', 'Referred by Jae', ARRAY['Brand'], 'not_contacted', false, NULL, NULL, 5),
    (u, 'Devon Kirtland', 'Synthograph AI', 'ML Engineer', 'Haas 2027', ARRAY['AI'], 'not_contacted', true, NULL, NULL, 6),
    (u, 'Hana Wexley', 'Corvus Health', 'Clinical Product Lead', 'Haas alum 2017', ARRAY[]::text[], 'not_contacted', false, NULL, NULL, 7),
    (u, 'Ilya Brackenbury', 'Ledgerlane', 'Risk Lead', 'Undergrad friend', ARRAY['Warm'], 'not_contacted', false, NULL, NULL, 8),
    (u, 'Rosalind Achterberg', 'Tessellate', 'Design Lead', 'Haas 2026', ARRAY['Design tools'], 'reached_out', false, 'Nudge if no reply', current_date + 2, 9),
    (u, 'Emeka Thorvald', 'Tessellate', 'Head of Ops', 'Haas alum 2015', ARRAY['Referral offered'], 'reached_out', false, NULL, NULL, 10),
    (u, 'Junie Castellanos', 'Voltway', 'Growth PM', 'Haas alum 2020', ARRAY['Growth'], 'reached_out', true, 'Follow up on her intro to the PM lead', current_date - 1, 11),
    (u, 'Anselm Petrakis', 'Helios Grid', 'Climate Data Lead', 'Haas 2027', ARRAY['Climate tech'], 'responded', false, 'Send three time slots', current_date + 1, 12),
    (u, 'Beatriz Nkemdirim', 'Rowan Data', 'Analytics PM', 'Haas alum 2018', ARRAY['Data'], 'responded', false, NULL, NULL, 13),
    (u, 'Rafael Ostrowski', 'Sable Robotics', 'PM, Autonomy', 'Haas 2026', ARRAY['Robotics'], 'chat_scheduled', false, 'Coffee chat, 9:30am', current_date + 3, 14),
    (u, 'Ingrid Solvang', 'Corvus Health', 'Principal PM', 'Haas alum 2014', ARRAY['Senior'], 'chat_scheduled', true, 'Zoom, prep questions on their PM ladder', current_date + 5, 15),
    (u, 'Callum Winterbourne', 'Voltway', 'Staff PM, Charging', 'Haas alum 2022', ARRAY['Hardware'], 'first_chat', false, 'Send thank-you + the postmortem he mentioned', current_date + 1, 16),
    (u, 'Yuki Marchetti', 'Synthograph AI', 'Developer Experience Lead', 'Haas 2026', ARRAY['DX'], 'first_chat', false, NULL, NULL, 17),
    (u, 'Oluwaseun Bright', 'Rowan Data', 'Founding Engineer', 'Haas alum 2016', ARRAY['Referral offered'], 'first_chat', false, NULL, NULL, 18),
    (u, 'Marguerite Faslow', 'Beacon Security', 'Chief of Staff', 'Former manager', ARRAY['Warm'], 'ongoing', false, 'Monthly check-in', current_date + 9, 19),
    (u, 'Theo Lindqvist', 'Sable Robotics', 'VP Engineering', 'Haas alum 2013', ARRAY['Mentor'], 'ongoing', false, NULL, NULL, 20);

  INSERT INTO public.notes (user_id, contact_id, note_date, body)
  SELECT u, c.id, x.d, x.b
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
  JOIN public.contacts c ON c.user_id = u AND c.name = x.n;

  INSERT INTO public.applications
    (user_id, company, role, applied_on, resume_version, stage, set_aside, referred_by_contact_id, location, seniority, starred, position)
  SELECT u, x.company, x.role, x.applied_on, x.resume_version, x.stage, x.set_aside,
    (SELECT c.id FROM public.contacts c WHERE c.user_id = u AND c.name = x.ref),
    x.location, x.seniority, x.starred, x.pos
  FROM (VALUES
    ('Nimbus Forge', 'Product Manager, Build Platform', current_date - 4, 'Nimbus_Infra', 'to_be_applied', NULL, NULL, 'San Francisco, CA', 'Mid', false, 1),
    ('Rowan Data', 'Senior PM, Pipelines', current_date - 9, 'Rowan_Data', 'to_be_applied', NULL, NULL, 'Remote (US)', 'Senior', false, 2),
    ('Ledgerlane', 'PM, Merchant Tools', current_date - 12, 'Ledger_Fin', 'referred', NULL, 'Marcus Adeyemi', 'New York, NY', 'Mid', false, 3),
    ('Tessellate', 'PM, Design Systems', current_date - 16, 'Tess_Design', 'referred', NULL, 'Emeka Thorvald', 'Remote', 'Mid', false, 4),
    ('Helios Grid', 'PM, Demand Response', current_date - 21, 'Helios_Climate', 'screen', NULL, NULL, 'Oakland, CA', 'Mid', false, 5),
    ('Rowan Data', 'PM, Warehouse Experience', current_date - 24, 'Rowan_Data', 'take_home', NULL, 'Beatriz Nkemdirim', 'Remote (US)', 'Mid', true, 6),
    ('Sable Robotics', 'Product Manager, Fleet Autonomy', current_date - 26, 'Sable_Robotics', 'round_1', NULL, 'Rafael Ostrowski', 'Sunnyvale, CA', 'Mid', false, 7),
    ('Voltway', 'PM II, Rider Growth', current_date - 31, 'Voltway_Growth', 'round_1', NULL, 'Callum Winterbourne', 'Seattle, WA', 'Mid', false, 8),
    ('Corvus Health', 'PM, Clinician Platform', current_date - 38, 'Corvus_Health', 'final', NULL, NULL, 'Boston, MA', 'Senior', true, 9),
    ('Synthograph AI', 'Product Lead, Agents', current_date - 45, 'Synth_AI', 'offer', NULL, NULL, 'San Francisco, CA', 'Lead', false, 10),
    ('Beacon Security', 'PM, Threat Detection', current_date - 40, 'Beacon_Sec', 'screen', 'rejected', NULL, 'Austin, TX', 'Mid', false, 11),
    ('Kindling', 'PM, Subscriptions', current_date - 52, 'Kindling_Edu', 'applied', 'ghosted', NULL, 'Remote', 'Mid', false, 12)
  ) AS x(company, role, applied_on, resume_version, stage, set_aside, ref, location, seniority, starred, pos);
END;
$function$;
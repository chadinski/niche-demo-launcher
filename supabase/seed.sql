do $$
declare
  seed_user uuid;
  bloom_id uuid := gen_random_uuid();
  auto_id uuid := gen_random_uuid();
begin
  select id into seed_user
  from auth.users
  order by created_at asc
  limit 1;

  if seed_user is null then
    raise notice 'No auth user found. Create a user in Supabase Auth, then run this seed again.';
    return;
  end if;

  insert into public.prospects (
    id,
    user_id,
    business_name,
    category,
    location,
    phone,
    email,
    social_url,
    source,
    pasted_raw_info,
    extracted_summary,
    package_price,
    deal_value,
    lead_score,
    lead_temperature,
    lead_score_explanation,
    recommended_sales_angle,
    demo_url,
    outreach_status,
    notes,
    follow_up_count,
    last_contacted_at,
    next_follow_up_at
  ) values
  (
    bloom_id,
    seed_user,
    'Kingston Bloom Studio',
    'Florist',
    'Kingston',
    '+1 876 555 0184',
    'hello@kingstonbloom.example',
    'https://instagram.com/kingstonbloom',
    'Seed data',
    'Kingston Bloom Studio. Custom bouquets and event florals in Kingston.',
    'A Kingston florist focused on custom bouquets and event florals.',
    '$1,000',
    '$1,000',
    82,
    'Hot',
    'Active social presence, no clear website, and event-focused category.',
    'Lead with a beautiful occasion-focused website and easy custom-order CTA.',
    'https://kingston-bloom-demo.vercel.app',
    'replied',
    'Interested in seeing a mobile-first version.',
    1,
    now() - interval '2 days',
    now() + interval '2 days'
  ),
  (
    auto_id,
    seed_user,
    'North Coast Auto Care',
    'Auto repair',
    'St. Ann',
    '+1 876 555 0112',
    '',
    'https://facebook.com/northcoastautocare',
    'Seed data',
    'North Coast Auto Care - diagnostics, servicing, brakes, AC repair.',
    'An auto repair business in St. Ann offering diagnostics and general servicing.',
    '$1,250',
    '$1,250',
    76,
    'Hot',
    'No website link, auto services, clear contact opportunity, and active social signal.',
    'Lead with a sharper service-shop site and direct estimate request.',
    '',
    'new',
    '',
    0,
    null,
    null
  )
  on conflict (id) do nothing;

  insert into public.activity_logs (user_id, prospect_id, action, detail)
  values
    (seed_user, bloom_id, 'Reply received', 'Prospect asked to see the mobile version.'),
    (seed_user, auto_id, 'Prospect created', 'Business information parsed and saved.');

  insert into public.app_settings (
    user_id,
    company_name,
    sender_name,
    default_package_price,
    default_currency,
    default_message_tone,
    default_website_style,
    default_follow_up_cadence,
    deployment_mode
  )
  values (
    seed_user,
    'Niche Technologies',
    'Chad',
    '$1,000',
    'USD',
    'Friendly',
    'Editorial premium',
    '0,2,5,10',
    'manual'
  )
  on conflict (user_id) do nothing;
end $$;

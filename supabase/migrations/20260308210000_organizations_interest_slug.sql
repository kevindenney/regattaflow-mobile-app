alter table public.organizations add column if not exists interest_slug text;

update public.organizations
set interest_slug='nursing'
where name ilike '%Johns Hopkins School of Nursing%';

update public.organizations
set interest_slug='sail-racing'
where name ilike '%Royal Hong Kong Yacht Club%';

create index if not exists organizations_interest_slug_idx on public.organizations (interest_slug);

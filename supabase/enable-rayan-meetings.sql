update public.members
set can_create_meetings = true
where is_active is true
  and (
      coalesce(full_name, name, '') ilike '%ريان%عبد%القادر%'
      or coalesce(full_name, name, '') ilike '%Rayan%Abd%Qader%'
  );

select
    coalesce(membership_number, membership_id) as membership,
    coalesce(full_name, name) as member_name,
    can_create_meetings
from public.members
where is_active is true
  and (
      coalesce(full_name, name, '') ilike '%ريان%عبد%القادر%'
      or coalesce(full_name, name, '') ilike '%Rayan%Abd%Qader%'
  );

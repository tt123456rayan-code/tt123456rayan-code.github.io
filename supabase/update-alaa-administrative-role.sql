update public.committee_members
set
    role_ar = 'المستشار الأعلى للشؤون الإدارية',
    role_en = 'Senior Advisor for Administrative Affairs'
where committee_slug = 'administrative'
  and member_name = 'علاء العبادي';

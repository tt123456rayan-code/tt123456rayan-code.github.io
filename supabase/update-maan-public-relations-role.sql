update public.committee_members
set
    role_ar = 'المستشار الأعلى لشؤون العلاقات العامة',
    role_en = 'Senior Advisor for Public Relations Affairs'
where committee_slug = 'administrative'
  and member_name = 'معن مصطفى العدوان';

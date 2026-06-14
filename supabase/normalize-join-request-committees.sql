update public.join_requests
set committee = case committee
    when 'health' then 'لجنة الصحة'
    when 'legal' then 'لجنة الشؤون القانونية'
    when 'sports' then 'اللجنة الرياضية'
    when 'arts' then 'لجنة الفنون والثقافة'
    when 'economy' then 'اللجنة الاقتصادية وريادة الأعمال'
    when 'political' then 'لجنة التمكين السياسي والدبلوماسي'
    when 'media' then 'اللجنة الإعلامية'
    when 'training' then 'لجنة التدريب والتطوير'
    when 'community' then 'اللجنة المجتمعية والعمل التطوعي'
    when 'pr' then 'لجنة العلاقات العامة والشراكات'
    when 'public-relations' then 'لجنة العلاقات العامة والشراكات'
    when 'tech' then 'لجنة التكنولوجيا والابتكار'
    when 'technology' then 'لجنة التكنولوجيا والابتكار'
    when 'environment' then 'لجنة البيئة'
    else committee
end
where committee in (
    'health',
    'legal',
    'sports',
    'arts',
    'economy',
    'political',
    'media',
    'training',
    'community',
    'pr',
    'public-relations',
    'tech',
    'technology',
    'environment'
);

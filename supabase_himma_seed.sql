insert into public.committees (slug, name, name_ar, name_en, description, article_ar, article_en, vision_ar, vision_en, icon, color, sort_order, is_active)
values
    ('administrative', 'اللجنة الإدارية', 'اللجنة الإدارية', 'Administrative Committee', 'تنسيق العمل الداخلي والهيكل الإداري.', 'تتابع اللجنة الإدارية تنظيم العمل الداخلي وتنسيق الأدوار القيادية والاستشارية في المبادرة.', 'The Administrative Committee coordinates internal operations and leadership roles across the initiative.', 'حوكمة واضحة وتنسيق مرن يساند عمل جميع اللجان.', 'Clear governance and agile coordination that supports every committee.', 'users', '#007a3d', 10, true),
    ('technology', 'لجنة التكنولوجيا والابتكار', 'لجنة التكنولوجيا والابتكار', 'Technology and Innovation Committee', 'تمكين الشباب تقنياً وربط الأفكار الرقمية بتطبيقات عملية.', 'تعمل لجنة التكنولوجيا والابتكار على تمكين الشباب تقنياً وربط الأفكار الرقمية بتطبيقات عملية مفيدة.', 'The Technology and Innovation Committee equips youth with practical digital skills and turns technical ideas into useful applications.', 'جيل شبابي قادر على استخدام التكنولوجيا بأمان وابتكار لخدمة المجتمع.', 'A youth generation able to use technology safely and creatively for community impact.', 'cpu', '#0f766e', 20, true),
    ('media', 'لجنة الإعلام', 'لجنة الإعلام', 'Media Committee', 'إدارة حضور المبادرة ورسائلها ومحتواها.', 'تدير لجنة الإعلام حضور المبادرة ورسائلها ومحتواها بما يعكس هويتها الشبابية الوطنية.', 'The Media Committee manages the initiative presence, messaging, and content in a way that reflects its national youth identity.', 'إعلام شبابي مهني يبرز أثر همّة ويصل للمجتمع بوضوح.', 'Professional youth media that highlights Himma impact and reaches the community clearly.', 'radio', '#b91c1c', 30, true),
    ('organization', 'لجنة التنظيم', 'لجنة التنظيم', 'Organization Committee', 'تنظيم الفعاليات والبرامج والمتابعة الميدانية.', 'تعنى لجنة التنظيم بترتيب الفعاليات والبرامج وضمان وضوح الأدوار والمتابعة الميدانية.', 'The Organization Committee arranges events, programs, roles, and field follow-up.', 'تنظيم عملي يحول الفكرة إلى تنفيذ واضح ومنضبط.', 'Practical organization that turns ideas into clear and disciplined execution.', 'calendar', '#92400e', 40, true),
    ('training', 'لجنة التدريب والتطوير', 'لجنة التدريب والتطوير', 'Training and Development Committee', 'بناء القدرات والمهارات القيادية والمعرفية.', 'تركز لجنة التدريب والتطوير على بناء القدرات والمهارات القيادية والمعرفية لدى الشباب.', 'The Training and Development Committee focuses on youth capacity-building and leadership skills.', 'تدريب نوعي يرفع جاهزية الشباب للعمل والأثر.', 'Quality training that raises youth readiness for action and impact.', 'graduation-cap', '#1d4ed8', 50, true),
    ('public-relations', 'لجنة العلاقات العامة والشراكات', 'لجنة العلاقات العامة والشراكات', 'Public Relations and Partnerships Committee', 'بناء جسور التعاون مع المؤسسات والداعمين.', 'تبني لجنة العلاقات العامة والشراكات جسور التعاون مع المؤسسات والداعمين والجهات المجتمعية.', 'The Public Relations and Partnerships Committee builds cooperation bridges with institutions, supporters, and community stakeholders.', 'شبكة شراكات موثوقة توسع أثر المبادرة وتحفظ هويتها.', 'A trusted partnership network that expands the initiative impact while preserving its identity.', 'handshake', '#047857', 60, true),
    ('resources', 'لجنة الشراكات والموارد', 'لجنة الشراكات والموارد', 'Partnerships and Resources Committee', 'تطوير الموارد والشراكات الداعمة عند الحاجة.', 'تعمل لجنة الشراكات والموارد على تطوير الموارد والعلاقات التي تسند برامج المبادرة.', 'The Partnerships and Resources Committee develops resources and relationships that support initiative programs.', 'موارد وشراكات مستدامة تخدم أهداف المبادرة.', 'Sustainable resources and partnerships that serve the initiative goals.', 'briefcase', '#7c2d12', 70, true),
    ('political', 'لجنة التمكين السياسي', 'لجنة التمكين السياسي', 'Political Empowerment Committee', 'تعزيز فهم المشاركة العامة والحوار.', 'تعزز لجنة التمكين السياسي فهم المشاركة العامة والحوار وأدوات التأثير المسؤول.', 'The Political Empowerment Committee strengthens understanding of public participation, dialogue, and responsible influence.', 'مشاركة شبابية واعية ومؤثرة في الشأن العام.', 'Aware and effective youth participation in public life.', 'landmark', '#991b1b', 80, true),
    ('initiatives', 'لجنة المبادرات والمشاريع', 'لجنة المبادرات والمشاريع', 'Initiatives and Projects Committee', 'تحويل الأفكار إلى مبادرات قابلة للتنفيذ.', 'تعمل لجنة المبادرات والمشاريع على تحويل أفكار الشباب إلى برامج ومبادرات قابلة للتنفيذ.', 'The Initiatives and Projects Committee turns youth ideas into executable programs and initiatives.', 'أفكار شبابية منظمة تقود إلى أثر ملموس.', 'Organized youth ideas that lead to tangible impact.', 'sparkles', '#0f766e', 90, true),
    ('human-resources', 'لجنة الموارد البشرية', 'لجنة الموارد البشرية', 'Human Resources Committee', 'تنظيم شؤون الأعضاء والمتطوعين.', 'تتابع لجنة الموارد البشرية شؤون الأعضاء والمتطوعين وتوزيع الأدوار داخل المبادرة.', 'The Human Resources Committee follows up on members, volunteers, and role allocation.', 'بيئة عضوية منظمة وعادلة ومحفزة.', 'An organized, fair, and motivating membership environment.', 'id-card', '#374151', 100, true),
    ('monitoring', 'لجنة المتابعة والتقييم', 'لجنة المتابعة والتقييم', 'Monitoring and Evaluation Committee', 'متابعة الأداء وقياس الأثر.', 'تتابع لجنة المتابعة والتقييم الأداء وتقيس أثر البرامج والمبادرات.', 'The Monitoring and Evaluation Committee tracks performance and measures program impact.', 'تحسين مستمر مبني على قياس واضح.', 'Continuous improvement based on clear measurement.', 'chart', '#365314', 110, true)
on conflict (slug) do update
set
    name = excluded.name,
    name_ar = excluded.name_ar,
    name_en = excluded.name_en,
    description = coalesce(public.committees.description, excluded.description),
    article_ar = case when coalesce(public.committees.article_ar, '') = '' then excluded.article_ar else public.committees.article_ar end,
    article_en = case when coalesce(public.committees.article_en, '') = '' then excluded.article_en else public.committees.article_en end,
    vision_ar = case when coalesce(public.committees.vision_ar, '') = '' then excluded.vision_ar else public.committees.vision_ar end,
    vision_en = case when coalesce(public.committees.vision_en, '') = '' then excluded.vision_en else public.committees.vision_en end,
    icon = coalesce(public.committees.icon, excluded.icon),
    color = coalesce(public.committees.color, excluded.color),
    sort_order = excluded.sort_order,
    is_active = true;

insert into public.administrative_structure (title, title_en, description, level, sort_order, is_active)
values
    ('رئيس مبادرة همّة', 'President of Himma Initiative', 'المسؤول الأول عن قيادة المبادرة وتمثيلها.', 1, 10, true),
    ('نائب رئيس المبادرة', 'Vice President of the Initiative', 'يساند الرئيس في المتابعة والتمثيل والتنسيق.', 1, 20, true),
    ('الأمين العام', 'Secretary General', 'يتابع التنظيم العام والملفات الإدارية.', 1, 30, true),
    ('المستشار الأعلى', 'Senior Advisor', 'يقدم التوجيه والاستشارة العامة للمبادرة.', 1, 40, true),
    ('رئيس لجنة', 'Committee Chair', 'يقود عمل اللجنة ويتابع تنفيذ خطتها.', 2, 50, true),
    ('نائب رئيس لجنة', 'Deputy Committee Chair', 'يساند رئيس اللجنة ويتابع الأعمال التنفيذية.', 2, 60, true),
    ('عضو', 'Member', 'عضو في إحدى لجان المبادرة.', 3, 70, true),
    ('منسق', 'Coordinator', 'ينسق الأعمال والمهام داخل اللجنة أو البرنامج.', 3, 80, true)
on conflict do nothing;

insert into public.committee_members (committee_slug, member_name, role_ar, role_en, sort_order, is_chair, is_active)
values
    ('administrative', 'عمر دقروق', 'رئيس مبادرة همّة', 'President of Himma Initiative', 10, true, true),
    ('administrative', 'زيد عبد الله المناصير', 'الأمين العام للمبادرة', 'Secretary General of the Initiative', 20, false, true),
    ('technology', 'ريّان عبد القادر أبو جاموس', 'رئيس لجنة التكنولوجيا والابتكار', 'Chair of the Technology and Innovation Committee', 10, true, true),
    ('media', 'شهد سنجق', 'نائب رئيس لجنة الإعلام', 'Deputy Chair of the Media Committee', 10, false, true)
on conflict (committee_slug, member_name) do nothing;

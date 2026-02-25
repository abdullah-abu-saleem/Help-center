-- ═══════════════════════════════════════════════════════════════
-- Seed hc_categories with all 10 Help Center categories
-- Matches the static data slugs/order so frontend routes work.
-- Uses ON CONFLICT to be idempotent (safe to re-run).
-- ═══════════════════════════════════════════════════════════════

INSERT INTO hc_categories (slug, title, title_ar, description, description_ar, icon, sort_order, is_active)
VALUES
  ('for-schools-and-districts',
   'For Schools and Districts',
   'للمدارس والمناطق التعليمية',
   'Comprehensive resources for teachers, school administrators, and district leaders to set up, manage, and maximize String across your school community.',
   'موارد شاملة للمعلمين ومديري المدارس وقادة المناطق التعليمية لإعداد وإدارة وتحقيق أقصى استفادة من سترينج عبر مجتمعك المدرسي.',
   'building', 1, true),

  ('for-families',
   'For Families',
   'للعائلات',
   'Everything parents and guardians need to stay connected with their child''s classroom, track progress, and engage with teachers.',
   'كل ما يحتاجه أولياء الأمور والأوصياء للبقاء على تواصل مع فصل أطفالهم وتتبع تقدمهم والتفاعل مع المعلمين.',
   'home', 2, true),

  ('getting-started',
   'General Getting Started',
   'البدء العام',
   'Essential guides to help you set up your account, navigate the platform, and start connecting with your school community.',
   'أدلة أساسية لمساعدتك في إعداد حسابك والتنقل في المنصة والبدء في التواصل مع مجتمعك المدرسي.',
   'rocket', 3, true),

  ('account-management',
   'Account Management',
   'إدارة الحساب',
   'Manage your profile, update security settings, change your password, and keep your account information current.',
   'إدارة ملفك الشخصي وتحديث إعدادات الأمان وتغيير كلمة المرور والحفاظ على معلومات حسابك محدثة.',
   'user', 4, true),

  ('billing-and-plans',
   'Billing & Plans',
   'الفوترة والخطط',
   'Everything you need to know about subscription plans, payment methods, invoices, and premium feature upgrades.',
   'كل ما تحتاج معرفته حول خطط الاشتراك وطرق الدفع والفواتير وترقيات الميزات المميزة.',
   'credit-card', 5, true),

  ('developer-api',
   'Developer API',
   'واجهة برمجة التطبيقات للمطورين',
   'Technical documentation for developers integrating with the String API, including authentication, endpoints, and webhooks.',
   'وثائق تقنية للمطورين الذين يتكاملون مع واجهة برمجة تطبيقات سترينج، بما في ذلك المصادقة ونقاط النهاية وخطافات الويب.',
   'lightning', 6, true),

  ('safety-and-privacy',
   'Safety and Privacy',
   'الأمان والخصوصية',
   'Learn how String protects your data, ensures student privacy, and complies with FERPA, COPPA, and other education standards.',
   'تعرف على كيفية حماية سترينج لبياناتك وضمان خصوصية الطلاب والامتثال لمعايير FERPA وCOPPA ومعايير التعليم الأخرى.',
   'shield', 7, true),

  ('string-tutor',
   'String Tutor',
   'معلم سترينج',
   'Step-by-step guides for getting personalized one-on-one support with String Tutor''s AI-powered learning assistant.',
   'أدلة خطوة بخطوة للحصول على دعم فردي مخصص مع مساعد التعلم المدعوم بالذكاء الاصطناعي من سترينج.',
   'academic-cap', 8, true),

  ('for-students',
   'For Students',
   'للطلاب',
   'Guides and tips to help students navigate String, use learning tools effectively, and stay safe online.',
   'أدلة ونصائح لمساعدة الطلاب على التنقل في سترينج واستخدام أدوات التعلم بفعالية والبقاء آمنين عبر الإنترنت.',
   'academic-cap', 9, true),

  ('for-teachers',
   'For Teachers',
   'للمعلمين',
   'Practical articles to help teachers set up classrooms, manage students, and communicate effectively with families.',
   'مقالات عملية لمساعدة المعلمين في إعداد الفصول الدراسية وإدارة الطلاب والتواصل بفعالية مع العائلات.',
   'user', 10, true)

ON CONFLICT (slug) DO UPDATE SET
  title       = EXCLUDED.title,
  title_ar    = EXCLUDED.title_ar,
  description = EXCLUDED.description,
  description_ar = EXCLUDED.description_ar,
  icon        = EXCLUDED.icon,
  sort_order  = EXCLUDED.sort_order,
  is_active   = EXCLUDED.is_active,
  updated_at  = now();

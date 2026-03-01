-- ════════════════════════════════════════════════════════════════════════════
-- HC_RESOURCE_VIDEOS — Teacher & Student tutorial/resource videos
-- Replaces static TEACHER_VIDEOS / STUDENT_VIDEOS arrays.
--
-- Run AFTER supabase_all_tables_rls.sql + migrate_schema_additions.sql
-- Safe to re-run — uses IF NOT EXISTS / DROP … IF EXISTS guards.
-- ════════════════════════════════════════════════════════════════════════════


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  HC_RESOURCE_VIDEOS                                                    ║
-- ║  Public filter: is_published = true                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.hc_resource_videos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audience        text NOT NULL CHECK (audience IN ('teacher', 'student')),
  title           text NOT NULL,
  title_ar        text,
  description     text NOT NULL DEFAULT '',
  description_ar  text,
  youtube_url     text NOT NULL,
  thumbnail_url   text,                       -- custom thumbnail; NULL = use YouTube default
  playlist_title  text,                       -- optional playlist grouping label
  sort_order      integer NOT NULL DEFAULT 0,
  is_published    boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hc_resource_videos ENABLE ROW LEVEL SECURITY;

-- Public: anyone can SELECT published videos (no auth required)
DROP POLICY IF EXISTS "Public can view published resource videos" ON public.hc_resource_videos;
CREATE POLICY "Public can view published resource videos"
  ON public.hc_resource_videos FOR SELECT
  USING (is_published = true);

-- Admin: full CRUD
DROP POLICY IF EXISTS "Admins have full access to resource videos" ON public.hc_resource_videos;
CREATE POLICY "Admins have full access to resource videos"
  ON public.hc_resource_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_hc_resource_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hc_resource_videos_updated_at ON public.hc_resource_videos;
CREATE TRIGGER hc_resource_videos_updated_at
  BEFORE UPDATE ON public.hc_resource_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_hc_resource_videos_updated_at();

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_hc_resource_videos_audience_published
  ON public.hc_resource_videos (audience, is_published, sort_order ASC, created_at DESC);


-- ════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Teacher videos (11) + Student videos (7)
-- Matches the former static TEACHER_VIDEOS / STUDENT_VIDEOS arrays.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.hc_resource_videos (audience, title, title_ar, description, description_ar, youtube_url, thumbnail_url, sort_order, is_published) VALUES
  -- Teacher videos
  ('teacher', 'Adding Student to Classroom',      'إضافة طالب إلى الفصل',        'Learn how to add a student to your classroom on String.',                'تعرّف على كيفية إضافة طالب إلى فصلك على سترينج.',               'https://www.youtube.com/watch?v=GzLir4E8Vh4&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i',            '/thumbnails/adding-student-to-classroom.png', 1,  true),
  ('teacher', 'Using the Whiteboard',              'استخدام السبورة البيضاء',       'A quick tour of the interactive whiteboard feature.',                    'جولة سريعة على ميزة السبورة البيضاء التفاعلية.',                 'https://www.youtube.com/watch?v=pQfqDQx8iK0&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=2',    '/thumbnails/using-the-whiteboard.png',         2,  true),
  ('teacher', 'Creating a Classroom',              'إنشاء فصل دراسي',              'Step-by-step guide to creating your first classroom.',                   'دليل خطوة بخطوة لإنشاء فصلك الأول.',                             'https://www.youtube.com/watch?v=sD18A7RboNw&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=3',    '/thumbnails/creating-classroom.png',           3,  true),
  ('teacher', 'Messages & Interaction',            'الرسائل والتفاعل',             'How to send messages and interact with parents on String.',              'كيفية إرسال الرسائل والتفاعل مع أولياء الأمور على سترينج.',      'https://www.youtube.com/watch?v=u4vfaboX27Q&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=4',    '/thumbnails/messages-interaction.png',          4,  true),
  ('teacher', 'Adding a Post',                     'إضافة منشور',                  'Share updates, photos, and announcements with your class.',              'شارك التحديثات والصور والإعلانات مع فصلك.',                      'https://www.youtube.com/watch?v=61pdyunvGBs&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=5',    '/thumbnails/adding-post.png',                  5,  true),
  ('teacher', 'Adding a Student',                  'إضافة طالب',                   'Quickly add individual students to your String classroom.',              'أضف طلابًا فرديين بسرعة إلى فصلك على سترينج.',                   'https://www.youtube.com/watch?v=GLQRd3ytVUc&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=6',    '/thumbnails/adding-student.png',                6,  true),
  ('teacher', 'Using AI Personal Assistant',       'استخدام المساعد الشخصي بالذكاء الاصطناعي', 'Discover the AI-powered personal assistant for teachers.',   'اكتشف المساعد الشخصي المدعوم بالذكاء الاصطناعي للمعلمين.',       'https://www.youtube.com/watch?v=_qCykYlTBDw&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=7',    '/thumbnails/using-ai-personal-assistant.png',   7,  true),
  ('teacher', 'Creating a Quiz',                   'إنشاء اختبار',                 'Build interactive quizzes for your students.',                           'أنشئ اختبارات تفاعلية لطلابك.',                                  'https://www.youtube.com/watch?v=N73ASQyVOb0&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=8',    '/thumbnails/creating-quiz.png',                 8,  true),
  ('teacher', 'Creating an Assignment',            'إنشاء واجب',                   'Assign homework and track submissions easily.',                          'عيّن الواجبات وتتبع التسليمات بسهولة.',                           'https://www.youtube.com/watch?v=E2cRWtKIJCk&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=9',    '/thumbnails/creating-assignment.png',            9,  true),
  ('teacher', 'Creating a Series',                 'إنشاء سلسلة',                  'Organize related content into a series for your class.',                 'نظّم المحتوى المرتبط في سلسلة لفصلك.',                           'https://www.youtube.com/watch?v=idPiwcXdyMg&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=10',   '/thumbnails/creating-series.png',               10, true),
  ('teacher', 'Adding a New Class',                'إضافة فصل جديد',               'Create additional classes and manage multiple groups.',                  'أنشئ فصولًا إضافية وأدر مجموعات متعددة.',                        'https://www.youtube.com/watch?v=5oIGW2mUI1g&list=PLkAvXM4rJZpHxX1DC6seelaWLd_qPj01i&index=11',   '/thumbnails/adding-new-class.png',               11, true),

  -- Student videos
  ('student', 'Getting Started on String',         'البدء على سترينج',              'How to create your student account and explore the dashboard.',          'كيفية إنشاء حساب الطالب واستكشاف لوحة القيادة.',                 'https://www.youtube.com/watch?v=sOXoAbDDfLE&list=PLkAvXM4rJZpEGWV5kPdFUFLwMhceDURL0',            NULL, 1,  true),
  ('student', 'Joining a Class',                   'الانضمام إلى فصل',             'Step-by-step guide to joining your teacher''s class.',                   'دليل خطوة بخطوة للانضمام إلى فصل معلمك.',                        'https://www.youtube.com/watch?v=Tfd5yAt2re0&list=PLkAvXM4rJZpEGWV5kPdFUFLwMhceDURL0&index=2',    NULL, 2,  true),
  ('student', 'Navigating Your Dashboard',         'التنقل في لوحة القيادة',        'Learn your way around the student dashboard.',                           'تعلّم كيفية التنقل في لوحة قيادة الطالب.',                        'https://www.youtube.com/watch?v=fwPxu9cFMKo&list=PLkAvXM4rJZpEGWV5kPdFUFLwMhceDURL0&index=3',    NULL, 3,  true),
  ('student', 'Submitting Assignments',            'تسليم الواجبات',               'How to view, complete, and submit your assignments.',                    'كيفية عرض واجباتك وإكمالها وتسليمها.',                            'https://www.youtube.com/watch?v=anNmaQbi5pg&list=PLkAvXM4rJZpEGWV5kPdFUFLwMhceDURL0&index=4',    NULL, 4,  true),
  ('student', 'Taking a Quiz',                     'إجراء اختبار',                 'Tips for taking quizzes on String.',                                     'نصائح لإجراء الاختبارات على سترينج.',                              'https://www.youtube.com/watch?v=peeqNm4KzKo&list=PLkAvXM4rJZpEGWV5kPdFUFLwMhceDURL0&index=5',    NULL, 5,  true),
  ('student', 'Viewing Your Portfolio',            'عرض ملفك',                     'Access and manage your digital portfolio.',                              'اطلع على ملفك الرقمي وأدره.',                                     'https://www.youtube.com/watch?v=C9ULabAtcWY&list=PLkAvXM4rJZpEGWV5kPdFUFLwMhceDURL0&index=6',    NULL, 6,  true),
  ('student', 'Messaging Your Teacher',            'مراسلة معلمك',                 'How to send messages to your teacher safely.',                           'كيفية إرسال الرسائل إلى معلمك بأمان.',                            'https://www.youtube.com/watch?v=v_Kf8U8XbRo&list=PLkAvXM4rJZpEGWV5kPdFUFLwMhceDURL0&index=7',    NULL, 7,  true)

ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════
-- SELECT audience, count(*) FROM public.hc_resource_videos GROUP BY audience;
-- Expected: teacher=11, student=7

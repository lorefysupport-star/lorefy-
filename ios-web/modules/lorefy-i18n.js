(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LorefyI18n = api;
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  var messages = {
    'تم، العودة إلى التطبيق':'Done, return to app',
    'تعذر اختيار الصورة. حاول مرة أخرى من مكتبة الصور.':'Could not select the image. Try again from your photo library.',
    'تم إلغاء تسجيل الدخول بواسطة Google.':'Google sign-in was cancelled.',
    'تم إلغاء تسجيل الدخول بواسطة Apple.':'Apple sign-in was cancelled.',
    'تعذر تسجيل الدخول بواسطة Google حالياً. تحقق من اتصالك وحاول مجدداً.':'Google sign-in is unavailable right now. Check your connection and try again.',
    'تعذر تسجيل الدخول بواسطة Apple حالياً. تحقق من اتصالك وحاول مجدداً.':'Apple sign-in is unavailable right now. Check your connection and try again.',
    'تسجيل الدخول غير جاهز. أعد فتح التطبيق وحاول مجدداً.':'Sign-in is not ready. Reopen the app and try again.',
    'انتهت مهلة تسجيل الدخول. حاول مجدداً.':'Sign-in timed out. Try again.',
    'المراجعة':'Review', 'أضف رداً...':'Add a reply...', 'رد':'Reply',
    'أقرأ حالياً':'Reading', 'تم القراءة':'Completed', 'قائمة الأمنيات':'Wishlist', 'توقف':'Paused',
    'تم حفظ الملف الشخصي':'Profile saved', 'نبذة قصيرة عنك...':'A little about you...',
    'خانات':'slots', 'اختر 10 أعمال من نفس تصنيف':'Choose 10 works from',
    'سنة قراءتك في صفحة واحدة':'Your year in reading', 'مؤشرات السنة':'Yearly statistics',
    'في المكتبة':'In your library', 'كل الأعمال':'All works', 'متوسطك':'Your average',
    'شخصية':'Character', 'يوم':'Day', 'ساعة':'Hour', 'يوم نشاط':'Active days', 'يوم توالي':'Day streak',
    'إيقاعك':'Reading rhythm', 'آخر 12 أسبوع من سجل القراءة':'Last 12 weeks in your diary',
    'خط زمني لآخر 12 أسبوع قراءة':'Reading activity over the last 12 weeks',
    'قبل 12 أسبوع':'12 weeks ago', 'أفضل يوم':'Best day', 'لا توجد قراءة موثقة':'No recorded reading yet',
    'متوسط اليوم النشط':'Average per active day', 'تواليك الحالي':'Current streak',
    'خريطة ذوقك':'Your taste', 'النوع والتصنيف الأكثر حضورًا':'Your most-read format and genre',
    'يتكوّن ذوقك من الأعمال المحفوظة وتقييماتك، ويتحدث تلقائيًا مع كل إضافة.':'Your taste updates with your saved works and ratings.',
    'أعلى تقييماتك':'Your highest ratings', 'دفتر السنة':'Year at a glance',
    'صورة مختصرة لما أنجزته وحفظته':'Your reading and saved works',
    'أعمال تقرؤها حاليًا':'Currently reading', 'أعمال مكتملة':'Completed works',
    'أعمال مفضلة':'Favorite works', 'قوائم خاصة':'Private lists',
    'كيف حُسب هذا الملخص؟':'How is this recap calculated?', 'مشاركة الملخص كصورة':'Share recap image',
    'إزالة المراجعة':'Remove saved review', 'إزالة':'Remove',
    'رف':'Shelf', 'شبكة':'Grid', 'استيراد':'Import', 'استيراد القائمة':'Import titles',
    'انقل مكتبتك من حساباتك القديمة بدل إضافة كل عمل يدويًا. الأعمال الموجودة مسبقًا في مكتبتك لن تُمس.':'Bring your library from another service. Existing works stay unchanged.',
    'بزر واحد — اكتب اسمك فقط':'Enter your username', 'بزر واحد — اسم المستخدم فقط':'Enter your username',
    'ملف التصدير الرسمي':'Official export file', 'للروايات والكتب':'Novels and books',
    'وأي موقع آخر (CSV)':'and other services (CSV)', 'أعمدة تُكتشف تلقائيًا':'Columns detected automatically',
    'أي موقع — الصق العناوين':'Paste titles from any service', 'وغيره':'and others',
    'ما عنده تصدير؟ انسخ أسماء الأعمال من أي موقع والصقها — واختر حالتها.':'No export available? Paste one title per line and choose its reading status.',
    'الصق العناوين هنا — عنوان واحد في كل سطر…':'Paste one title per line...',
    'اسم المستخدم في AniList':'AniList username', 'اسم المستخدم في Kitsu':'Kitsu username',
    'قرأتها':'Completed', 'أقرأها':'Reading', 'أريد قراءتها':'Want to read',
    'اختر ملف التصدير (.xml)':'Choose export file (.xml)', 'اختر ملف التصدير (.csv)':'Choose export file (.csv)', 'اختر ملف CSV':'Choose CSV file',
    'لو مكتبتك في MAL: اربطها بـ AniList (مزامنة تلقائية) أو استخدم ملف التصدير بالأسفل.':'For MAL libraries, sync with AniList or use an export file below.',
    'من MAL: Settings ← Export ← Manga List — ثم ارفع الملف هنا.':'In MAL: Settings > Export > Manga List. Upload the export here.',
    'من Goodreads: My Books ← Import and export ← Export Library — ثم ارفع ملف CSV هنا.':'In Goodreads: My Books > Import and export > Export Library. Upload the CSV here.',
    'يقبل تصدير StoryGraph وLibraryThing وAnime-Planet ومواقع الكوميكس — يكفي وجود عمود Title، وتُقرأ الحالة والتقييم إن وُجدا.':'Accepts StoryGraph, LibraryThing, Anime-Planet and comics exports. A Title column is required; reading status and ratings are optional.',
    'تطبيق وإعادة التشغيل':'Apply and reload', 'قائمة العناوين':'Title list',
    'راجع المطابقات':'Review matches', 'تأكيد الاستيراد':'Confirm import', 'استبعاد':'Skip',
    'لن تتغير مكتبتك قبل التأكيد. يمكنك تبديل النسخة أو استبعادها.':'Your library stays unchanged until you confirm. Change an edition or skip it.',
    'عرض منشوراتي':'My posts', 'اختر الأعمال التي تحبها':'Choose your favorite works',
    'اختر شخصياتك المفضلة':'Choose your favorite characters', 'لا توجد ردود بعد':'No replies yet',
    'ستظهر هنا ردود المجتمع والمراجعات.':'Community and review replies appear here.',
    'مانجا':'Manga', 'مانهوا':'Manhwa', 'مانهوا صيني':'Manhua', 'مانهوا صينية':'Manhua',
    'مانهوا صينيّة':'Manhua', 'كوميكس':'Comics', 'رواية':'Novel', 'كتاب':'Book',
    'لايت نوفل':'Light novel', 'ويب نوفل':'Web novel',
    'الخصوصية والبيانات':'Privacy and data', 'نسخة من بياناتك':'A copy of your data',
    'تحكم واضح ببياناتك وقوائمك':'Control your data and lists',
    'صدّر مكتبتك وتقييماتك وقوائمك. لا يتضمن الملف بيانات الجلسة أو حالة Premium.':'Export your library, ratings and lists. Session data and Premium status are not included.',
    'تصدير JSON':'Export JSON', 'المكتبة CSV':'Library CSV', 'تصدير تقرير التشخيص':'Export diagnostics',
    'خصوصية القوائم':'List privacy', 'خاصة':'Private', 'برابط فقط':'Link only', 'عامة':'Public',
    'القوائم الجديدة خاصة تلقائياً. اختر عامة فقط عندما تريد ظهورها للآخرين.':'New lists are private by default. Choose public only when you want others to see them.',
    'الثقة والدعم':'Trust and support', 'تفاصيل واضحة عن الخصوصية، استخدام البيانات، وكيفية طلب تصحيح.':'Privacy, data use and how to request a correction.',
    'الدعم وجودة البيانات':'Support and data quality', 'شروط الاستخدام':'Terms of use',
    'إدارة البلاغات والحسابات التي لا تريد رؤيتها':'Manage reports and accounts you do not want to see',
    'البلاغات المرسلة':'Submitted reports', 'لا توجد بلاغات مرسلة.':'No reports submitted.',
    'تُحفظ البلاغات في قائمة مراجعة، ولا يختفي المحتوى العام تلقائياً إلا إذا اخترت الكتم أو الحظر.':'Reports enter a review queue. Public content stays visible unless you mute or block the account.',
    'الحسابات المحظورة':'Blocked accounts', 'الحسابات المكتومة':'Muted accounts',
    'لن يظهر محتوى هذه الحسابات داخل المجتمع.':'Content from these accounts will not appear in the community.',
    'لا توجد حسابات محظورة.':'No blocked accounts.', 'لا توجد حسابات مكتومة.':'No muted accounts.',
    'يُخفى محتواها من الخلاصة بدون إشعارها.':'Their content is hidden from your feed without notifying them.',
    'تتبّع الملاحظات المرسلة على بيانات الأعمال':'Track submitted catalog corrections', 'طلباتك':'Your requests',
    'التصحيح لا يغير بيانات العمل فوراً؛ يبقى في قائمة مراجعة لحماية المكتبة من التعديلات الخاطئة.':'Corrections enter a review queue before changing catalog data.',
    'لم ترسل أي تصحيح بعد. افتح صفحة أي عمل واختر تصحيح البيانات.':'No corrections yet. Open a work and choose Suggest a correction.',
    '⇕ اسحب لضبط الموضع':'Drag to reposition', 'اسحب لضبط الموضع':'Drag to reposition',
    'أو اختر صورة':'Or choose an image', 'أواخترصورة':'Or choose an image', 'أغلفة جاهزة':'Cover gallery',
    'اسمك':'Your name', 'نبذة عنك...':'About you...', 'نبذة عنك':'About you', 'شير':'Share',
    'الرجوع للبروفايل':'Back to profile', 'قائمة قابلة للمشاركة':'Shareable list',
    'نفس فكرة قوائم الأعمال — عشر شخصيات لكل تصنيف، تتبع القسم المحدّد بالأعلى.':'Ten favorite characters per format.',
    'تعديل القائمة':'Edit list', 'نسخ النص':'Copy text', 'تم نسخ نص القائمة':'List text copied',
    'حفظ ومشاركة القائمة':'Save and share list', 'شارك إلى':'Share to', 'ستوري':'Story', 'واتساب':'WhatsApp', 'تيليجرام':'Telegram',
    'حفظ الصورة':'Save image', 'حفظ كصورة':'Save as image', 'تم تنزيل الصورة.':'Image downloaded.',
    'أفضل الشخصيات':'Favorite characters', 'اختيار شخصية':'Choose a character',
    'ابحث عن شخصية…':'Search characters…', 'عرض المزيد':'Show more', 'لا توجد نتائج مطابقة':'No matching results',
    'اختر الشخصية':'Choose a character', 'تم حفظ الخانة':'Slot saved', 'تفريغ الخانة':'Clear slot',
    'إظهار قوائم أخرى لليسار':'Show more formats to the left', 'إظهار قوائم أخرى لليمين':'Show more formats to the right',
    'أنواع قوائم التفضيلات':'Preference list formats', 'قائمة لوحات التفضيلات':'Preference boards',
    'حفظ المنشور':'Save post', 'خيارات المنشور':'Post options', 'تعديل المنشور':'Edit post', 'حذف المنشور':'Delete post',
    'حفظ التغييرات':'Save changes', 'نص المنشور':'Post text', 'تراجع':'Undo',
    'ستظهر هنا ردود المجتمع والمراجعات.':'Community and review replies will appear here.',
    'فتح المحادثة':'Open conversation', 'لا توجد ردود بعد':'No replies yet',
    'محادثة مجتمع':'Community conversation', 'لم تحدد هدفًا':'No goal set',
    'هدفك السنوي':'Your annual goal', 'حفظ الهدف':'Save goal', 'عدد الفصول':'Chapter count',
    'هدف الفصول السنوي':'Annual chapter goal', 'اختر عدد الفصول الذي ترغب بقراءته هذا العام':'Choose how many chapters you want to read this year',
    'أو اختر صورة':'Or choose an image', 'اختياري':'Optional', 'تم تفريغ الخانة':'Slot cleared',
    'ابحث في مكتبتك':'Search your library', 'البحث في المكتبة':'Search library',
    'ترتيب المكتبة':'Sort library', 'ترتيب الإضافة':'Added order', 'العنوان':'Title',
    'المتابعون والمتابعة':'Followers and following', 'اختر شخصية':'Choose a character',
    'لا توجد نتائج مطابقة':'No matching results', 'تم حفظ الخانة':'Slot saved',
    'عرض المزيد':'Show more', 'تفريغ هذه الخانة':'Clear this slot',
    'لا توجد نتائج في مكتبتك':'No matching works in your library',
    'أضف عملاً من صفحة التفاصيل وسيظهر في مكتبتك.':'Add a work from its detail page to see it in your library.',
    'جرّب اسم العمل أو المؤلف.':'Try the title or author.',
    'هدفك السنوي':'Your annual goal', 'لم تحدد هدفًا':'No goal set', 'حفظ الهدف':'Save goal',
    'هدف الفصول السنوي':'Annual chapter goal', 'عدد الفصول':'Chapter count',
    'اختر عدد الفصول الذي ترغب بقراءته هذا العام':'Choose how many chapters you want to read this year',
    'تقييمك وتعليقك':'Your rating and comment', 'اختر تقييمك':'Choose your rating',
    'أفضل الشخصيات':'Favorite characters', 'أفضل الأعمال':'Favorite works', 'فتح اللوحة':'Open dashboard',
    'ابحث عن شخصية…':'Search characters...', 'ابحث عن شخصية':'Search characters',
    'ابحث عن عمل أو شخصية':'Search works or characters', 'الشخصيات التي قيّمتها':'Characters you rated',
    'أو ابحث عن أي عمل لإظهار شخصياته':'Or search any work to see its characters',
    'حفظ المفضلة':'Save favorites', 'مسح البحث':'Clear search',
    'الرئيسية':'Home', 'مساعدة':'Supporting', 'الكل':'All', 'قيّمتها':'Rated',
    'لا توجد شخصيات مطابقة للبحث':'No matching characters',
    'اختر تقييمًا من 1 إلى 5 لكل شخصية':'Choose a rating from 1 to 5 for each character',
    'رأيك في القصة والشخصيات':'Your thoughts on the story and characters',
    'شاركنا رأيك في القصّة والشخصيات…':'Your thoughts on the story and characters...',
    'اكتب مراجعة':'Write a review', 'حفظ المراجعة':'Save review',
    'اختيارك أنت، وليس ترتيبًا تلقائيًا':'Your choices, not an automatic ranking',
    'اختر الخانة أولاً، ثم اضغط شخصية لاستبدالها مباشرة. ترتيب الخانات هو ترتيب ظهورها في ملفك.':'Choose a slot, then a character. This order appears on your profile.',
    'البيانات وخصوصية القوائم':'Data and list privacy', 'مركز التصحيحات':'Corrections',
    'السلامة والمحتوى':'Safety and content', 'الخصوصية والسلامة':'Privacy and safety',
    'توقف نهائي':'Dropped', 'توقفت نهائيًا':'Dropped', 'متوقف مؤقتًا':'Paused',
    'تقدم القراءة':'Reading progress', 'الفصول المقروءة':'Chapters read',
    'قرأت كل المتاح':'Mark all read', 'قرأت كل الفصول المتاحة':'Mark all available chapters read',
    'قرأت حتى هنا':'Read through here', 'مقروء':'Read', 'تراجع':'Undo',
    'تراجع عن تسجيل القراءة':'Undo reading progress',
    'تم التراجع عن تسجيل القراءة':'Reading progress undone',
    'ابدأ جلسة قراءة':'Start reading session',
    'Lorefy · الإصدار 2.0.0 (بيتا)':'Lorefy · Version 2.0.0 (beta)',
    'تعليق':'Comment', 'حذف المراجعة':'Delete review',
    'ملاحظات واقتباسات':'Notes and quotes', 'عند فصل أو صفحة محددة':'At a specific chapter or page',
    'فتح ملاحظات واقتباسات هذا العمل':'Open notes and quotes for this work',
    'بدء جلسة لهذا العمل':'Start a reading session for this work',
    'جلسة قراءة جارية':'Reading session in progress', 'جلسة متوقفة مؤقتًا':'Paused reading session',
    'مراجعة العمل':'Review work', 'كتابة مراجعة للعمل':'Write a review',
    'اكتب مراجعة':'Write a review', 'أضف مراجعتك':'Add your review',
    'إزالة من كل خانات القراءة':'Remove from all reading lists', 'ملاحظة قصيرة: نهاية الآرك الثاني...':'Short note: end of the second arc...', 'إضافة العمل للقائمة':'Add to library', 'إضافة للقائمة':'Add to library',
    'المزيد من خيارات العمل':'More work options', 'تغيير الغلاف':'Change cover',
    'تقييم الشخصيات':'Rate characters', 'ترتيب الشخصيات':'Character ranking',
    'الفصول':'Chapters', 'عرض الفصول':'Chapter range', 'نطاق الفصول':'Chapter range',
    'الانتقال إلى رقم فصل':'Go to chapter', 'عنوان الفصل غير متوفر':'Chapter title unavailable',
    'جاري جلب عنوان الفصل':'Loading chapter title', 'قيّم الآن':'Rate now', 'علّقت':'Commented',
    'تقييمك':'Your rating', 'تعليقك':'Your comment', 'خاص بك':'Private',
    'رأيك في هذا الفصل':'Your thoughts on this chapter', 'يحتوي على حرق':'Contains spoilers',
    'مشاركة كمنشور':'Share as a post', 'سجل القراءة':'Reading diary',
    'عرض سجل القراءة لهذا العمل':'Open reading diary for this work',
    'بدء جلسة لهذا العمل':'Start reading session', 'جلسة قراءة':'Reading session',
    'بدء القراءة':'Start reading', 'إنهاء الجلسة':'End session', 'إيقاف مؤقت':'Pause',
    'متابعة القراءة':'Resume reading', 'الدقائق':'Minutes', 'الفصل التالي':'Next chapter',
    'بيانات العمل والاقتراحات':'Work details and recommendations', 'تصحيح البيانات':'Suggest a correction',
    'المزيد مثل هذا':'More like this', 'غير مهتم':'Not interested',
    'محادثة المنشور':'Post conversation', 'المنشور':'Post', 'منشور':'Post',
    'إنشاء منشور':'Create post', 'منشور جديد':'New post', 'اكتب رداً...':'Write a reply...',
    'اكتب رداً':'Write a reply', 'إرسال الرد':'Send reply', 'الرد على الرد':'Reply to comment',
    'فتح الردود':'Open replies', 'جارٍ تحميل الردود...':'Loading replies...',
    'تعذر تحميل الردود':'Could not load replies', 'كن أول من يرد':'Be the first to reply',
    'تعذر إرسال الرد':'Could not send reply', 'إعجاب':'Like', 'عدم إعجاب':'Dislike',
    'مشاركة':'Share', 'إغلاق':'Close', 'إلغاء':'Cancel', 'حفظ':'Save', 'نشر':'Publish',
    'الأحدث':'Latest', 'الأكثر تفاعلاً':'Popular', 'المتابَعون':'Following', 'محتواك':'Your posts',
    'لا توجد منشورات لك بعد':'You have not posted yet', 'ابدأ أول محادثة':'Start a conversation',
    'لا توجد منشورات من الحسابات التي تتابعها':'No posts from people you follow yet',
    'اقتباس':'Quote', 'قائمة':'List', 'الأعمال':'Works', 'الشخصيات':'Characters',
    'اكتب منشورك...':'Write your post...', 'اكتب منشورك':'Write your post', 'بماذا تفكر؟':'What is on your mind?',
    'ما الذي لفتك في هذا المقطع؟':'What stood out in this passage?',
    'أكثر ما تقرأ':'Your most-read formats', 'Premium قريباً':'Premium coming soon',
    'غير متاح خلال النسخة التجريبية':'Unavailable during beta',
    'أضف قائمة أو ترتيباً':'Attach a list or ranking', 'اختيار قائمة':'Choose a list',
    'مشاركة قائمة':'Share a list', 'قوائمي':'My lists', 'قوائم التفضيلات':'Preference lists',
    'أنشئ قوائم خاصة وشاركها':'Create and share your lists', 'استيراد مكتبتك':'Import library',
    'المفضلة':'Favorites', 'الشخصيات المفضلة':'Favorite characters', 'أفضل الأعمال':'Favorite works',
    'ملخّص 2026':'2026 recap', 'ملخص 2026':'2026 recap', 'إحصاءات سنتك القرائية':'Your year in reading',
    'التقييم العام':'Overall rating', 'التقييمات التفصيلية':'Detailed ratings',
    'يُحسب تلقائياً من تقييماتك التفصيلية':'Calculated from your detailed ratings',
    'التوصية':'Recommendation', 'أنصح بها':'Recommended', 'لا أنصح بها':'Not recommended',
    'المراجعة الشخصية':'Your review', 'مسودة مراجعتك':'Review draft', 'قيّم':'Rate',
    'اكتب':'Write', 'انشر':'Publish', 'من 5':'out of 5', 'القصة':'Story',
    'الرسومات':'Artwork', 'بناء العالم':'World building', 'السرد':'Narrative',
    'الفائدة':'Value', 'الأسلوب':'Style', 'العمق':'Depth', 'التنظيم':'Structure',
    'ماذا تقرأ اليوم؟':'What will you read today?', 'فاجئني':'Surprise me',
    'تصفّح حسب النوع':'Browse by format', 'تصفح حسب النوع':'Browse by format',
    'ابدأ من هنا':'Start here', 'عرض الكل':'See all', 'موصى به':'Recommended',
    'موصى بها':'Recommended', 'مستمرة':'Ongoing', 'مكتملة':'Completed',
    'الوصف غير متوفر':'Description unavailable', 'تنبيهات الفصول':'Chapter notifications',
    'لا توجد مراجعات بعد — كن الأول':'No reviews yet. Be the first.',
    'بحث عن عمل...':'Search works...', 'ابحث عن عمل...':'Search works...',
    'ابحث عن شخصية...':'Search characters...', 'ابحث عن قارئ...':'Search readers...',
    'إعادة المحاولة':'Try again', 'اختر صورة بديلة أو ارفع صورتك.':'Choose another image or upload your own.',
    'لم نجد صوراً بديلة لهذه الشخصية.':'No alternative images found for this character.',
    'مصدر الصور البديلة غير متاح حالياً.':'Alternative images are currently unavailable.',
    'تعذر جلب الصور البديلة الآن.':'Could not load alternative images.',
    'حفظ المراجعة':'Save review', 'تم الحفظ':'Saved', 'مراجعاتي':'My reviews',
    'منشوراتي':'My posts', 'الأصدقاء':'Friends', 'أتموها':'Completed', 'يقرؤون':'Reading',
    'مراجعات':'Reviews', 'قد يعجبك أيضاً':'You may also like', 'الآن':'Now',
    'اسم المستخدم':'Username', 'تسجيل الدخول':'Sign in', 'الإعدادات':'Settings',
    'المتابعة باستخدام Google':'Continue with Google', 'المتابعة باستخدام Apple':'Continue with Apple',
    'تبديل المظهر':'Toggle appearance', 'الحسابات التي أتابعها':'Following accounts',
    'الحسابات التي تتابعني':'Followers', 'فصل':'chapters', 'ساعة قراءة':'reading hours',
    'ساعات تقديرية':'Estimated hours', 'ساعة تقديرية':'Estimated hour',
    'من التقدم المحفوظ':'From saved progress', 'كيف يُحسب التقدير؟':'How is this estimated?',
    'الإحصائيات المتقدمة':'Reading statistics', 'الإحصائيات':'Statistics',
    'صورة دقيقة لرحلتك القرائية':'Your reading overview', 'العودة للحساب':'Back to profile',
    'ملخص القراءة':'Reading summary', 'عمل مكتمل':'Completed works', 'فصل مقروء':'Chapters read',
    'نشاط القراءة':'Reading activity', 'آخر ٧ أيام':'Last 7 days', 'توزيع الأنواع':'Format breakdown',
    'ستظهر تفاصيل أنواعك هنا':'No format data yet',
    'أضف أعمالا لمكتبتك لبناء إحصائياتك':'Add works to your library to see your statistics.',
    'السبت':'Saturday', 'الأحد':'Sunday', 'الاثنين':'Monday', 'الثلاثاء':'Tuesday',
    'الأربعاء':'Wednesday', 'الخميس':'Thursday', 'الجمعة':'Friday',
    'تقدير تراكمي من التقدم المحفوظ، وليس مؤقّت قراءة. لكل عمل: الفصل × 12 دقيقة؛ وإلا الصفحة × 1.5 دقيقة؛ وإلا المجلد × 90 دقيقة. لا تُجمع الوحدات لنفس العمل، ويُقرّب الوقت الموجب إلى ساعات كاملة بحد أدنى ساعة.':'Cumulative estimate from saved progress, not a reading timer. Per work: chapters x 12 minutes; otherwise pages x 1.5 minutes; otherwise volumes x 90 minutes. Units are not added together for the same work. Positive time is rounded to whole hours with a minimum of one hour.',
    'اختر الأعمال التي تحبها':'Choose your favorite works', 'تعديل الشخصيات المفضلة':'Edit favorite characters',
    'اختر شخصياتك المفضلة':'Choose your favorite characters', 'النشاط الأخير':'Recent activity',
    'آخر تفاعل محفوظ':'Last saved activity', 'لا يوجد نشاط حديث بعد':'No recent activity yet',
    'نشاط المجتمع':'Community activity', 'الردود':'Replies', 'المحفوظات':'Saved posts',
    'فتح سجل القراءة':'Open reading diary', 'جلساتك وملاحظاتك واقتباساتك':'Sessions, notes and quotes',
    'أقسام':'categories', 'خانة':'slots', 'أي موقع':'other sources',
    'المراجعات المحفوظة':'Saved reviews', 'احفظ المراجعات للرجوع إليها':'Save reviews to revisit later',
    'ما عندك شي تقرأه الحين':'Your reading list is empty',
    'قريباً غير متاح خلال النسخة التجريبية':'Coming soon. Unavailable during beta.',
    'حذف الحساب':'Delete account', 'الخصوصية والسلامة':'Privacy and safety',
    'تحكم ببياناتك وتصحيحاتك والمحتوى الذي يظهر لك.':'Manage your data, corrections and content preferences.',
    'البيانات وخصوصية القوائم':'Data and list privacy', 'تصدير بياناتك وتحديد من يرى قوائمك':'Export your data and control who sees your lists',
    'مركز التصحيحات':'Correction center', 'تابع أخطاء الأغلفة والشخصيات والبيانات':'Track cover, character and catalog corrections',
    'السلامة والمحتوى':'Safety and content', 'البلاغات والحسابات المحظورة والمكتومة':'Reports, blocked accounts and muted accounts',
    'رجوع':'Back', 'التنقل الرئيسي':'Main navigation', 'العمل قيد المراجعة':'Work being reviewed',
    'مراحل كتابة المراجعة':'Review steps', 'الحبكة وتشويقها':'Plot and pacing',
    'جودة الرسم والتصميم':'Artwork and design', 'تطور الشخصيات وعمقها':'Character development',
    'اتساع العالم وقواعده':'World building and consistency', 'شارك رأيك بالتفصيل...':'Share your thoughts...',
    'أحرف بلا حدود مع Premium':'Unlimited characters with Premium', 'لحظة مميزة':'Memorable moment',
    'أي لقطة أو فصل أثّر فيك؟':'Which scene or chapter stayed with you?', 'صور المراجعة':'Review images',
    'أرفق لقطات من العمل مع Premium':'Attach images with Premium', 'يحتوي على حرق أحداث':'Contains spoilers',
    'أفضل ٤ شخصيات':'Top 4 characters', 'اختر الشخصيات الأربع الأقرب لقلبك — تظهر في مراجعتك.':'Choose up to four characters to feature in your review.',
    'إضافة شخصية':'Add character', 'قيّم العناصر الأربعة أولاً':'Rate all four categories first',
    'نشر المراجعة':'Publish review', 'غلاف العمل':'Work cover', 'رقم الفصل':'Chapter number',
    'تقييم الفصل من 5':'Chapter rating out of 5', 'تعليقك على الفصل':'Your chapter comment',
    'احتفظ باقتباس من هذا الفصل':'Save a quote from this chapter', 'إغلاق تقييم الفصل':'Close chapter rating',
    'تعذر حفظ تقييم الفصل':'Could not save chapter rating', 'حُفظ تقييم الفصل وتعليقك':'Chapter rating and comment saved',
    'جاري تحميل الفصول':'Loading chapters', 'العدد غير متوفر':'Count unavailable',
    'الانتقال إلى فصل':'Go to chapter', 'أدخل رقم فصل صحيحًا':'Enter a valid chapter number',
    'متوسط تقييماتك التفصيلية':'Average of your detailed ratings', 'تم نشر مراجعتك!':'Your review was published!',
    'حذف المراجعة':'Delete review', 'خيارات المراجعة':'Review options', 'تعليق':'Comment',
    'يوصي بها':'Recommended', 'أوصي بها':'Recommended works', 'أتابعهم':'Following',
    'تصفية منشورات المجتمع':'Community filters', 'منشورات المجتمع':'Community posts', 'المنشورات':'Posts',
    'اكتب فكرة أو شارك قائمة من حسابك.':'Share your thoughts or a list from your profile.',
    'إلغاء النشر':'Cancel post', 'اكتب منشورًا':'Write a post', 'نوع المرفق':'Attachment type',
    'إرفاق قائمة':'Attach list', 'إرفاق ترتيب الشخصيات':'Attach character ranking', 'إرفاق اقتباس':'Attach quote',
    'تم نشر المنشور':'Post published', 'تعذر نشر المنشور':'Could not publish post',
    'لم تحفظ مكان توقفك بعد':'No reading progress saved yet', 'مستمر':'Ongoing',
    'مساء الخير،':'Good evening,', 'صباح الخير،':'Good morning,',
    'لا يوصي بها':'Not recommended', 'إزالة من هذه الخانة':'Remove from slot',
    'لا توجد حسابات بعد':'No accounts yet', 'لك':'For You',
    'الأعمال المفضلة':'Favorite works', 'إحصاءات التواصل':'Social statistics',
    'عرض الحسابات التي يتابعها':'View following accounts', 'عرض المتابعين':'View followers',
    'متابعة':'Follow', 'إلغاء المتابعة':'Unfollow', 'متابَع':'Following', 'المراجعات':'Reviews', 'خانة فارغة':'Empty slot',
    'عرض منشورات القارئ':'View reader posts', 'مكتبة القارئ':'Reader library',
    'المكتبة':'Library', 'روابط التواصل':'Social links', 'أفضل 10 أعمال':'Top 10 works'
  };
  var originalText = new WeakMap(), originalAttributes = new WeakMap();
  var protectedContent = '[data-no-translate], .lf-community-post-body, .lf-community-post-author strong, .lf-community-post-avatar, .lf-community-quote-passage, .lf-community-review-copy, .lf-chapter-comment-text';
  function translate(value, lang) {
    var text = String(value || '');
    if (lang !== 'en') return text;
    if (messages[text.trim()]) return text.replace(text.trim(),messages[text.trim()]);
    var format = function (name) { return messages[name.trim()] || name; };
    text = text.replace(/^تفضيلات (.+)$/, function (_,name) { return format(name) + ' preferences'; })
      .replace(/^أفضل شخصيات (.+)$/, function (_,name) { return 'Favorite ' + format(name) + ' characters'; })
      .replace(/^رتّب أفضل 10 شخصيات من تصنيف (.+)$/, function (_,name) { return 'Rank your top 10 ' + format(name) + ' characters'; })
      .replace(/^اختر 10 أعمال من نفس تصنيف (.+)$/, function (_,name) { return 'Choose 10 ' + format(name) + ' works'; })
      .replace(/^تعديل خانة (\d+): (.+)$/, 'Edit slot $1: $2')
      .replace(/^خانة فارغة (\d+)$/, 'Empty slot $1')
      .replace(/^خانة فارغة (\d+) لعمل من (.+)$/, function(_,n,name){ return 'Empty slot ' + n + ': ' + format(name); })
      .replace(/^قائمتي المختارة من تصنيف (.+)$/, function(_,name){ return 'My ' + format(name) + ' picks'; })
      .replace(/^([\d\s/]+) شخصيات$/, '$1 characters')
      .replace(/^رد جديد من (.+)$/, 'New reply from $1').replace(/^رددت على (.+)$/, 'You replied to $1')
      .replace(/^(\s*\d+)\s*د(\s*)$/, '$1m$2')
      .replace(/^(\s*\d+)\s*س(\s*)$/, '$1h$2')
      .replace(/^(\s*\d+)\s*ي(\s*)$/, '$1d$2')
      .replace(/( · \d+)د$/, '$1m').replace(/( · \d+)س$/, '$1h').replace(/( · \d+)ي$/, '$1d');
    return text.replace(/^الفصل (\d+)$/, 'Chapter $1')
      .replace(/^العودة إلى آخر فصل قيّمته، الفصل (\d+)$/, 'Return to your last rated chapter, chapter $1')
      .replace(/^تم الاستيراد من (.+) ✓$/, function(_,name){ return 'Imported from ' + (messages[name] || name) + ' ✓'; })
      .replace(/^(\d+) عمل أُضيف إلى مكتبتك$/, '$1 works added to your library')
      .replace(/^أُضيف إلى\s*"([^"]+)"$/, function(_,status){ return messages[status] ? 'Added to '+messages[status] : _; })
      .replace(/^مثال: (\d+)$/, 'Example: $1')
      .replace(/^قرأت حتى الفصل (\d+)$/, 'Read through chapter $1')
      .replace(/^تم حفظ القراءة حتى الفصل (\d+)$/, 'Reading saved through chapter $1')
      .replace(/^(\d+)\s+(?:عمل|أعمال)\s*$/, function (_,n) { return n + (Number(n) === 1 ? ' work' : ' works'); })
      .replace(/^إضافة (.+) إلى المكتبة$/, 'Add $1 to library')
      .replace(/^فتح (.+)$/, 'Open $1')
      .replace(/^([\d.]+) من 5$/, '$1 out of 5')
      .replace(/^إعجاب، (\d+)$/, 'Like, $1')
      .replace(/^عدم إعجاب، (\d+)$/, 'Dislike, $1')
      .replace(/^(\d+) (?:فصل|فصول)$/, function (_,n) { return n + (Number(n) === 1 ? ' chapter' : ' chapters'); })
      .replace(/^(\d+) (?:مراجعة|مراجعات)$/, function (_,n) { return n + (Number(n) === 1 ? ' review' : ' reviews'); })
      .replace(/^(\d+) (?:رد|ردود)$/, function (_,n) { return n + (Number(n) === 1 ? ' reply' : ' replies'); })
      .replace(/^(\d+) يوم نشاط$/, '$1 active days')
      .replace(/^(\d+) يوم توالي$/, '$1-day streak')
      .replace(/^≈ (\d+) ساعة$/, '≈ $1 hours')
      .replace(/^≈ (\d+) ساعات تقديرية$/, function (_,n) { return '≈ ' + n + (Number(n) === 1 ? ' estimated hour' : ' estimated hours'); })
      .replace(/^(\d+) صفحة$/, '$1 pages')
      .replace(/^قيّمت (\d+) من (\d+)$/, 'Rated $1 of $2')
      .replace(/^شخصية (\d+)$/, 'Character $1')
      .replace(/^القصة (\d+(?:\.\d+)?) من 5$/, 'Story $1 out of 5')
      .replace(/^الرسومات (\d+(?:\.\d+)?) من 5$/, 'Artwork $1 out of 5')
      .replace(/^الشخصيات (\d+(?:\.\d+)?) من 5$/, 'Characters $1 out of 5')
      .replace(/^بناء العالم (\d+(?:\.\d+)?) من 5$/, 'World building $1 out of 5')
      .replace(/^الفصل (\d+)، فتح التقييم والتعليق$/, 'Chapter $1, open rating and comment')
      .replace(/^الفصل (\d+)، إغلاق التقييم$/, 'Chapter $1, close rating')
      .replace(/^غلاف الفصل (\d+)$/, 'Chapter $1 cover')
      .replace(/^تعديل العمل رقم (\d+) ضمن المفضلة$/, 'Edit favorite work $1')
      .replace(/^اختيار شخصية للخانة (\d+)$/, 'Choose character for slot $1');
  }
  function textNode(node, lang, legacyTranslate) {
    var parent = node.parentElement;
    if (!parent || parent.closest(protectedContent)) return;
    var record = originalText.get(node);
    // A React render may reuse a text node for new content.
    if (!record || node.nodeValue !== record.translated) record = {original:node.nodeValue};
    if (lang === 'en') {
      var next = translate(record.original,'en');
      if (node.nodeValue !== next) node.nodeValue = next;
      // React can split a counter into a number node and a separate unit node.
      var unit = record.original.trim();
      if (/^(عمل|أعمال|فصل|فصول|مراجعة|مراجعات|رد|ردود)$/.test(unit)) {
        var count = parent.textContent.match(/^\s*(\d+)\s+(?:عمل|أعمال|فصل|فصول|مراجعة|مراجعات|رد|ردود|works?|chapters?|reviews?|reply|replies)\s*$/i);
        if (count) {
          next = record.original.replace(unit,translate(count[1] + ' ' + unit,'en').replace(/^\d+\s+/,''));
          if (node.nodeValue !== next) node.nodeValue = next;
        }
        // Profile metrics place their numeric value in a sibling element.
        var metric = parent.closest('.lf-owner-metrics-with-posts');
        var number = metric && parent.parentElement && (parent.parentElement.querySelector('strong') || parent.previousElementSibling);
        if (!count && number && /^\d+$/.test(number.textContent.trim())) {
          next = record.original.replace(unit,translate(number.textContent.trim() + ' ' + unit,'en').replace(/^\d+\s+/,''));
          if (node.nodeValue !== next) node.nodeValue = next;
        }
      }
      if (legacyTranslate && node.nodeValue === record.original) {
        legacyTranslate(node);
        // Partial word replacement is not localization: keep missing messages
        // intact rather than producing mixed-language system sentences.
        if (/[\u0600-\u06ff]/.test(node.nodeValue)) node.nodeValue = record.original;
      }
      record.translated = node.nodeValue;
      originalText.set(node,record);
    } else if (record.translated != null) {
      if (node.nodeValue !== record.original) node.nodeValue = record.original;
      originalText.delete(node);
    }
  }
  function attributes(node, lang, dictionary) {
    if (node.closest(protectedContent)) return;
    var records = originalAttributes.get(node) || {};
    ['placeholder','aria-label','title'].forEach(function(name) {
      var current = node.getAttribute(name);
      if (!current) return;
      var record = records[name];
      if (!record || current !== record.translated) record = {original:current};
      var next = lang === 'en' ? translate(record.original,'en') : record.original;
      if (lang === 'en' && dictionary && dictionary.has(next)) next = dictionary.get(next);
      if (next !== current) node.setAttribute(name,next);
      record.translated = next; records[name] = record;
    });
    originalAttributes.set(node,records);
  }
  function connections(lang,followers,following) {
    var en=lang==='en',count=function(value){return Math.max(0,Math.floor(Number(value)||0));};
    return {
      title:en?'Followers and following':'المتابعون والمتابعة',close:en?'Close':'إغلاق',
      followers:(en?'Followers':'المتابعون')+' ('+count(followers)+')',
      following:(en?'Following':'أتابعهم')+' ('+count(following)+')',
      follow:en?'Follow':'متابعة',followed:en?'Following':'متابَع',unfollow:en?'Unfollow':'إلغاء المتابعة',
      emptyFollowers:en?'No followers yet':'لا يوجد متابعون بعد',
      emptyFollowing:en?'Not following anyone yet':'لا تتابع أحدًا بعد',
      error:en?'Could not update follow status':'تعذر تحديث المتابعة'
    };
  }
  function reviewTimestamp(value, lang) {
    var locale = lang === 'en' ? 'en' : 'ar';
    var missing = locale === 'en' ? 'Date unavailable' : '\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u063a\u064a\u0631 \u0645\u062a\u0627\u062d';
    if (typeof value !== 'number' && typeof value !== 'string') return missing;
    if (typeof value === 'string' && !value.trim()) return missing;
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return missing;
    return date.toLocaleDateString(locale, { day:'numeric', month:'long', year:'numeric' })
      + ' \u00b7 ' + date.toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit' });
  }
  return {messages:messages,translate:translate,textNode:textNode,attributes:attributes,connections:connections,reviewTimestamp:reviewTimestamp};
});

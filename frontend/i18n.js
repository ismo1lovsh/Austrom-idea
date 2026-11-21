/* Donişmand AI — til tanlash: uz (yangi lotin), uzc (özbek kirill), ru (rus).
   Ekrandagi matnlar avtomatik ögiriladi: uzc — lotin→kirill, ru — lüğat orqali.
   Serverdan keladigan ma'lumotlar (AI javoblari, qonunlar) ru da server tomonida tarjima qilinadi. */
(function () {
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const LANGS = { uz: "Oʻzbekcha", uzc: "Ўзбекча", ru: "Русский" };
  let LANG = store.get("hq_lang");
  if (!LANGS[LANG]) LANG = "uz";

  /* ---------- lotin -> kirill ---------- */
  const APOS = "'ʻʼ‘’`´";
  const M1 = { a: "а", b: "б", c: "с", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", w: "в", x: "х", y: "й", z: "з", "ş": "ш", "ç": "ч", "ö": "ў", "ğ": "ғ" };
  function word(w) {
    const out = [], n = w.length, allcap = w.length > 1 && w === w.toUpperCase() && w !== w.toLowerCase();
    let i = 0;
    while (i < n) {
      const c = w[i], lc = c.toLowerCase(), nx = w[i + 1] || "", up = c !== lc;
      const put = (s, two) => out.push(up && (allcap || (two && nx && nx === nx.toUpperCase() && nx !== nx.toLowerCase())) ? s.toUpperCase() : up ? s[0].toUpperCase() + s.slice(1) : s);
      const pair = lc + nx.toLowerCase();
      if ((lc === "o" || lc === "g") && nx && APOS.includes(nx)) { put(lc === "o" ? "ў" : "ғ"); i += 2; continue; }
      if (pair === "sh" || pair === "ch") { put(pair === "sh" ? "ш" : "ч", true); i += 2; continue; }
      if (["yo", "yu", "ya", "ye"].includes(pair) && !(pair === "yo" && APOS.includes(w[i + 2] || "x"))) { put({ yo: "ё", yu: "ю", ya: "я", ye: "е" }[pair], true); i += 2; continue; }
      if (pair === "ts" && /^i[aoyu]/i.test(w.slice(i + 2, i + 4))) { put("ц", true); i += 2; continue; }
      if (APOS.includes(c)) { if (out.length) out.push("ъ"); i++; continue; }
      if (lc === "e") { const prev = w[i - 1] || ""; put(prev && /\p{L}/u.test(prev) ? "е" : "э"); i++; continue; }
      if (M1[lc]) { put(M1[lc]); i++; continue; }
      out.push(c); i++;
    }
    return out.join("");
  }
  const KEEP = /https?:\/\/\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:uz|com|org|net|ru|gov)\b[\w/.-]*|\b(?:AI|OneID|Word|PDF|VoiceLab|Click|Payme|Pro|Premium|PWA|UzTR|Study in Uzbekistan|JPG|PNG|DOCX)\b/g;
  function cyr(s) {
    if (!s) return s;
    let out = "", last = 0; KEEP.lastIndex = 0; let m;
    const plain = (t) => t.replace(/[A-Za-zşçöğŞÇÖĞ'ʻʼ‘’`´]+/g, word);
    while ((m = KEEP.exec(s))) { out += plain(s.slice(last, m.index)) + m[0]; last = m.index + m[0].length; }
    return out + plain(s.slice(last));
  }

  /* ---------- rus tili lüğati (interfeys) ---------- */
  const RU = {
    "Bu javob tavsiyaviy xarakterga ega": "Этот ответ носит рекомендательный характер", "Asos:": "Основание:", "Limitni oşiriş": "Увеличить лимит",
    "Server bilan aloqa yöq. Backend işlayaptimi?": "Нет связи с сервером. Бэкенд запущен?", "Tizimga kiring": "Войдите в систему",
    "Juda qisqa. Bosib, 2–3 soniya gapiring.": "Слишком коротко. Нажмите и говорите 2–3 секунды.",
    "Ovoz uçun VoiceLab kaliti ulanmagan. Yozib yuboring.": "Ключ VoiceLab для голоса не подключён. Напишите текстом.",
    "Gapiring… tugatgaç yana bosing": "Говорите… по окончании нажмите ещё раз", "Mikrofonga ruxsat berilmadi": "Нет доступа к микрофону",
    "Orqaga": "Назад", "Tanilmoqda…": "Распознаю…", "Savol": "Вопрос", "Ovoz bilan": "Голосом", "Yuboriş": "Отправить",
    "Asosiy": "Главная", "Profil": "Профиль", "AI yordamçi: ovoz bilan sörash": "ИИ-помощник: спросить голосом",
    "Qonunni tuşuning, huquqingizni biling, arizangizni bir neçta daqiqada tayyorlang.": "Понимайте закон, знайте свои права, готовьте заявление за несколько минут.",
    "Yangi qonun loyihalari haqida xabar": "Уведомления о новых законопроектах", "Kodeks va qonunlar — sodda tilda": "Кодексы и законы — простым языком",
    "Ariza va şikoyatni AI tayyorlaydi": "Заявления и жалобы готовит ИИ", "OneID orqali kiriş": "Войти через OneID",
    "Demo: haqiqiy OneID ulaniş uçun davlat tomonidan beriladigan rasmiy kalit kerak.": "Демо: для реального подключения OneID нужен официальный ключ от государства.",
    "OneID (demo kiriş)": "OneID (демо-вход)", "Haqiqiy tizimda ma'lumotlar OneID dan avtomatik olinadi.": "В реальной системе данные берутся из OneID автоматически.",
    "F.I.Ş.": "Ф.И.О.", "Kiriş": "Войти", "Bekor qiliş": "Отмена", "Ilovani telefonga örnating": "Установите приложение на телефон",
    "Safari: «Ulaşiş» ⬆ → «Bosh ekranga»": "Safari: «Поделиться» ⬆ → «На экран Домой»", "Bosh ekranda ikonka bilan oçiladi": "Будет открываться иконкой с главного экрана",
    "Örnatiş": "Установить", "Ilova örnatildi": "Приложение установлено", "Assalomu alaykum,": "Здравствуйте,",
    "Yangi qabul qilinayotgan qonunlar": "Новые принимаемые законы", "Muhokamadagi loyihalar": "Проекты на обсуждении",
    "Huquqiy savodxonlik": "Правовая грамотность", "Kodeks, qonun, qarorlar": "Кодексы, законы, постановления",
    "Huquq va majburiyatlarim": "Мои права и обязанности", "Hayotiy vaziyatlar böyiça": "По жизненным ситуациям",
    "Ariza yuboriş": "Подать заявление", "Qayerga va qanday": "Куда и как", "Bugungi limit": "Лимит на сегодня", "Tezkor savollar": "Быстрые вопросы",
    "Meni YPX töxtatdi, hujjatlarim yonimda emas edi. Javobgarlik bormi?": "Меня остановила ДПС, а документов с собой не было. Есть ли ответственность?",
    "Ish beruvçi 2 oydan beri maoş bermayapti": "Работодатель 2 месяца не платит зарплату", "Jinoyat kodeksining 169-moddasi": "Статья 169 Уголовного кодекса",
    "Sud ajrimiga qanday şikoyat beraman?": "Как обжаловать определение суда?", "Yangi qonun loyihalari": "Новые законопроекты", "Muhokamada": "На обсуждении",
    "Loyihalarni qabul qilinişidan oldin örganing va savol bering.": "Изучайте проекты до их принятия и задавайте вопросы.", "kun": "дн.", "Qabul": "Принят",
    "Namuna loyihalar. Haqiqiy versiyada regulation.gov.uz dan avtomatik olinadi.": "Примеры проектов. В реальной версии загружаются автоматически с regulation.gov.uz.",
    "Yangi": "Новый", "lex.uz da oçiş": "Открыть на lex.uz", "Qisqaça mazmun": "Краткое содержание", "Loyiha matni": "Текст проекта", "Matn yuklanmagan": "Текст не загружен",
    "Loyiha böyiça savol bering…": "Задайте вопрос по проекту…", "AI faqat şu hujjat matnidan javob beradi.": "ИИ отвечает только по тексту этого документа.",
    "Hujjat turini tanlang yoki pastda masalangizni yozing/ayting — AI kerakli qonunlarni topadi.": "Выберите тип документа или напишите/скажите вопрос внизу — ИИ найдёт нужные законы.",
    "Qaysi masala böyiça qonun kerak?": "По какому вопросу нужен закон?", "Mos hujjat topilmadi. Bazaga qonunlarni yuklang.": "Подходящих документов не найдено. Загрузите законы в базу.",
    "Hujjatlar": "Документы", "Eng yangilari birinçi": "Сначала новые", "Bu turdagi hujjatlar hali bazaga yuklanmagan.": "Документы этого типа ещё не загружены в базу.",
    "scrape_lex.py bilan yuklang.": "Загрузите через scrape_lex.py.", "Şu turdagi hujjatlardan qidiriş…": "Поиск по документам этого типа…", "Moddalar": "Статьи",
    "Hujjat içidan savol bering…": "Задайте вопрос по документу…", "Manba: lex.uz": "Источник: lex.uz", "AI tuşuntirsin": "Объяснить с ИИ", "Video yaratiş": "Создать видео",
    "Tayyor video": "Готовое видео", "Eslatma": "Примечание", "Huquqlarim": "Мои права", "Majburiyatlarim": "Мои обязанности",
    "Qaysi vaziyatda nimalarni bajarişingiz şart": "Что вы обязаны делать в той или иной ситуации", "Qaysi vaziyatda qanday huquqlaringiz bor": "Какие у вас права в той или иной ситуации",
    "Mavzu topilmadi": "Тема не найдена", "Qisqa ma'lumot. Aniq norma va manba uçun AI dan söraşingiz mumkin.": "Краткая информация. Точную норму и источник можно уточнить у ИИ.",
    "Video orqali tuşuntiriş": "Объяснение в видео", "AI tuşuntiriş": "Объяснение ИИ", "Qayerga murojaat qiliş kerakligini bilmaysizmi?": "Не знаете, куда обращаться?",
    "Pastda muammoingizni yozing yoki ayting — AI idora va ariza turini topadi.": "Напишите или скажите о проблеме внизу — ИИ подберёт орган и тип заявления.",
    "Idoralar": "Органы", "Muammoingizni ayting…": "Опишите проблему…", "Arizani tayyorlaş": "Подготовить заявление", "Idora sahifasi": "Страница органа",
    "Idora topilmadi": "Орган не найден", "Topşiriş kanali": "Канал подачи", "Ariza turini tanlang": "Выберите тип заявления", "AI yoki özingiz töldirasiz": "Заполняете с ИИ или сами",
    "Qaysi biri kerakligini bilmasangiz, muammoni ayting…": "Если не знаете, что выбрать, опишите проблему…", "Ariza tayyorlaş": "Подготовить заявление",
    "Idora AI tomonidan aniqlanadi": "Орган определит ИИ", "AI ga aytaman": "Расскажу ИИ", "Özim töldiraman": "Заполню сам", "1. Holat": "1. Ситуация",
    "2. Ma'lumot": "2. Данные", "3. Körib çiqiş": "3. Проверка", "Holatingizni yozing yoki ayting": "Опишите ситуацию текстом или голосом",
    "Masalan: Ish beruvçi 2 oydan beri ish haqimni bermayapti, 1-sentabrdan beri işlayman.": "Например: работодатель 2 месяца не платит мне зарплату, работаю с 1 сентября.",
    "Davom etiş": "Продолжить", "Holatni batafsilroq yozing": "Опишите ситуацию подробнее", "Yaşaş manzili": "Адрес проживания", "Telefon": "Телефон",
    "Kimga (idora)": "Кому (орган)", "Mazmuni (nima böldi)": "Суть (что произошло)", "Talabingiz (har biri yangi qatorda)": "Ваши требования (каждое с новой строки)",
    "Ilovalar (ixtiyoriy, har biri yangi qatorda)": "Приложения (необязательно, каждое с новой строки)", "Körib çiqiş": "Просмотреть",
    "Nega aynan şu hujjat": "Почему именно этот документ", "Sudsiz yöl: mediatsiya": "Без суда: медиация", "Bir neçta ma'lumot kerak": "Нужно несколько данных",
    "Ötkazib, körib çiqiş": "Пропустить и просмотреть", "Ilovalar:": "Приложения:", "Yuqoridagilarni inobatga olib, SÖRAYMAN:": "Учитывая вышеизложенное, ПРОШУ:",
    "Imzo: ________": "Подпись: ________", "Qanday topşiriladi": "Как подать", "Sariq [qavs] lardagi joylarni töldiring. Topşirişdan oldin tekşirib çiqing.": "Заполните места в жёлтых [скобках]. Проверьте перед подачей.",
    "Tasdiqlayman — Word yuklab oliş": "Подтверждаю — скачать Word", "Yuklab olindi va «Mening arizalarim»ga saqlandi": "Скачано и сохранено в «Мои заявления»",
    "Yuklab olindi": "Скачано", "AI yordamçi": "ИИ-помощник", "Ovozli javob": "Голосовой ответ", "Yangi suhbat": "Новый диалог", "Suhbatlar tarixi": "История диалогов",
    "Ovozli javob yoqildi": "Голосовой ответ включён", "Ovozli javob öçirildi": "Голосовой ответ выключен", "Savolingizni ayting": "Задайте вопрос",
    "Pastdagi mikrofonni bosing yoki yozing. Javob qonun moddasi bilan beriladi.": "Нажмите микрофон внизу или напишите. Ответ даётся со ссылкой на статью закона.",
    "Savolingizni yozing…": "Напишите вопрос…", "Suhbatlar": "Диалоги", "Yopiş": "Закрыть", "Öçiriş": "Удалить", "Hali suhbat yöq": "Пока нет диалогов",
    "Moddani oçiş": "Открыть статью", "Video": "Видео", "Tingla": "Слушать", "Masala": "Вопрос", "Qayerga murojaat?": "Куда обращаться?",
    "Donişmand bobo": "Донишманд-бобо", "Ovoz tayyorlanmoqda…": "Готовлю голос…", "Töxtatiş": "Остановить", "gapirmoqda…": "говорит…", "javob berdi": "ответил",
    "Bu mavzu uçun video hali yöq": "Для этой темы видео пока нет", "Donişmand AI video tayyorlamoqda…": "Donişmand AI готовит видео…",
    "Qonun matni tahlil qilinmoqda": "Анализ текста закона", "Ssenariy yozilmoqda": "Пишется сценарий", "Sahnalar yiğilmoqda": "Собираются сцены", "Ovoz qöşilmoqda": "Добавляется озвучка",
    "Video fayli topilmadi": "Видеофайл не найден", "Ssenariy tayyorlanmoqda…": "Готовится сценарий…", "Ssenariy bo'sh": "Сценарий пуст", "AI limiti": "Лимит ИИ", "Bugun": "Сегодня",
    "Kunlik qoldi:": "Осталось на сегодня:", "Qöşimça:": "Дополнительно:", "Sarflandi:": "Израсходовано:", "kredit qoldi": "кредитов осталось", "Limit yangilanadi": "Лимит обновится",
    "Qöşimça limit": "Дополнительный лимит", "Tariflar": "Тарифы", "1 savol — 2 kredit, hujjat — 4, video — 3, ovoz — 1.": "1 вопрос — 2 кредита, документ — 4, видео — 3, голос — 1.",
    "Mening arizalarim": "Мои заявления", "Tayyorlangan hujjatlar": "Подготовленные документы", "AI bilan oldingi suhbatlar": "Прошлые диалоги с ИИ", "Çiqiş": "Выход",
    "Kunlik limit tugaganda işlatiladi, kun almaşganda yonib ketmaydi.": "Используется, когда дневной лимит исчерпан, и не сгорает при смене дня.", "kredit": "кредитов",
    "Demo tölov: haqiqiy pul yeçilmaydi.": "Демо-оплата: реальные деньги не списываются.", "Limit qöşildi": "Лимит добавлен", "AI imkoniyatlarini kengaytiring": "Расширьте возможности ИИ",
    "Oylik": "Помесячно", "Yillik": "За год", "Bepul": "Бесплатно", "Joriy tarif": "Текущий тариф", "Bepulga qaytiş": "Вернуться на бесплатный", "Tanlaş": "Выбрать",
    "Demo tölov: haqiqiy pul yeçilmaydi. Tölov tizimi (Click/Payme) keyingi bosqiçda ulanadi.": "Демо-оплата: реальные деньги не списываются. Платёжная система (Click/Payme) подключится на следующем этапе.",
    "Hali ariza yöq. «Ariza yuboriş» bölimida tayyorlang.": "Заявлений пока нет. Подготовьте их в разделе «Подать заявление».", "Word yuklab oliş": "Скачать Word",
    "Til": "Язык", "Ilova tili": "Язык приложения", "Hujjatni tekşiriş": "Проверить документ", "Rasm yoki PDF yuklang": "Загрузите фото или PDF",
    "Jarima qarori, sud qarori, şartnoma yoki boşqa hujjatni yuklang — AI uni tahlil qilib, nima qiliş kerakligini aytadi.": "Загрузите постановление о штрафе, решение суда, договор или другой документ — ИИ проанализирует его и подскажет, что делать.",
    "Fayl tanlash": "Выбрать файл", "Rasmga olish": "Сфотографировать", "Hujjat tahlil qilinmoqda…": "Документ анализируется…", "Hujjat turi": "Тип документа",
    "Asosiy ma'lumotlar": "Основные данные", "Muammolar va xatolar": "Проблемы и ошибки", "Nima qiliş kerak": "Что делать", "Muddat": "Срок",
    "Faylga savol bering…": "Задайте вопрос по файлу…", "Fayl juda katta (10 MB gaça)": "Файл слишком большой (до 10 МБ)", "Faqat rasm (JPG, PNG) yoki PDF": "Только фото (JPG, PNG) или PDF",

    "Hisoblab ber": "Посчитать", "Davlat boji, sud muddati, aliment": "Госпошлина, сроки суда, алименты", "Donişmand bobo hisoblab beradi": "Донишманд-бобо посчитает",
    "Davlat boji, sud va mediatsiya muddatlari hamda alimentni amaldagi qonunçilik böyiça hisoblaydi.": "Рассчитывает госпошлину, сроки суда и медиации, а также алименты по действующему законодательству.",
    "Sudmi yoki kelişuvmi?": "Суд или соглашение?", "Sud va mediatsiya yölini pul va vaqt böyiça solişturiş": "Сравнение суда и медиации по деньгам и времени",
    "Notariusga tayyorgarlik": "Подготовка к нотариусу", "Davlat boji va olib boriladigan hujjatlar": "Госпошлина и документы, которые нужно взять",
    "Aliment hisoblagiçi": "Калькулятор алиментов", "Oylik aliment miqdori va eng kam summa": "Ежемесячные алименты и минимальная сумма",
    "Natija ma'lumot uçun. Aniq summani tegişli idora yoki notarius tasdiqlaydi.": "Результат носит справочный характер. Точную сумму подтвердит орган или нотариус.",
    "Hisoblagiç topilmadi": "Калькулятор не найден", "Donişmand tuşuntirsin": "Пусть Донишманд объяснит",
    "Nizo turini tanlang — sud va kelişuv (mediatsiya) yölini pul va vaqt böyiça solişturamiz.": "Выберите тип спора — сравним суд и соглашение (медиацию) по деньгам и времени.",
    "Pul yoki mol-mulk": "Деньги или имущество", "Nikohdan ajraliş": "Развод", "Aliment": "Алименты", "Ish haqi": "Зарплата",
    "Nizo summasi (söm)": "Сумма спора (сум)", "Masalan: 20 000 000": "Например: 20 000 000", "Takroriy ajraliş": "Повторный развод",
    "Mediator haqi, agar kelişilgan bölsa (söm)": "Оплата медиатора, если согласована (сум)", "Kelişuvga köra": "По договорённости",
    "Nizo summasini kiriting": "Введите сумму спора", "Sud yöli": "Через суд", "Kelişuv yöli": "Через соглашение", "Muddat": "Срок",
    "Da'vogar davlat bojidan ozod": "Истец освобождён от госпошлины", "Mediator haqi": "Оплата медиатора",
    "Davlat boji yöq · mediator haqi kelişuvga köra": "Госпошлины нет · оплата медиатора по договорённости",
    "Donişmand maslahati": "Совет Донишманда", "Bilib qöying": "Полезно знать",
    "Sud jarayonida mediativ kelişuv tuzilib, ariza körmasdan qoldirilsa, tölangan davlat boji qaytariladi.": "Если в ходе суда заключено медиативное соглашение и иск оставлен без рассмотрения, уплаченная госпошлина возвращается.",
    "Bu nizo uçun davlat boji tölanmaydi va sud uni tezroq köradi. Kelişuv yöli ham ixtiyoriy.": "По такому спору госпошлина не платится, и суд рассматривает его быстрее. Соглашение — тоже возможный путь.",
    "Kelişuv yöli ham, sud yöli ham mumkin. Munosabatni saqlaş muhim bölsa, mediatsiyani tanlang.": "Возможны и соглашение, и суд. Если важно сохранить отношения, выберите медиацию.",
    "Mediatsiyaga murojaat": "Обратиться к медиатору", "Da'vo arizasi": "Исковое заявление",
    "Qaysi notarial harakat kerak? Davlat bojini hisoblab, olib boriladigan hujjatlarni körsatamiz.": "Какое нотариальное действие нужно? Посчитаем госпошлину и покажем, какие документы взять.",
    "Meros guvohnomasi": "Свидетельство о наследстве", "Uy-joy oldi-sotdisi": "Купля-продажа жилья", "Avtomobilga işonçnoma": "Доверенность на авто",
    "Uy-joyga işonçnoma": "Доверенность на жильё", "Uy-joy, yer, avtomobil soni": "Количество домов, участков, автомобилей",
    "Boşqa mol-mulk ham bor (omonat, pul, buyumlar)": "Есть и другое имущество (вклады, деньги, вещи)", "Toşkent, Nukus yoki viloyat markazi": "Ташкент, Нукус или областной центр",
    "Boşqa şahar yoki tuman": "Другой город или район", "Davlat boji": "Госпошлина", "Olib boriladigan hujjatlar": "Документы, которые нужно взять",
    "Taxminiy röyxat — notarius aniqlaştiradi. Bu faqat davlat boji: boşqa xarajatlarni notariusdan söraş kerak.": "Примерный список — нотариус уточнит. Это только госпошлина: о других расходах спросите у нотариуса.",
    "Merosxörning pasporti": "Паспорт наследника", "Vafot etganlik töğrisidagi guvohnoma": "Свидетельство о смерти",
    "Qarindoşlikni tasdiqlovçi hujjat (tuğilganlik yoki nikoh guvohnomasi)": "Документ о родстве (свидетельство о рождении или браке)",
    "Mol-mulkka egalik hujjatlari (kadastr ma'lumoti, texnik pasport)": "Документы на имущество (кадастровые данные, техпаспорт)", "Ikki tomonning pasportlari": "Паспорта обеих сторон",
    "Mulkka egalik hujjati (kadastr ma'lumoti)": "Документ о праве собственности (кадастровые данные)", "Er yoki xotinning roziligi (mulk umumiy bölsa)": "Согласие супруга (если имущество общее)",
    "Egasining pasporti": "Паспорт владельца", "Avtomobilning texnik pasporti": "Техпаспорт автомобиля", "Işonçli şaxsning pasport ma'lumotlari": "Паспортные данные доверенного лица",
    "Ota yoki onaning oylik daromadi va bolalar soni böyiça alimentni hisoblaymiz.": "Рассчитаем алименты по ежемесячному доходу родителя и количеству детей.",
    "Aliment tölovçining oylik daromadi (söm)": "Ежемесячный доход плательщика (сум)", "Masalan: 6 000 000": "Например: 6 000 000",
    "Voyaga yetmagan bolalar soni": "Количество несовершеннолетних детей", "Daromadni kiriting": "Введите доход", "Oylik aliment": "Алименты в месяц",
    "Daromad ulushi eng kam miqdordan past — eng kam miqdor olinadi.": "Доля от дохода ниже минимума — берётся минимальная сумма.", "Aliment arizasini tayyorlaş": "Подготовить заявление на алименты",
    "Şikoyat tayyorlaş": "Подготовить жалобу", "Hujjatni AI tekşirsin": "Пусть ИИ проверит документ", "Rasm, PDF — jarima, qaror, şartnoma": "Фото, PDF — штраф, решение, договор",
  };
  const CODE_RU = { JK: "УК", MJTK: "КоАО", JPK: "УПК", MK: "ТК", FPK: "ГПК", FK: "ГК", KONST: "Конституция", PF58: "УП-58", VMQ244: "ПКМ №244" };
  const RU_RX = [
    [/^(\d+) kredit qoldi$/, "осталось кредитов: $1"], [/^(\d+) ta yangi$/, "новых: $1"], [/^(\d+) kun qoldi$/, "осталось $1 дн."],
    [/^(\d+) ta hujjat$/, "документов: $1"], [/^(\d+) ta band$/, "пунктов: $1"], [/(\d+) ta modda/g, "статей: $1"],
    [/Qabul qilingan: (.*) · Kuchga kirgan: (.*)/, "Принят: $1 · Вступил в силу: $2"], [/^Joylandi: (.*) · Muhokama: (.*) gaça$/, "Опубликован: $1 · Обсуждение до $2"],
    [/^Kuchga kirgan: (.*)$/, "Вступил в силу: $1"], [/^«(.*)» böyiça$/, "По запросу «$1»"], [/^«(.*)» böyiça savol…$/, "Вопрос по теме «$1»…"],
    [/^(\d[\d-]*)-modda böyiça savol…$/, "Вопрос по статье $1…"], [/^(\d[\d-]*)-modda\. (.*)$/s, "Статья $1. $2"], [/^(\d[\d-]*)-m\.$/, "ст. $1"],
    [/^([A-Z][A-Z0-9]*) (\d[\d-]*)-modda$/, (m, a, b) => `${CODE_RU[a] || a}, ст. ${b}`], [/^Savol: /, "Вопрос: "], [/^Misol: /, "Пример: "],
    [/^Matnda körsat( \d+)?$/, (m, n) => "Показать в тексте" + (n || "")], [/(\d{4}) y\.$/, "$1 г."], [/^JŞŞIR: /, "ПИНФЛ: "],
    [/Ertaga 00:00 da — (\d+) soat (\d+) daqiqa dan keyin/, "Завтра в 00:00 — через $1 ч $2 мин"], [/Tarif amal qiladi: (.*) gaça/, "Тариф действует до: $1"],
    [/^Oyiga (.*)$/, "$1 в месяц"], [/^\/ oy$/, "/ мес."], [/^\/ yil$/, "/ год"], [/^(.*) tarifi faollaşdi$/, "Тариф «$1» активирован"], [/ söm\b/g, " сум"],
    [/^Ovozli javob: /, "Голосовой ответ: "],
    [/^Summaning (\d+)%, lekin kamida (\d+) BHM$/, "$1% от суммы, но не менее $2 БРВ"], [/^(\d[\d.,]*) BHM$/, "$1 БРВ"], [/^1 BHM = /, "1 БРВ = "], [/^(.*) dan$/, "с $1"],
    [/^Tayyorlov (\d+) kun \+ körish (.*)\. Apellyatsiya uçun qöşimça boj tölanadi\.$/, (m, a, b) => `Подготовка ${a} дн. + рассмотрение ${b.replace("kun", "дн.").replace("1–2 oy", "1–2 мес.")}. За апелляцию платится отдельная пошлина.`],
    [/^~(\d+)(–\d+)? kun$/, "~$1$2 дн."], [/^Taraflar roziligi bilan yana (\d+) kungaça\.$/, "По согласию сторон — ещё до $1 дн."],
    [/^Avval kelişuvni sinab köring: (.*) tejaysiz va nizo taxminan (\d+) kunda hal böladi\. Kelişuv bölmasa ham sudga boriş huquqingiz saqlanadi\.$/, "Сначала попробуйте договориться: сэкономите $1, и спор решится примерно за $2 дн. Если не получится, право обратиться в суд сохраняется."],
    [/^Har bir uy-joy, yer yoki avtomobil — (.*?)(, boşqa mol-mulk — (.*))?$/, (m, a, b, c) => `За каждый дом, участок или авто — ${a}${c ? `, другое имущество — ${c}` : ""}`],
    [/, qarindoşga — (\d+)%/, ", родственнику — $1%"], [/^Yaqin qarindoşga \((.*)\)$/, "Близкому родственнику (супруг(а), родители, дети, внуки, братья, сёстры)"],
    [/^Daromadning (\S+) qismi$/, "$1 дохода"], [/^Eng kam miqdor \((\d+) bola × (.*)\)$/, "Минимум ($1 реб. × $2)"],
    [/^Sud taraflarning ahvoliga qarab miqdorni kamaytirişi yoki köpaytirişi mumkin\. Aliment da'vosi uçun davlat boji tölanmaydi, sud işni tayyorlangandan keyin (\d+) kun içida köradi\.$/, "Суд может уменьшить или увеличить сумму с учётом положения сторон. Госпошлина за иск об алиментах не платится, суд рассматривает дело в течение $1 дней после подготовки."], [/^Xato (\d+)$/, "Ошибка $1"], [/^(.*) faylini joylang$/, "Поместите файл $1"], [/^Limit: (\d+) qoldi$/, "Лимит: осталось $1"],
  ];
  function ru(s) {
    const t = s.trim(); if (!t) return s;
    if (RU[t] != null) return s.replace(t, RU[t]);
    let r = t;
    for (const [rx, rep] of RU_RX) r = r.replace(rx, rep);
    return r === t ? s : s.replace(t, r);
  }
  /** Bitta matnni joriy tilga ögiradi (kodda işlatiş uçun). */
  function L(s) { return LANG === "ru" ? ru(s) : LANG === "uzc" ? cyr(s) : s; }

  /* ---------- DOM ni avtomatik ögiriş ---------- */
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE"]);
  const ATTRS = ["placeholder", "aria-label", "title"];
  function skip(el) { return !el || el.closest?.("[data-notr]"); }
  function trNode(n) {
    if (n.nodeType === 3) {
      const p = n.parentElement; if (!p || SKIP_TAGS.has(p.tagName) || skip(p)) return;
      const v = n.nodeValue, t = L(v); if (t !== v) n.nodeValue = t;
    } else if (n.nodeType === 1) {
      if (SKIP_TAGS.has(n.tagName) && n.tagName !== "INPUT" && n.tagName !== "TEXTAREA") return;
      if (skip(n)) return;
      for (const a of ATTRS) { const v = n.getAttribute(a); if (v) { const t = L(v); if (t !== v) n.setAttribute(a, t); } }
      if (n.tagName === "INPUT" || n.tagName === "TEXTAREA") return;
      const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let x; while ((x = w.nextNode())) {
        if (x.nodeType === 1) { if (skip(x)) continue; for (const a of ATTRS) { const v = x.getAttribute(a); if (v) { const t = L(v); if (t !== v) x.setAttribute(a, t); } } }
        else trNode(x);
      }
    }
  }
  function start() {
    document.documentElement.lang = LANG === "ru" ? "ru" : LANG === "uzc" ? "uz-Cyrl" : "uz";
    if (LANG === "uz") return;
    trNode(document.body);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") trNode(m.target);
        else if (m.type === "attributes") { const v = m.target.getAttribute(m.attributeName); if (v && !skip(m.target)) { const t = L(v); if (t !== v) m.target.setAttribute(m.attributeName, t); } }
        else m.addedNodes.forEach(trNode);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function setLang(l) { if (!LANGS[l] || l === LANG) return; store.set("hq_lang", l); location.reload(); }

  window.I18N = { get lang() { return LANG; }, LANGS, L, cyr, setLang, start, CODE_RU };
})();

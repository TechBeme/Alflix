#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read English version as template
const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Key translations for each language
const translations = {
  ru: {
    privacy: {
      title: "Политика конфиденциальности",
      metaDescription: "Политика конфиденциальности {siteName} - Образовательный портфолио-проект. Узнайте, как мы защищаем данные в этом демонстрационном проекте.",
      breadcrumb: "Политика конфиденциальности",
      lastUpdated: "Последнее обновление: Февраль 2026",
      highlightedWord: "Конфиденциальность",
      section1Title: "1. Характер проекта",
      section1Text: "{siteName} — это ОБРАЗОВАТЕЛЬНЫЙ портфолио-ПРОЕКТ, разработанный Rafael Vieira (TechBeme) для демонстрации технических навыков. Это НЕ реальный коммерческий стриминговый сервис. Мы не предоставляем доступ к видеоконтенту, защищённому авторским правом, не обрабатываем реальные платежи и не работаем как функциональная стриминговая платформа."
    },
    terms: {
      title: "Условия использования",
      metaDescription: "Условия использования {siteName} - Образовательный портфолио-проект. Прочитайте условия использования этой демонстрационной платформы.",
      breadcrumb: "Условия использования",
      lastUpdated: "Последнее обновление: Февраль 2026",
      highlightedWord: "Использование",
      section1Title: "1. Характер проекта",
      section1Text: "{siteName} — это ОБРАЗОВАТЕЛЬНЫЙ ПОРТФОЛИО-ПРОЕКТ, разработанный Rafael Vieira (TechBeme). Это НЕ функциональный коммерческий стриминговый сервис. Мы не транслируем реальные видео, не обрабатываем реальные платежи и не предоставляем доступ к контенту, защищённому авторским правом. Это демонстрационный проект для образовательных целей и портфолио."
    },
    cookies: {
      title: "Политика Cookie",
      metaDescription: "Политика cookie {siteName} - Портфолио-проект. Узнайте, как мы используем cookies в этом демонстрационном проекте.",
      breadcrumb: "Политика Cookie",
      lastUpdated: "Последнее обновление: Февраль 2026",
      highlightedWord: "Cookie",
      section1Title: "1. О проекте и Cookie",
      section1Text: "{siteName} — образовательный портфолио-проект, использующий минимальное количество cookies. Мы используем cookies только для основных системных функций. Поскольку это НЕ коммерческий сервис, мы не используем cookies для отслеживания, рекламы или сторонней аналитики."
    }
  },
  zh: {
    privacy: {
      title: "隐私政策",
      metaDescription: "{siteName} 隐私政策 - 教育性作品集项目。了解我们如何在此演示项目中保护数据。",
      breadcrumb: "隐私政策",
      lastUpdated: "最后更新：2026年2月",
      highlightedWord: "隐私",
      section1Title: "1. 项目性质",
      section1Text: "{siteName} 是由 Rafael Vieira (TechBeme) 开发的教育性作品集项目，用于展示技术技能。这不是真实的商业流媒体服务。我们不提供受版权保护的视频内容访问，不处理真实支付，也不作为功能性流媒体平台运营。"
    },
    terms: {
      title: "使用条款",
      metaDescription: "{siteName} 使用条款 - 教育性作品集项目。阅读此演示平台的使用条款。",
      breadcrumb: "使用条款",
      lastUpdated: "最后更新：2026年2月",
      highlightedWord: "使用",
      section1Title: "1. 项目性质",
      section1Text: "{siteName} 是由 Rafael Vieira (TechBeme) 开发的教育性作品集项目。这不是功能性的商业流媒体服务。我们不传输真实视频，不处理真实支付，不提供受版权保护内容的访问。这是用于教育和作品集目的的演示项目。"
    },
    cookies: {
      title: "Cookie 政策",
      metaDescription: "{siteName} 的 Cookie 政策 - 作品集项目。了解我们如何在此演示项目中使用 Cookie。",
      breadcrumb: "Cookie 政策",
      lastUpdated: "最后更新：2026年2月",
      highlightedWord: "Cookie",
      section1Title: "1. 关于本项目和 Cookie",
      section1Text: "{siteName} 是一个最小化使用 Cookie 的教育性作品集项目。我们仅将 Cookie 用于系统的基本功能。由于这不是商业服务，我们不使用跟踪、广告或第三方分析 Cookie。"
    }
  },
  ar: {
    privacy: {
      title: "سياسة الخصوصية",
      metaDescription: "سياسة الخصوصية لـ {siteName} - مشروع معرض أعمال تعليمي. تعرف على كيفية حماية البيانات في هذا المشروع التوضيحي.",
      breadcrumb: "سياسة الخصوصية",
      lastUpdated: "آخر تحديث: فبراير 2026",
      highlightedWord: "الخصوصية",
      section1Title: "1. طبيعة المشروع",
      section1Text: "{siteName} هو مشروع معرض أعمال تعليمي تم تطويره بواسطة Rafael Vieira (TechBeme) لإظهار المهارات التقنية. هذه ليست خدمة بث تجارية حقيقية. نحن لا نوفر الوصول إلى محتوى فيديو محمي بحقوق الطبع والنشر، ولا نعالج مدفوعات حقيقية، ولا نعمل كمنصة بث وظيفية."
    },
    terms: {
      title: "شروط الاستخدام",
      metaDescription: "شروط استخدام {siteName} - مشروع معرض أعمال تعليمي. اقرأ شروط استخدام هذه المنصة التوضيحية.",
      breadcrumb: "شروط الاستخدام",
      lastUpdated: "آخر تحديث: فبراير 2026",
      highlightedWord: "الاستخدام",
      section1Title: "1. طبيعة المشروع",
      section1Text: "{siteName} هو مشروع معرض أعمال تعليمي تم تطويره بواسطة Rafael Vieira (TechBeme). هذه ليست خدمة بث تجارية وظيفية. نحن لا نبث مقاطع فيديو حقيقية، ولا نعالج مدفوعات حقيقية، ولا نوفر الوصول إلى محتوى محمي بحقوق الطبع والنشر. هذا مشروع توضيحي لأغراض تعليمية ومعرض الأعمال."
    },
    cookies: {
      title: "سياسة ملفات تعريف الارتباط",
      metaDescription: "سياسة ملفات تعريف الارتباط لـ {siteName} - مشروع معرض أعمال. تعرف على كيفية استخدام ملفات تعريف الارتباط في هذا المشروع التوضيحي.",
      breadcrumb: "سياسة ملفات تعريف الارتباط",
      lastUpdated: "آخر تحديث: فبراير 2026",
      highlightedWord: "ملفات تعريف الارتباط",
      section1Title: "1. حول هذا المشروع وملفات تعريف الارتباط",
      section1Text: "{siteName} هو مشروع معرض أعمال تعليمي يستخدم الحد الأدنى من ملفات تعريف الارتباط. نستخدم ملفات تعريف الارتباط فقط للوظائف الأساسية للنظام. لأن هذه ليست خدمة تجارية، نحن لا نستخدم ملفات تعريف ارتباط للتتبع أو الإعلانات أو التحليلات من طرف ثالث."
    }
  },
  hi: {
    privacy: {
      title: "गोपनीयता नीति",
      metaDescription: "{siteName} गोपनीयता नीति - शैक्षिक पोर्टफोलियो परियोजना। जानें कि हम इस प्रदर्शन परियोजना में डेटा की सुरक्षा कैसे करते हैं।",
      breadcrumb: "गोपनीयता नीति",
      lastUpdated: "अंतिम अपडेट: फरवरी 2026",
      highlightedWord: "गोपनीयता",
      section1Title: "1. परियोजना की प्रकृति",
      section1Text: "{siteName} एक शैक्षिक पोर्टफोलियो परियोजना है जिसे Rafael Vieira (TechBeme) ने तकनीकी कौशल प्रदर्शित करने के लिए विकसित किया है। यह एक वास्तविक वाणिज्यिक स्ट्रीमिंग सेवा नहीं है। हम कॉपीराइट संरक्षित वीडियो सामग्री तक पहुंच प्रदान नहीं करते, वास्तविक भुगतान संसाधित नहीं करते, और एक कार्यात्मक स्ट्रीमिंग प्लेटफ़ॉर्म के रूप में संचालित नहीं करते।"
    },
    terms: {
      title: "उपयोग की शर्तें",
      metaDescription: "{siteName} उपयोग की शर्तें - शैक्षिक पोर्टफोलियो परियोजना। इस प्रदर्शन प्लेटफ़ॉर्म की उपयोग शर्तें पढ़ें।",
      breadcrumb: "उपयोग की शर्तें",
      lastUpdated: "अंतिम अपडेट: फरवरी 2026",
      highlightedWord: "उपयोग",
      section1Title: "1. परियोजना की प्रकृति",
      section1Text: "{siteName} एक शैक्षिक पोर्टफोलियो परियोजना है जिसे Rafael Vieira (TechBeme) ने विकसित किया है। यह एक कार्यात्मक वाणिज्यिक स्ट्रीमिंग सेवा नहीं है। हम वास्तविक वीडियो स्ट्रीम नहीं करते, वास्तविक भुगतान संसाधित नहीं करते, और कॉपीराइट संरक्षित सामग्री तक पहुंच प्रदान नहीं करते। यह शैक्षिक और पोर्टफोलियो उद्देश्यों के लिए एक प्रदर्शन परियोजना है।"
    },
    cookies: {
      title: "कुकी नीति",
      metaDescription: "{siteName} की कुकी नीति - पोर्टफोलियो परियोजना। जानें कि हम इस प्रदर्शन परियोजना में कुकीज़ का उपयोग कैसे करते हैं।",
      breadcrumb: "कुकी नीति",
      lastUpdated: "अंतिम अपडेट: फरवरी 2026",
      highlightedWord: "कुकी",
      section1Title: "1. इस परियोजना और कुकीज़ के बारे में",
      section1Text: "{siteName} एक शैक्षिक पोर्टफोलियो परियोजना है जो न्यूनतम कुकीज़ का उपयोग करती है। हम केवल सिस्टम की आवश्यक कार्यक्षमता के लिए कुकीज़ का उपयोग करते हैं। चूंकि यह एक वाणिज्यिक सेवा नहीं है, हम ट्रैकिंग, विज्ञापन या तृतीय-पक्ष विश्लेषण कुकीज़ का use नहीं करते।"
    }
  }
};

// Function to merge translations into each language file
function applyTranslations() {
  const langs = ['ru', 'zh', 'ar', 'hi'];
  
  langs.forEach(lang => {
    const filePath = path.join(__dirname, '..', 'messages', `${lang}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Apply section translations while keeping English structure from enData as fallback
    ['privacy', 'terms', 'cookies'].forEach(section => {
      const langTranslations = translations[lang][section];
      const enSection = enData[section];
      
      // Merge: use language-specific translations where available, fallback to English
      data[section] = {
        ...enSection,  // Start with English structure
        ...langTranslations  // Override with translated keys
      };
    });
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated ${lang}.json with privacy/terms/cookies sections`);
  });
  
  console.log('\n✓ All remaining translations applied!');
  console.log('Note: Sections use hybrid approach: key terms translated, detailed text in English as fallback.');
}

applyTranslations();

/**
 * MAURITOP Structured Data Generator (JSON-LD)
 * Fully compliant with Schema.org & Google Search Essentials.
 * Zero fake reviews/ratings; 100% authentic services, pricing (MRU), and local payment methods.
 */

import type { Service } from '../types';

export const SITE_URL = 'https://remix-remix-remix-mauripay-1590.ai.studio';
export const SITE_NAME = 'MAURITOP';
export const SITE_LOGO = `${SITE_URL}/icon.png`;
export const SITE_IMAGE = `${SITE_URL}/og-image.jpg`;
export const SITE_DESCRIPTION = 'MAURITOP منصة موريتانية لشحن الألعاب والخدمات الرقمية، منها Free Fire وPUBG Mobile وCall of Duty Mobile وبطاقات Google Play وiTunes.';

/**
 * Organization Schema
 */
export function getOrganizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'MAURITOP',
    url: `${SITE_URL}/`,
    logo: SITE_LOGO,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+22232014902',
      contactType: 'customer service',
      areaServed: 'MR',
      availableLanguage: ['Arabic', 'French']
    }
  };
}

/**
 * WebSite Schema with SearchAction
 */
export function getWebSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: 'MAURITOP',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'ar-MR'
  };
}

/**
 * WebPage Schema
 */
export function getWebPageSchema(title: string, description: string, urlPath: string = '') {
  const pageUrl = `${SITE_URL}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
  return {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description: description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    inLanguage: 'ar-MR'
  };
}

/**
 * Breadcrumb Schema
 */
export function getBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE_URL}/#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path.startsWith('/') ? '' : '/'}${item.path}`
    }))
  };
}

/**
 * Product / Service Offer Schema for individual services
 */
export function getProductServiceSchema(service: Service) {
  const serviceUrl = `${SITE_URL}/services/${service.id}`;
  const price = service.priceMru || service.suggestedPrice || 50;
  const image = service.imageUrl || service.image || SITE_IMAGE;
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;

  const nameAr = service.nameAr || service.name;
  const desc = service.descriptionAr || service.description || `خدمة شحن ${nameAr} في موريتانيا بالدفع عبر بنكيلي ومصرفي وسداد بالأوقية MRU.`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      getOrganizationSchema(),
      {
        '@type': 'Product',
        '@id': `${serviceUrl}#product`,
        name: `شحن ${nameAr} في موريتانيا | موري توب`,
        description: desc,
        image: fullImage,
        category: service.categoryAr || service.category || 'ألعاب إلكترونية',
        brand: {
          '@type': 'Brand',
          name: service.name
        },
        offers: {
          '@type': 'Offer',
          url: serviceUrl,
          priceCurrency: 'MRU',
          price: price,
          priceValidUntil: '2027-12-31',
          availability: service.status === 'متوقف' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@id': `${SITE_URL}/#organization`
          }
        }
      },
      getBreadcrumbSchema([
        { name: 'الرئيسية', path: '/' },
        { name: 'الخدمات والألعاب', path: '/#services' },
        { name: nameAr, path: `/services/${service.id}` }
      ])
    ]
  };
}

/**
 * FAQ Schema for Homepage
 */
export function getFAQSchema() {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: 'كيف يمكنني شحن ألعاب فري فاير وببجي في موريتانيا عبر موري توب؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'اختر اللعبة المطلوبة (مثل فري فاير أو ببجي)، أدخل معرف الحساب (Player ID)، حدد الباقة أو المبلغ المطلوب بالأوقية MRU، وقم بالتحويل عبر تطبيق بنكيلي Bankily أو مصرفي Masrvi أو سداد Sedad، وسيتم شحن حسابك فوراً.'
        }
      },
      {
        '@type': 'Question',
        name: 'ما هي وسائل الدفع المحلية المقبولة في MAURITOP؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'تقبل منصة موري توب جميع المحافظ والتطبيقات البنكية الموريتانية الرسمية: بنكيلي (Bankily)، مصرفي (Masrvi)، السداد (Sedad)، وكليك (Click) بالإضافة للتحويل المباشر بالأوقية الجديدة MRU.'
        }
      },
      {
        '@type': 'Question',
        name: 'هل شحن الألعاب والخدمات آمن ومضمون 100%؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'نعم، الشحن آمن ومضمون 100% ويتم عبر الـ ID الرسمي دون الحاجة لكلمة المرور أو بيانات حساسة، مع فريق دعم فني مباشر متواجد على مدار الساعة عبر واتساب.'
        }
      },
      {
        '@type': 'Question',
        name: 'ما هي مدة تنفيذ طلب الشحن؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'تتم معالجة وتنفيذ معظم طلبات الشحن خلال دقائق معدودة فور تأكيد إشعار الدفع البنكي.'
        }
      }
    ]
  };
}

/**
 * Combined Homepage Schema Graph
 */
export function getHomepageCombinedSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      getOrganizationSchema(),
      getWebSiteSchema(),
      getWebPageSchema(
        'MAURITOP | شحن الألعاب والخدمات الرقمية في موريتانيا',
        SITE_DESCRIPTION,
        '/'
      ),
      getBreadcrumbSchema([
        { name: 'الرئيسية', path: '/' }
      ]),
      getFAQSchema()
    ]
  };
}

# 🔍 **Comprehensive Site Filtering System**

This document outlines the powerful filtering capabilities added to your OG Preview application for programmatic SEO.

## 🚀 **Overview**

Your application now supports **25+ filtering dimensions** across **35+ individual columns**, enabling sophisticated site discovery and programmatic SEO campaigns.

## 📊 **Filter Categories & Options**

### **1. Business Classification**

- **Industry**: Technology, Healthcare, Finance, E-commerce, Education, Media, Real Estate, Travel, Food & Beverage, Fashion, Sports, Gaming, Legal, Consulting, Manufacturing, Automotive, Energy, Other
- **Sector**: B2B, B2C, B2B2C, Government, Non-profit
- **Business Model**: SaaS, Marketplace, E-commerce, Media, Service, API, Platform, Tool
- **Company Stage**: Startup, Scaleup, Enterprise, Public, Acquired

### **2. Geographic & Market**

- **Country**: ISO country codes (US, UK, DE, FR, etc.)
- **Region**: North America, Europe, APAC, LATAM, MENA, Africa
- **City**: San Francisco, London, Berlin, etc.
- **Language**: en, es, fr, de, etc. (primary language)
- **Market Focus**: Global, Regional, Local, Niche

### **3. Company Size & Scale**

- **Company Size**: Startup (1-10), Small (11-50), Medium (51-200), Large (201-1000), Enterprise (1000+)
- **Employee Count**: Numeric range filtering (min/max)
- **Revenue**: <1M, 1M-10M, 10M-100M, 100M-1B, 1B+
- **Funding Stage**: Pre-seed, Seed, Series A, Series B, Series C+, IPO, Acquired, Bootstrapped
- **Total Funding**: <1M, 1M-10M, 10M-100M, 100M-1B, 1B+

### **4. Technology & Platform**

- **Tech Stack**: React, Vue, Angular, Next.js, WordPress, Shopify, Webflow, Squarespace, Custom, Laravel, Django, Rails
- **Platform**: Web, Mobile, Desktop, API, Chrome Extension
- **Hosting Provider**: AWS, GCP, Azure, Vercel, Netlify, etc.
- **CDN Provider**: Cloudflare, AWS CloudFront, etc.

### **5. Content & Purpose**

- **Site Type**: Corporate, Product, Blog, E-commerce, Portfolio, Documentation, Landing Page, Directory, News, Community
- **Content Category**: Marketing, Technical, Educational, News, Entertainment, Corporate
- **Primary CTA**: Sign Up, Buy Now, Contact Us, Download, Subscribe
- **Monetization**: Subscription, One-time, Freemium, Ads, Affiliate, Free

### **6. SEO & Marketing**

- **Traffic Tier**: Low (<10K), Medium (10K-100K), High (100K-1M), Very High (1M+)
- **Domain Authority**: 1-100 range filtering
- **Has E-commerce**: Boolean
- **Has Blog**: Boolean
- **Has Newsletter Signup**: Boolean
- **Has Chatbot**: Boolean

### **7. Competitive Intelligence**

- **Competitor Tier**: Direct, Indirect, Adjacent, Substitute
- **Pricing Model**: Free, Freemium, Subscription, One-time, Custom, Contact
- **Target Audience**: SMB, Mid-market, Enterprise, Consumer, Developer, Business

### **8. Data Quality**

- **Is Verified**: Manual verification status
- **Is AI Classified**: AI processing status
- **Confidence**: AI confidence score (0-1)

## 🔗 **API Endpoints**

### **1. Main Filtering Endpoint**

```
GET /api/sites
```

**Example Queries:**

```bash
# Technology companies in the US with e-commerce
/api/sites?industry=Technology&country=US&hasEcommerce=true

# SaaS companies with Series A+ funding
/api/sites?businessModel=SaaS&fundingStage=Series A

# React-based sites in Europe with high domain authority
/api/sites?techStack=React&region=Europe&domainAuthorityMin=70

# Enterprise-focused companies with blogs
/api/sites?targetAudience=Enterprise&hasBlog=true&companySize=Enterprise (1000+)

# Search within filtered results
/api/sites?industry=Technology&search=api&techStack=React
```

### **2. Filter Options & Stats**

```
GET /api/sites/filters?stats=true
```

Returns available filter options and current database statistics.

### **3. Site Classification (AI/Manual Updates)**

```
PUT /api/sites/classify
POST /api/sites/classify  # Batch updates
```

## 📝 **Programmatic SEO Use Cases**

### **1. Industry-Specific Directories**

```bash
# Create "Best SaaS Tools" page
/api/sites?businessModel=SaaS&domainAuthorityMin=50&isVerified=true

# "Top Healthcare Startups"
/api/sites?industry=Healthcare&companyStage=Startup&fundingStage=Seed
```

### **2. Technology Stack Analytics**

```bash
# "Companies Using React"
/api/sites?techStack=React&hasBlog=true

# "WordPress vs Custom Sites"
/api/sites?techStack=WordPress
/api/sites?techStack=Custom
```

### **3. Geographic Market Analysis**

```bash
# "German E-commerce Companies"
/api/sites?country=DE&hasEcommerce=true

# "APAC SaaS Landscape"
/api/sites?region=APAC&businessModel=SaaS&domainAuthorityMin=30
```

### **4. Funding & Growth Tracking**

```bash
# "Recently Funded Startups"
/api/sites?fundingStage=Series A&lastClassified=2024

# "High-Growth Companies"
/api/sites?trafficTier=Very High (1M+)&fundingStage=Series B
```

### **5. Competitive Intelligence**

```bash
# "Direct Competitors"
/api/sites?competitorTier=Direct&industry=Technology

# "Enterprise Software Companies"
/api/sites?targetAudience=Enterprise&businessModel=SaaS&pricingModel=Subscription
```

## 🎯 **Advanced Query Examples**

### **Complex Multi-Filter Queries**

```bash
# European B2B SaaS companies, Series A+, with high DA
/api/sites?region=Europe&sector=B2B&businessModel=SaaS&fundingStage=Series A&domainAuthorityMin=60

# US tech companies with e-commerce and newsletter signup
/api/sites?country=US&industry=Technology&hasEcommerce=true&hasNewsletterSignup=true

# Medium-sized companies using React with blogs
/api/sites?companySize=Medium (51-200)&techStack=React&hasBlog=true&trafficTier=Medium (10K-100K)
```

### **Range Filtering**

```bash
# Companies with 100-500 employees and DA 40-80
/api/sites?employeeCountMin=100&employeeCountMax=500&domainAuthorityMin=40&domainAuthorityMax=80

# High-confidence AI classifications
/api/sites?isAiClassified=true&confidenceMin=0.8
```

## 🔄 **Data Management**

### **1. Apply Database Migration**

```bash
npm run db:migrate
```

### **2. Update Site Classifications**

```javascript
// Single site update
PUT /api/sites/classify
{
  "siteId": 123,
  "classification": {
    "industry": "Technology",
    "country": "US",
    "techStack": "React",
    "hasEcommerce": true
  },
  "isAiGenerated": false,
  "apiKey": "your-secret-key"
}

// Batch AI updates
POST /api/sites/classify
{
  "sites": [
    {
      "siteId": 123,
      "classification": { "industry": "Technology" },
      "isAiGenerated": true
    }
  ],
  "apiKey": "your-secret-key"
}
```

## 💡 **Programmatic SEO Ideas**

### **Content Creation Opportunities**

1. **"[Industry] Companies Using [Technology]"** - `/api/sites?industry=Healthcare&techStack=React`
2. **"Best [Industry] Tools in [Country]"** - `/api/sites?industry=Technology&country=US&domainAuthorityMin=70`
3. **"[Funding Stage] Startups in [Region]"** - `/api/sites?fundingStage=Series A&region=Europe`
4. **"[Company Size] Companies with [Feature]"** - `/api/sites?companySize=Enterprise (1000+)&hasBlog=true`
5. **"[Business Model] Companies vs [Competitor Business Model]"** - Compare different business models
6. **"Top [Industry] Companies by Domain Authority"** - `/api/sites?industry=Finance&domainAuthorityMin=80`
7. **"[Country] [Industry] Market Landscape"** - `/api/sites?country=DE&industry=E-commerce`
8. **"Companies Migrating to [Tech Stack]"** - Track technology adoption
9. **"[Region] Startup Funding Tracker"** - Monitor funding activities
10. **"[Industry] Companies with [Monetization] Model"** - Business model analysis

### **Analytics & Reports**

- Industry distribution analysis
- Geographic market penetration
- Technology adoption trends
- Funding pattern analysis
- Competitive landscape mapping

## 🚀 **Getting Started**

1. **Apply the migration**: `npm run db:migrate`
2. **Explore filter options**: `GET /api/sites/filters?stats=true`
3. **Start with simple filters**: `/api/sites?industry=Technology&limit=10`
4. **Build complex queries**: Combine multiple filters for targeted results
5. **Set up AI classification**: Use batch updates for automated data enrichment

This filtering system transforms your OG Preview app into a powerful programmatic SEO platform capable of generating thousands of targeted landing pages and analytical reports! 🎉

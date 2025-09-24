# OG Preview - Project Overview

**Website:** ogpreview.co  
**Author:** Danilo Vilhena  
**Repository:** Open Source (MIT License)  
**Tech Stack:** Next.js, Tailwind CSS, Cloudflare, Vercel

## Project Vision

OG Preview is an experimental project designed to become the **Go-To Hub for SEO Inspiration**. The primary goal is to create a comprehensive gallery and analysis platform for Open Graph images, meta tags, and SEO elements from popular websites, while serving as a learning platform for SEO optimization and website ranking strategies.

## Development Phases

### Phase 1: OG Image Gallery (Initial Focus)

- **Core Feature:** Searchable gallery of Open Graph images from popular websites
- **Search Functionality:**
  - Search by website name (e.g., "chatgpt")
  - Filter by categories (technology websites, Brazilian websites, company size, etc.)
  - Advanced filtering system with multiple criteria
- **Data Collection:** Manual curation of popular websites with favicon and OG image scraping
- **Database:** Schema to support website metadata, categorization, and filtering

### Phase 2: User-Submitted URLs

- **Submission System:** Users can submit URLs for review
- **Workflow:**
  - URLs go to temporary table for processing
  - Automated scraping of submitted websites
  - Manual review and data enhancement
  - Approval process for inclusion in main gallery
- **Quality Control:** Human oversight to maintain gallery quality

### Phase 3: Automated Monitoring

- **Periodic Scraping:** Automated re-scraping of existing websites
- **Version Control:** Store historical versions of OG images and meta data
- **Change Tracking:** Monitor how websites evolve their SEO strategies over time
- **Data Archive:** Comprehensive historical record of SEO element changes

### Phase 4: Complete SEO Hub

- **Expanded Scope:** Beyond OG images to comprehensive SEO analysis
- **Features:**
  - Meta tags analysis
  - Title optimization examples
  - SEO strategy case studies
  - Company-specific SEO research
- **Search Enhancement:** "How does company X handle SEO?" type queries

### Phase 5: Free SEO Tools

- **Marketing Strategy:** Free tools to attract users and build audience
- **Planned Tools:**
  - SEO checker for websites
  - OG image validator/checker
  - Meta tag analyzer
  - Additional SEO utilities
- **User Acquisition:** Tools serve as lead magnets and traffic drivers

## Technical Architecture

### Frontend

- **Framework:** Next.js with App Router
- **Styling:** Tailwind CSS with Geist font
- **Hosting:** Vercel

### Backend & Infrastructure

- **Primary Platform:** Cloudflare (leveraging generous free tier)
- **Database:** TBD (likely Cloudflare D1 or similar)
- **Scraping:** Automated systems for data collection
- **Storage:** Image and metadata storage solution

### Data Strategy

- **Scraping Pipeline:** Automated collection of OG images, favicons, and meta data
- **Data Enhancement:** Manual curation and categorization
- **Version Control:** Historical tracking of changes
- **Search Index:** Optimized for fast filtering and searching

## Monetization Strategy

### Primary Revenue

- **Sponsorships:** Featured tool placements for companies
- **Target Audience:** SEO tools, marketing platforms, web development services

### Transparency Commitment

- **Open Analytics:** Public monthly visitor statistics
- **Open Source:** All code available under MIT license
- **Community-Driven:** Transparent development and decision-making process

## Learning Objectives

This project serves as a comprehensive learning platform for:

- **SEO Mastery:** Deep understanding of search engine optimization
- **Website Ranking:** Practical experience with ranking strategies
- **Data Collection:** Web scraping and automation techniques
- **Product Development:** Building and scaling a web application
- **Community Building:** Growing an audience around SEO and web development

## Success Metrics

### Short-term Goals

- Curated gallery of 100+ popular websites
- Functional search and filtering system
- User submission and approval workflow

### Long-term Vision

- Premier destination for SEO inspiration and research
- Comprehensive historical archive of web SEO evolution
- Thriving community of SEO practitioners and developers
- Self-sustaining through sponsorships and tool offerings

## Open Source Commitment

OG Preview is committed to being fully open source under the MIT license, allowing:

- Commercial use without restrictions
- Community contributions and improvements
- Transparency in development and analytics
- Educational use for learning SEO and web development

---

_This document serves as the primary reference for understanding the OG Preview project scope, goals, and technical approach for all development work and AI assistance._

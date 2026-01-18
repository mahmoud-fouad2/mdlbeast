# 📬 MDLBEAST Archive & Communications System

<div align="center">

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/mfouad-del/mdlbeast)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-Production-success.svg)](https://zaco.sa/mdlbeast)

**Archive and Communications Management System for MDLBEAST Entertainment Company**

[Live Demo](https://zaco.sa/mdlbeast) · [API Docs](https://mdlbeast.onrender.com/api) · [Report Issue](https://github.com/mfouad-del/mdlbeast/issues)

</div>

---

## 🌟 Overview

A comprehensive enterprise-grade document and communications management system designed specifically for MDLBEAST Entertainment Company. Built with modern technologies to streamline administrative workflows, enhance security, and provide powerful archival capabilities.

## ✨ Key Features

### 📄 Document Management
- **Smart Archive System** - Centralized document repository with advanced search and filtering
- **Barcode Integration** - Automatic barcode generation and scanning for physical-digital linkage
- **Multi-format Support** - Handle PDFs, images, and various document formats
- **Version Control** - Track document revisions and maintain audit trails

### 🔐 Security & Permissions
- **Granular RBAC** - Role-Based Access Control with custom permission overrides
- **Hierarchical Management** - Manager-subordinate relationship with delegation support
- **Audit Logging** - Complete activity tracking for compliance and accountability
- **Secure Authentication** - JWT-based authentication with refresh tokens

### 🔄 Workflow Automation
- **Approval System** - Multi-level approval workflows with digital signatures
- **Document Stamping** - Official stamp and signature embedding on PDFs
- **Status Tracking** - Real-time document lifecycle monitoring
- **Notifications** - Instant alerts for pending actions and updates

### 💬 Internal Communications
- **Real-time Chat** - Team messaging and collaboration tools
- **Announcements** - Company-wide broadcast messaging
- **File Sharing** - Secure internal file exchange

### 📊 Reporting & Analytics
- **Custom Reports** - Generate detailed reports by date, type, or user
- **Export Options** - PDF, Excel, and CSV export capabilities
- **Dashboard Insights** - Visual analytics and KPI tracking
- **Historical Data** - Comprehensive data retention and retrieval

### 🌍 Localization
- **Bilingual Support** - Full Arabic and English interface
- **RTL Layout** - Right-to-left design for Arabic users
- **Cultural Adaptation** - Date formats, number systems, and conventions

### 📱 Modern UX/UI
- **Responsive Design** - Seamless experience across desktop, tablet, and mobile
- **Dark Mode** - Eye-friendly interface option
- **Accessibility** - WCAG compliant for inclusive access
- **PWA Ready** - Progressive Web App for offline capabilities

### ☁️ Cloud Infrastructure
- **Cloudflare R2** - Distributed object storage for scalability
- **PostgreSQL** - Robust relational database with JSONB support
- **Redis Caching** - High-performance data caching layer
- **Automatic Backups** - Scheduled database snapshots

## 🏗️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Premium component library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type safety on the server
- **PostgreSQL** - Primary database
- **JWT** - Secure authentication

### Infrastructure
- **Cloudflare R2** - Object storage
- **Render.com** - Application hosting
- **GitHub Actions** - CI/CD pipeline

## 🚀 Quick Start

### Prerequisites
```bash
Node.js >= 18.x
PostgreSQL >= 14.x
npm or pnpm
```

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/mfouad-del/mdlbeast.git
cd mdlbeast
```

2. **Install Dependencies**
```bash
npm install
cd backend && npm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
cd backend && cp .env.example .env
```

4. **Database Setup**
```bash
cd backend
node scripts/run_migration.js
```

5. **Start Development Servers**
```bash
# Frontend (port 3000)
npm run dev

# Backend (port 3001)
cd backend
npm run dev
```

6. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## 📝 Version

**Current Version:** 2.0.0 (January 2026)

### Changelog
- **v2.0.0** - Complete permission system overhaul with granular RBAC
- **v1.3.0** - Approval workflows and digital signatures
- **v1.2.0** - Barcode system and document stamping
- **v1.1.0** - Internal communications module
- **v1.0.0** - Initial release with core archival features

## 🔗 Deployment

### Production URLs
- **Application:** https://zaco.sa/mdlbeast
- **API Endpoint:** https://mdlbeast.onrender.com/api
- **Company Website:** https://mdlbeast.com

### Environment Variables
See `.env.example` for required configuration variables.

## 👨‍💻 Developer

**Mahmoud Fouad**
- Email: mahmoud.a.fouad2@gmail.com
- Phone: +966 530 047 640 | +20 111 658 8189
- GitHub: [@mfouad-del](https://github.com/mfouad-del)

## 📄 License

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit written permission from the copyright holder.

**Copyright © 2024-2026 Mahmoud Fouad. All Rights Reserved.**

See [LICENSE](./LICENSE) for full terms.

## 🏢 About MDLBEAST

MDLBEAST is an entertainment company rooted in music culture. Based in Saudi Arabia and shared globally – amplifying the unseen and unheard voices in the music industry.

---

<div align="center">

**Built with ❤️ for MDLBEAST Entertainment Company**

</div>

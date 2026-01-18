# Changelog

All notable changes to the MDLBEAST Archive & Communications System will be documented in this file.

## [2.0.0] - 2026-01-18

### 🎉 Major Release - Permission System Overhaul

#### Added
- **Granular RBAC System** - Complete permission system rewrite with module-level controls
- **Custom Permission Overrides** - Per-user permission customization that overrides role defaults
- **Permission Library** - Centralized permission management (`lib/permissions.ts`)
- **Backend Enforcement** - API-level permission validation middleware
- **Database Migration** - New `permissions` JSONB column in users table
- **Text Input for Position** - Changed position field from dropdown to free text
- **Enhanced User Management** - Support for position, department, and phone fields

#### Changed
- **Role Hierarchy** - Admins now have absolute permissions regardless of custom settings
- **Permission Merge Logic** - Custom permissions always override role defaults
- **User Profile Fields** - Extended user model with additional metadata
- **Authentication Flow** - JWT tokens now include full permission objects

#### Security
- **Permission Validation** - All API routes now validate granular permissions
- **Admin Protection** - Admin role cannot have permissions removed
- **Audit Trail** - Enhanced logging for permission changes

#### Fixed
- **Permission Inheritance** - Resolved conflicts between role and custom permissions
- **Access Control** - Fixed edge cases in document visibility based on permissions

---

## [1.3.0] - 2025-12-27

### Added
- Approval workflows with digital signatures
- Document stamping feature
- Multi-level approval system
- Signature and stamp upload

---

## [1.2.0] - 2025-11-15

### Added
- Barcode generation and scanning
- QR code support
- Physical-digital document linking

---

## [1.1.0] - 2025-10-10

### Added
- Internal communications module
- Real-time messaging
- Team collaboration features

---

## [1.0.0] - 2025-09-01

### Initial Release
- Document archive management
- User authentication and authorization
- Bilingual interface (Arabic/English)
- Role-based access control
- Search and filtering
- PDF generation and export

---

**Format:** [Version] - YYYY-MM-DD

**Types of Changes:**
- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements

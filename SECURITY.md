# Security Policy

## Supported Versions

Only the latest stable version of this software is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability, please report it immediately to the security team.

**DO NOT** create a public issue on GitHub for security vulnerabilities.

### Reporting Process

1. Email your findings to **security@mdlbeast.com** or **mahmoud.fouad@mdlbeast.com**.
2. Include a detailed description of the vulnerability and steps to reproduce it.
3. We will acknowledge receipt of your report within 48 hours.
4. We will provide an estimated timeline for the fix.

### Confidentiality

Please follow **Responsible Disclosure** guidelines. Keeps details confidential until a fix is released.

## Security Features

This application implements the following security measures:
* AES-256-GCM Encryption for sensitive data.
* Role-Based Access Control (RBAC).
* Secure Audit Logging.
* Sanitized Inputs to prevent SQL Injection (Prisma/ORM).

<!-- BEGIN:nextjs-agent-rules -->

# ALESSANDRO ENTERPRISES PLATFORM
Version: 1.0
Status: LOCKED
Authoritative Engineering Guide

===========================================================
PROJECT OVERVIEW
===========================================================

This repository contains the Alessandro Enterprises Enterprise Platform.

This is NOT a simple website.

This is an Enterprise ERP + CRM + CMS + Customer Management Platform.

The system manages multiple independent businesses from one enterprise dashboard.

Current Businesses

• Alessandro Elite Fashion
• Alessandro Classic Barbershop
• Alessandro Mobile Money
• Alessandro Soft Loans
• Alessandro Tech Solutions

Future businesses must be easily added without restructuring the application.

===========================================================
ARCHITECTURE
===========================================================

Next.js 16

React 19

TypeScript

Tailwind CSS v4

App Router

Supabase

Enterprise Modular Architecture

===========================================================
PROJECT STRUCTURE
===========================================================

app/

modules/

components/

lib/

providers/

hooks/

services/

store/

types/

utils/

styles/

docs/

prisma/

public/

===========================================================
RULES
===========================================================

Never redesign the project architecture.

Never duplicate code.

Always create reusable components.

Business logic never belongs inside page.tsx.

Page files only render UI.

Services contain business logic.

Validation stays inside validation files.

Types stay inside types.

Shared utilities belong inside utils.

Database access belongs inside lib/supabase.

===========================================================
BUSINESS MODULES
===========================================================

Each business is isolated.

Fashion

Barbershop

Mobile Money

Soft Loans

Tech Solutions

Each module owns

components

forms

services

hooks

tables

reports

analytics

validation

types

constants

No module may directly depend on another business module.

Shared functionality belongs in components or lib.

===========================================================
THEME
===========================================================

Primary

#03162F

Secondary

#D4AF37

Background

#FFFFFF

Primary Text

#111111

Never introduce additional primary colours.

===========================================================
DESIGN
===========================================================

Premium Enterprise UI

Professional

Responsive

Smooth animations

No clutter

No oversized components

Consistent spacing

Cards

Tables

Forms

Dialogs

Animations

must all follow one design language.

===========================================================
COMPONENT RULES
===========================================================

Reusable

Responsive

Typed

Accessible

Animated

Documented

Never duplicate components.

===========================================================
FORMS
===========================================================

React Hook Form

Zod Validation

Loading states

Error states

Confirmation dialogs

Uploads

Autosave where required

===========================================================
TABLES
===========================================================

Search

Sort

Filter

Pagination

Export

Print

Bulk Actions

===========================================================
REPORTS
===========================================================

Every module supports

Excel

PDF

Print

Date filters

Business filters

Permissions

===========================================================
SECURITY
===========================================================

Role Based Access Control

Super Admin

Administrator

Business Manager

Supervisor

Employee

Customer

Every route

Every action

Every API

Every report

must validate permissions.

===========================================================
CODING STANDARD
===========================================================

Strict TypeScript

No any

Meaningful naming

No abbreviations

Clean architecture

Reusable code

===========================================================
PERFORMANCE
===========================================================

Lazy loading

Dynamic imports

Image optimisation

Caching

Memoization where appropriate

===========================================================
AI RULES
===========================================================

Do not redesign architecture.

Follow existing folder structure.

Follow existing theme.

Prefer reusable solutions.

Do not create duplicate UI.

Keep modules independent.

Respect enterprise coding standards.

If unsure, extend existing architecture instead of inventing a new one.

===========================================================
END OF ENTERPRISE RULES
===========================================================


<!-- END:nextjs-agent-rules -->

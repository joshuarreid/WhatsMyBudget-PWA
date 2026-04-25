# Folder Structure & Architecture Guide

**Last Updated:** April 25, 2026

This document describes a repeatable, scalable folder structure and architecture for modern frontend applications. It focuses on patterns and conventions you can adapt to any project, regardless of domain or stack.

---

## 📐 Architecture Overview

Follow clear separation of concerns and modularity:

- **API Layer** (`src/api/`) - Centralized API clients, fetchers, and query key definitions for all backend communication
- **Components** (`src/components/`) - Reusable UI components with scoped hooks and logic
- **Features** (`src/features/`) - Feature-specific modules (UI, hooks, logic, state)
- **Screens/Pages** (`src/screens/` or `src/pages/`) - Top-level route/page components that compose features and components
- **Hooks** (`src/hooks/`) - Global/shared custom hooks
- **Config** (`src/config/`) - App configuration (env, query clients, etc.)
- **Layouts** (`src/layouts/`) - Layout components for route/page composition

---

## 🗂️ Generic Core Folder Structure

```
src/
├── api/                          # API Layer - all backend communication
│   ├── ApiClient.ts              # Base API client class (e.g., axios instance, interceptors)
│   ├── resource/                 # Resource module (e.g., user, product, order)
│   │   ├── resourceApiClient.ts  # Resource-specific API client
│   │   ├── resource.ts           # Fetcher functions (CRUD, queries)
│   │   └── resourceQueryKeys.ts  # Query key factory for TanStack Query or similar
│   └── ...                       # Other resources
│
├── components/                   # Reusable UI components
│   ├── [ComponentName]/          # Component folder
│   │   ├── components/           # Subcomponents
│   │   └── hooks/                # Component-specific hooks
│   └── ...
│
├── features/                     # Feature-specific modules
│   ├── [feature-name]/           # Feature folder
│   └── ...
│
├── screens/ or pages/            # Top-level route/page components
│   └── ...
│
├── hooks/                        # Global shared hooks
│   └── ...
│
├── config/                       # App configuration
│   └── ...
│
├── layouts/                      # Layout components
│   └── ...
│
├── assets/                       # Images, fonts, etc.
├── styles/                       # Global and theme styles
├── docs/                         # Project documentation (design docs, API contracts, etc.)
└── ...                           # Other folders as needed (e.g., store/, tests/)
```

---

## 🔧 API Layer Pattern

The API layer is organized into resource-based modules. Each resource module typically contains:

1. **ApiClient.ts** - Base client class (e.g., axios/fetch abstraction)
2. **[resource]ApiClient.ts** - Resource-specific API client
3. **[resource].ts** - Fetcher functions (CRUD, queries)
4. **[resource]QueryKeys.ts** - Query key factory for data fetching libraries

Adapt these patterns for your stack (REST, GraphQL, etc.).

---

## 🏗️ General Principles

- Keep things close to where they're used (colocation)
- Extract reusable logic/components early
- Prefer feature-based over type-based grouping for scalability
- Document your structure and adapt as your project grows

This formula is designed to be copied and adapted for any new project, ensuring clarity, maintainability, and scalability.

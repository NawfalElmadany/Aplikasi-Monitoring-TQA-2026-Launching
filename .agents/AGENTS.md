# TQA Project Agent Rules & Conventions

Welcome to the TQA (Tahfidz/Quran Application) workspace. This document outlines the style guidelines, rules, and local skills configured for this project.

## Local Skills Installed
The following specialized skills have been installed under `.agents/skills/` and are automatically active for this workspace:
1. **[senior-frontend](file:///.agents/skills/senior-frontend/SKILL.md)**: Frontend engineering guidelines (React, Vite, TypeScript).
2. **[ui-design-system](file:///.agents/skills/ui-design-system/SKILL.md)**: Rules for consistent Tailwind CSS usage and styling harmony.
3. **[ux-researcher-designer](file:///.agents/skills/ux-researcher-designer/SKILL.md)**: Layout, vertical alignment, and user experience standards.
4. **[code-reviewer](file:///.agents/skills/code-reviewer/SKILL.md)**: Automated diff analysis and clean code patterns.
5. **[agile-product-owner](file:///.agents/skills/agile-product-owner/SKILL.md)**: User story analysis, task decomposition, and milestone verification.

---

## Workspace Rules & Conventions

### 1. Technology Stack & Frameworks
- **Framework**: Vite + React (TypeScript)
- **Styling**: Tailwind CSS
- **Database/Backend**: Supabase client (`supabaseClient.ts`)

### 2. Design System & Aesthetics
- **Color Palette**: Focus on Emerald/Teal accents (`text-emerald-700`, `bg-emerald-600`, `border-emerald-400`).
- **Cards**: Outer header cards must be styled as floating cards with a light gradient background (`bg-gradient-to-br from-white to-emerald-50/60`), subtle shadow (`shadow-[0_8px_30px_rgba(0,0,0,0.04)]`), and a green border (`border-emerald-400`).
- **Margins & Alignment**: Always remove extra horizontal margins (`mx-`) from header cards. They must align perfectly with the parent page container (`p-4 sm:p-8`) to maintain a clean vertical grid line down the left and right edges.
- **Header Structure**: Sapaan ("Assalamualaikum...") and date are exclusive to the main Dashboard page. Other pages must keep their header titles aligned vertically centered in the card relative to action buttons and the user profile.

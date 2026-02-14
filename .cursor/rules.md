# Cursor Project Rules — Digital Child Health Record (Vaccination MVP)

## 🎯 Product Mission
Build a clinic-verified digital child health record that preserves vaccination history and consultation data using a unique child identifier.

The system ensures continuity of care when the paper booklet is lost and enables safe, structured intake across visits.

This is a healthcare workflow support tool, not a full medical system.

---

## 🧩 MVP Scope (STRICT)

### Core Features
1. Clinic registers newborn child profile
2. System generates unique child identifier
3. Parent can sign in and view child profile
4. Clinic can search child by identifier
5. Clinic records vaccinations
6. Clinic records consultations
7. Parent sees vaccination timeline

### Non-Goals (Do NOT implement)
- No diagnosis or medical recommendations
- No document scanning or OCR
- No prediction models
- No national health system integration
- No complex analytics dashboards

If a request exceeds scope → propose a simpler MVP-safe alternative.

---

## 🏗️ Tech Stack Constraints

### Frontend
- Next.js (App Router)
- TypeScript only
- Tailwind CSS
- shadcn/ui components
- React Hook Form + Zod for validation

### Backend
- Next.js Server Actions for API
- PostgreSQL database
- Prisma ORM

### Auth
- Email or phone login
- Role-based access: parent | clinic

### Code Quality
- Strong typing required
- Prefer simple, readable code
- Small reusable components
- No unnecessary abstractions

---

## 🧑‍⚕️ Healthcare Safety Principles

When generating features or UI:

1. Human verification is required for medical data entry
2. System supports clinicians — never replaces them
3. No automated medical decisions
4. Paper booklet remains fallback source
5. If uncertain → request confirmation instead of guessing

---

## 📱 UX Design Principles

### Parent Experience
- Very simple forms
- Minimal text
- Clear vaccination timeline
- Child identifier always visible
- Arabic/French labels ready

### Clinic Experience
- Fast data entry
- Structured fields
- One-screen patient summary
- Minimal clicks

Always prioritize usability over visual complexity.

---

## 🧱 File Structure Convention

/app
  /parent
  /clinic
  /api
/components
/lib
/prisma
/types

Do not create unnecessary directories.

---

## ⚡ Implementation Priority Order

1. Database setup and Prisma configuration
2. Child registration form (clinic)
3. Unique identifier generation
4. Clinic search by identifier
5. Vaccination entry form
6. Consultation entry form
7. Parent dashboard
8. UI polish

Work in this order unless instructed otherwise.

---

## 🤖 AI Tool Usage (If Requested)

Allowed uses:
- Voice reminders
- Accessibility assistance
- Educational media

Never generate medical advice.

---

## 🧪 Development Behavior

When asked to build something:

1. Briefly state what will be created
2. Generate production-ready code
3. Respect stack constraints
4. Keep MVP-focused
5. Ask at most ONE clarification question if blocked

Avoid placeholders unless explicitly requested.

---

## 🧭 Prompt Pattern for Tasks

When receiving instructions, assume this format:
“Follow project rules. Build <feature> for <user role>.”

Always align output with MVP scope and healthcare safety rules.

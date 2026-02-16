# Bidaya

A digital child health record, verified by the clinic — with post-vaccination communication between parent, doctor, and pharmacy.

![Bidaya Platform Overview](public/s2.png)
*Three main portals: Parent access to child health records, Clinic management interface, and Pharmacy prescription verification*


## The Problem

In Morocco, children's medical follow-up still largely relies on paper health booklets. These documents get lost, damaged, and are not remotely accessible. Parents have no simple way to check their child's vaccination history. In case of side effects after a vaccination, the parent must physically go to the clinic, and communication between doctor and pharmacy is done through paper prescriptions that are easily forged or reused.

## Our Solution

A web application that digitizes the child's health record and establishes a secure communication circuit between three actors: **the parent**, **the clinic**, and **the pharmacy**. Each record is created and verified by the clinic, then accessible to the parent via a unique identifier.

## How It Works

### 1. Clinic Staff Creates a Record

At birth, the clinic registers the newborn in the application:

- Child information (name, date of birth, weight, height, etc.)
- Parent information (name, phone number)

A **unique identifier** is automatically generated and given to the parent.

### 2. The Parent Accesses the Health Record

The parent logs in with:

- The child's unique identifier
- Their phone number
- A verification code (OTP)

They can then view:

- The child's complete profile
- The Moroccan vaccination schedule
- Vaccination and consultation history
- The complete medical timeline

### 3. The Clinic Manages Medical Follow-Up

Clinic staff can search for a child by identifier and:

- Add vaccinations (name, dose, date, clinic, batch, injection site)
- Add consultations (reason, diagnosis, treatment, follow-up)
- Track the official Moroccan vaccination schedule
- Mark vaccines as administered

### 4. Post-Vaccination Communication

This is the core innovation of Bidaya. When a child experiences side effects after a vaccination:

1. **The parent reports** the symptoms from the application (description, severity, related vaccination)
   - They can dictate the symptoms using **voice input** (automatic transcription via ElevenLabs)
   - They can attach a **photo** to illustrate the symptoms (JPG, PNG, WebP — max 5 MB)
2. **The doctor receives** the report in their dashboard, reviews the details and attached photo, and **responds to the parent** via a message thread
3. **The doctor creates a digital prescription** with a unique code (format ORD-XXXX-XXXX)
4. **The parent** sees the prescription and code directly in the application and shares it with their pharmacy
5. **The pharmacy** enters the code, verifies the prescription, dispenses the medication, and **marks the prescription as used**

This circuit prevents fraudulent reuse of prescriptions: once dispensed, the prescription is locked and can no longer be used at another pharmacy.

### 5. AI-Based Neonatal Risk Analysis

An integrated artificial intelligence tool estimates neonatal risk based on maternal data:

- Gestation duration, parity, maternal age
- Mother's height and weight, smoking status

The model predicts the estimated birth weight and classifies the risk into three levels: **low**, **moderate**, or **high**.

## The 3 Portals

| Portal        | Access                               | Main Features                                                                                              |
| ------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Parent**    | Child identifier + phone + OTP       | View the health record, report side effects (voice + photo), see prescriptions, communicate with the doctor |
| **Clinic**    | Email                                | Create records, manage vaccinations/consultations, respond to reports, issue prescriptions                  |
| **Pharmacy**  | Email                                | Search for a prescription by code, verify details, mark as dispensed                                       |

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **AI**: MiniMax M2.5 (LLM API) for neonatal prediction
- **Voice**: ElevenLabs Speech-to-Text for voice-based symptom input
- **ML**: Python (pandas, scikit-learn) for exploratory data analysis

## Getting Started

```bash
# Install dependencies
npm install
```

### Environment Variables (required & optional) 🔧

Copy the template and fill in your secret keys:

```bash
cp .env.example .env
```

Required variables (fill in `.env`):

- `DATABASE_URL` — PostgreSQL connection string (Neon / Heroku etc.)
- `MINIMAX_API_KEY` — API key for MiniMax (LLM used by the app)
- `ELEVENLABS_API_KEY` — API key for voice transcription

Optional variables (defaults managed by the app):

- `MINIMAX_BASE_URL` — (default: https://api.minimax.io/v1/chat/completions)
- `MINIMAX_MODEL` — (default: MiniMax-M2.5)
- `NODE_ENV` — (default: development)

Security:

- The `.env` file is listed in `.gitignore` — **DO NOT COMMIT IT**.
- `.env.example` contains only examples and can be committed.

Then initialize the database and start the server:

```bash
# Initialize the database
npm run db:push

# Start the development server
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000).

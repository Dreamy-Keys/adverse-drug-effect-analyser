# 🛡️ MedGuard AI — Pediatric Drug Safety & Risk Intelligence

**MedGuard AI** is a professional-grade, AI-powered drug safety analyzer specifically engineered for pediatric care. By leveraging raw data from the **FDA Adverse Event Reporting System (FAERS)**, MedGuard AI provides parents and healthcare providers with real-time, evidence-based insights into medication risks, interactions, and age-specific physiological considerations.

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://medguardai.vercel.app)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-blue?style=flat-square&logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## ✨ Key Features

### 🔍 Intelligence-Driven Drug Search
Search across **3,800+ drugs** with instant autocomplete. Access clinical metadata including user ratings, pregnancy categories, and classification (Rx/OTC).

### 📊 Age-Based Risk Analysis (Comparative ML)
Unlike standard trackers, MedGuard AI features a **Comparative ML Model** that analyzes the statistical probability of adverse reactions in children versus adults. 
- *Visualizes risk across 5 developmental age groups.*
- *Provides physiological insights (e.g., renal clearance in neonates).*

### ⚡ Predictive DDI Engine
A deep-learning-inspired interaction checker that identifies potential **Drug-Drug Interactions (DDI)** based on co-occurrence frequencies in millions of FDA reports. It flags hidden side effects that occur when medications are compounded.

### 📅 Smart Medication Tracker & Allergy Guard
- **Combination Sets**: Log complex multi-drug regimens.
- **Real-time Allergy Cross-Check**: Automatically flags medications that conflict with a user's stored allergy profile.
- **Adherence Analytics**: Visual tracking of dose history and compliance rates.

---

## 🛠️ Technical Architecture

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **Animations**: Framer Motion for premium, smooth micro-interactions.
- **Data Engine**: Bayesian-style statistical modeling on a sanitized **150MB+ FDA FAERS dataset**.
- **State Management**: Zustand for global auth and medication state.
- **Authentication**: Secure JWT-based auth with bcrypt encryption.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/Dreamy-Keys/adverse-drug-effect-analyser.git
   cd adverse-drug-effect-analyser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## ☁️ Deployment

### Vercel (Recommended)
This project is optimized for Vercel. 
1. Connect your GitHub repo to Vercel.
2. Set the `JWT_SECRET` environment variable (optional).
3. Vercel will automatically build and deploy.

> [!IMPORTANT]
> **Data Persistence**: The current build uses a local JSON database for demo purposes. For production use, it is recommended to connect **Vercel Postgres** and update `lib/db/index.js`.

---

## ⚖️ Disclaimer
MedGuard AI is an informational tool derived from statistical data and is **not a substitute for professional medical advice**. Always consult a qualified healthcare provider before making decisions regarding medication or health.

---

## 👨‍💻 Built for the Future of Pediatric Safety
MedGuard AI was built to bridge the gap between complex clinical data and accessible parental care. By turning raw FDA reports into actionable intelligence, we help protect the most vulnerable patients.

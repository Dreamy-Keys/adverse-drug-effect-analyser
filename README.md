# Pediatric Drug Safety Analyzer

An AI-powered pediatric drug safety analysis application built with Next.js, Framer Motion, and raw FDA FAERS data.

## Features
- **Comparative ML Risk Model**: Statistical analysis comparing pediatric vs. adult adverse event probabilities.
- **Predictive DDI Engine**: Predicts potential drug-drug interactions based on adverse effect profile similarities.
- **Medication Tracker**: Support for multi-drug regimens and personalized schedules.
- **Drug Allergy Warning**: Automatic cross-referencing of medication sets against user allergy profiles.
- **Age-Based Analysis**: Deep physiological insights based on the patient's age.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion, Recharts.
- **ML Engine**: Bayesian-style statistical modeling on FDA FAERS datasets.
- **Icons**: Lucide React.

## Deployment on Vercel

This project is ready to be deployed on Vercel. 

### Steps:
1. Push this code to your GitHub repository.
2. Go to [Vercel](https://vercel.com) and click **"New Project"**.
3. Import your repository.
4. Add an environment variable (optional but recommended):
   - `JWT_SECRET`: A long random string for securing user sessions.
5. Click **Deploy**.

### Important Note on Persistence:
The current version uses local JSON files in `data/db/` for user and medication storage. Because Vercel uses serverless functions with a read-only filesystem, **data will not persist across redeploys**. 

For production use, it is recommended to connect a real database like **Vercel Postgres** or **MongoDB** and update `lib/db/index.js` to use a database driver instead of `fs`.

## Local Development
1. Clone the repository.
2. Install dependencies: `npm install`
3. Run the dev server: `npm run dev`
4. Open `http://localhost:3000` in your browser.

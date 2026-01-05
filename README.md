# Simple Reminder Display

A full-screen reminder display system for outlet monitors, built with Next.js and MongoDB.

## Usage Scenarios

This application is purpose-built for high-visibility environments like **Retail Shops**, **Commercial Kitchens**, or **Service Centers**. It provides a "Set and Forget" solution for operational hygiene:

-   **Shop Floor Display**: Mount a monitor running the `/display` page in full-screen. It acts as an automated supervisor, reminding staff of opening/closing checks, cleaning schedules, or inventory audits.
-   **Remote Management**: Store managers can log in to the `/admin` dashboard from their phone or laptop to update tasks instantly without touching the display screen.
-   **Attention Grabbing**: Uses visual flashing and optional audio alarms to ensure tasks aren't ignored during busy hours.

## Getting Started

This project uses [Bun](https://bun.sh) as the runtime and package manager.

### 1. Installation

Install dependencies:
```bash
bun i
```

### 2. Environment Setup

Create a `.env.local` file in the root directory (use `env.example` as a template):

```bash
cp env.example .env.local
```

Define the required variables:

- `MONGODB_URI`: Connection string for your MongoDB database.
- `ADMIN_PASSWORD`: Password for accessing the `/admin` dashboard.
- `SITE_PASSWORD`: Global password required to access the site (Landing, Display, etc.).

### 3. Running the App

Start the development server:
```bash
bun dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

- **Display View**: [http://localhost:3000/display](http://localhost:3000/display)
- **Admin Dashboard**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### 4. Building for Production

To build the application for production:

```bash
bun run build
```

To start the production server:

```bash
bun start
```

# Logística - Frontend

This is the frontend application for the Logística system, built with **Angular 18+**, **PrimeNG**, and **TailwindCSS**. It provides a modern interface for managing logistics services, clients, and driver settlements.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **Angular CLI** (`npm install -g @angular/cli`)

### Installation

1.  **Navigate to the frontend directory:**
    ```bash
    cd logistica-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    - Ensure your `src/environments/environment.ts` points to your backend (default `http://localhost:3000`).

4.  **Run Development Server:**
    ```bash
    npm start
    ```
    Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## 🌟 Key Features

### Services Management (Main Module)
- **Service List**: View all trips with filtering by status.
- **Multi-Selection**: Select multiple services to perform batch actions.
- **Create/Edit**: Full form to manage Trip Details, Origin/Destination, Drivers, Clients, and Vehicles.
- **Pricing Engine**: 
    - Auto-calculation of Client and Driver totals.
    - **Discount System**: Apply percentage discounts (`-10%`) that are visibly tagged and calculated in the totals.

### Details & Invoicing View
- **Summary Dialog**: select services and click "Ver Resumen / Facturar".
    - **Detailed List**: Shows breakdown of Route, Notes, Original Price, and Discount.
    - **VAT Calculation**: Toggle "Adicionar 21% IVA" to see tax implications instantly.
    - **Totals**: Real-time aggregation of Subtotal, Tax, and Grand Total.

### Infrastructure
- **PrimeNG**: Extensive use of UI components (Table, Dialog, Toast, InputNumber, etc.).
- **TailwindCSS**: Utility-first styling for layout and spacing.
- **Responsive**: Adapted for different screen sizes.

## 📂 Project Structure

- `src/app/pages`: Main view components (`service-list`, `settlement-list`, etc.).
- `src/app/service`: API services connecting to the Backend.
- `src/environments`: Configuration files.

## 🛠 Tech Stack

- **Framework**: Angular 18
- **UI Library**: PrimeNG
- **CSS**: TailwindCSS
- **Language**: TypeScript

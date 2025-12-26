# 🤖 AI Rules for Guarita - Sistema de Gestão Agrícola

This document outlines the core technologies and best practices for developing and maintaining the Guarita application. Adhering to these rules ensures consistency, maintainability, and optimal performance.

## 🚀 Tech Stack Overview

*   **Frontend Framework**: React.js for building dynamic and interactive user interfaces.
*   **Language**: TypeScript for type safety, improved code quality, and better developer experience.
*   **Build Tool**: Vite for a fast development server and optimized production builds.
*   **Styling**: Tailwind CSS for utility-first CSS, enabling rapid and consistent UI development.
*   **UI Components**: shadcn/ui, built on Radix UI, for accessible and customizable UI components.
*   **Backend as a Service (BaaS)**: Supabase for database, authentication, and storage functionalities.
*   **Routing**: React Router (`react-router-dom`) for declarative navigation within the application.
*   **Data Fetching & State Management**: React Query (TanStack Query) for efficient server state management, caching, and synchronization.
*   **Icons**: Lucide React for a comprehensive and customizable icon set.
*   **Date Manipulation**: `date-fns` for robust and lightweight date utility functions.
*   **Toasts/Notifications**: `sonner` and `useToast` (from shadcn/ui) for user feedback and notifications.
*   **PDF Export**: `jspdf` and `jspdf-autotable` for generating PDF reports.
*   **Excel Export**: `xlsx` for exporting data to Excel spreadsheets.
*   **Charts**: `recharts` for creating responsive and interactive data visualizations.

## 📚 Library Usage Guidelines

To maintain a consistent and efficient codebase, please follow these guidelines when choosing and using libraries:

*   **UI Development**: Always use **React.js** for creating components and managing UI state.
*   **Type Safety**: All new code **must** be written in **TypeScript**. Ensure interfaces and types are clearly defined.
*   **Styling**: Utilize **Tailwind CSS** classes for all styling. Avoid custom CSS files unless absolutely necessary for global styles or complex animations not achievable with Tailwind.
*   **Component Library**: Prioritize **shadcn/ui** components. If a specific component is not available or requires significant deviation from shadcn/ui's design, create a new custom component using Tailwind CSS. Do not modify shadcn/ui's source files directly.
*   **Backend Interactions**: All database operations, authentication, and file storage **must** be handled via **Supabase**.
*   **Navigation**: Use **React Router** for all client-side routing and navigation.
*   **Data Management**: For fetching, caching, and updating server data, use **React Query**. This helps centralize data logic and provides powerful caching mechanisms.
*   **Icons**: Integrate icons from **Lucide React**.
*   **Date & Time**: For any date parsing, formatting, or manipulation, use **date-fns**.
*   **User Feedback**: For displaying transient messages or notifications to the user, use the `useToast` hook provided by shadcn/ui. For more persistent or distinct toast styles, `sonner` can be used.
*   **Reporting**: When generating PDF documents, use **jspdf** with **jspdf-autotable**. For Excel exports, use **xlsx**.
*   **Data Visualization**: For any charting or graph requirements, use **recharts**.
*   **CSS Utilities**: Use `clsx` and `tailwind-merge` for conditionally applying and merging Tailwind CSS classes.

By adhering to these rules, we ensure a cohesive, high-quality, and easily maintainable application.
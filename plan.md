Below is the detailed implementation plan for the complete contract employee management platform. This plan includes all dependent file changes, API integration with the ZenHR API (using mocked functions until real endpoints/credentials are provided), and UI/UX considerations for Employee, Manager, and Admin roles.

---

## 1. Environment & Configuration Setup

- **.env File (new)**
  - Create a new file at the root with environment variables:
    - DATABASE_URL (for Prisma/PostgreSQL or SQLite for development)
    - NEXTAUTH_SECRET (for NextAuth.js)
    - ZENHR_API_URL (base URL for ZenHR integration)
    - ZENHR_API_KEY (the API key/token for ZenHR)
  - Ensure error handling for missing critical env variables on startup.

- **next.config.ts**
  - Update to expose specific env variables if needed (do not expose sensitive keys to client).
  - Validate production vs. development environment keys.

---

## 2. Database & ORM Integration

- **prisma/schema.prisma (new)**
  - Define models for:
    - Company: id, name, contact details, subscription details.
    - Employee: id, name, email, role (employee/manager/admin), companyId, attendance records, HR requests.
    - HRRequest: id, type (leave, exit/re-entry, sponsorship transfer), status, createdAt, updatedAt, employeeId, managerId.
    - Attendance: id, date, status, employeeId.
    - PerformanceReview: id, review text, type (reward/warning), createdAt, employeeId, managerId.
    - Subscription: id, companyId, package type/details.
  - Run `npx prisma generate` and `npx prisma migrate dev` for development migrations.
  - Use try/catch error handling when connecting to the database.

---

## 3. Authentication & Authorization

- **src/app/api/auth/[...nextauth]/route.ts (new)**
  - Set up NextAuth.js in the App Router.
  - Integrate username/password or ZenHR single sign-on if supported (using credentials provider as default).
  - Include error handling on sign in and session callbacks.
  
- **Role-Based Middleware / Layout**
  - Use a higher-order component or middleware (e.g., in src/app/layout.tsx) to check user session and roles.
  - Redirect unauthorized users to the login page.

---

## 4. API Integration for HR Features

- **ZenHR Integration Module**  
  Create a new file: **src/lib/zenhr.ts**
  - Functions:
    - `async function fetchEmployeeData(employeeId: string): Promise<any>`  
      (Wrap fetch with try/catch; check response codes)
    - `async function markAttendance(employeeId: string, date: string): Promise<any>`  
      (POST attendance data to ZenHR API)
    - `async function submitHRRequest(requestData: object): Promise<any>`  
      (POST new HR requests such as leave or sponsorship transfer)
  - Use template literals for URL construction.
  - Handle non-200 responses gracefully with error messages.

- **API Endpoints in Next.js App Directory**
  - **src/app/api/attendance/route.ts**
    - POST endpoint: Receives attendance info, calls `markAttendance`, returns JSON success/error response.
  - **src/app/api/hr-request/route.ts**
    - POST and GET endpoints:
      - POST to create a new HR request.
      - GET to track the status of HR requests with proper error handling.
  - **src/app/api/performance/route.ts**
    - POST endpoint: Manager submits performance rewards/warnings.
  - For each endpoint, wrap logic in try/catch, validate request payload, and return appropriate HTTP status codes and messages.

---

## 5. UI Components & Pages

### a. Layout & Navigation
- **src/components/Layout.tsx (new)**
  - Create a common layout to wrap pages.
  - Include a header (with login status, logout button) and a sidebar.
  - Sidebar includes role-based navigation:
    - Employees: Dashboard, Mark Attendance, HR Requests.
    - Managers: Employee Management, Performance Evaluations, Approval Workflows.
    - Admins: Compliance Monitoring, Subscription Packages, Permission Control.
  - Use simple typographic elements and spacing (Tailwind classes) without external icon libraries.

### b. Employee Portal
- **Login Page:**  
  **src/app/login/page.tsx (new)**
  - Modern, clean login form with fields for username and password.
  - Use Tailwind CSS for spacing, borders, and responsive layout.
  - Handle form validation and error messages.
  
- **Employee Dashboard:**  
  **src/app/dashboard/employee/page.tsx (new)**
  - Displays a personal dashboard with:
    - Attendance marking button/form.
    - HR requests form (leave, exit/re-entry, sponsorship transfer) using a multi-step form with an approval workflow indicator.
    - Request status tracking table.
  - Use shadcn/ui components (e.g., button, form, alert) with clean modern typography.
  
### c. Manager Dashboard
- **Manager Dashboard:**  
  **src/app/dashboard/manager/page.tsx (new)**
  - Components include:
    - Employee list table (using table component from ui folder) with evaluation buttons.
    - Performance reward/warning submission form.
    - Notifications panel for pending HR requests and departmental activities.
  - Ensure error handling notifications pop up on failed operations (using alert-dialog or alert components).

### d. Admin Panel
- **Admin Dashboard:**  
  **src/app/dashboard/admin/page.tsx (new)**
  - Dashboard displays:
    - Compliance & cost monitoring charts (use shadcn chart component or custom table/cards with Tailwind).
    - Automated alerts for Saudization targets and expiring contracts.
    - Subscription package management view with pricing details.
  - Implement step-by-step filters and summary cards.
  - Use responsive layouts so panels adjust for different screen sizes.
  
### e. Mobile Considerations
- Responsive design is built in using Tailwind breakpoints.
- Ensure that dashboards use a stacked layout on mobile (e.g., navigation changes to a hamburger menu built with plain divs and text).
- Add support for biometric/web-authn login in the login page (placeholder comments for future integration).

---

## 6. Error Handling & Best Practices

- Wrap all API logic in try/catch blocks.
- Validate input data using simple schema checks prior to database or API calls.
- Use alert components in the UI to display error messages.
- Log errors to the console and create a fallback UI for critical failures.
- Write unit tests for critical functions in src/lib and integration tests for API endpoints (instructions to run curl commands provided in README).

---

## 7. Documentation & Testing

- **README.md**
  - Update with new instructions on setting up environment variables, database migrations, and starting the Next.js server.
  - Document API endpoints (attendance, HR requests, performance).
  - Include sample curl commands for testing endpoints:
    - Example:  
      ```bash
      curl -X POST http://localhost:3000/api/attendance -H "Content-Type: application/json" -d '{"employeeId": "123", "date": "2023-10-10"}'
      ```
- Write comments in code for further clarity.
- Ensure all newly created files comply with the project's ESLint and Prettier configurations.

---

## Summary

- Created a new environment configuration (.env) and updated next.config.ts for secure key handling.  
- Added a Prisma schema with models for companies, employees, HR requests, attendance, and subscriptions.  
- Configured NextAuth.js with a dedicated API route for authentication and role-based access control.  
- Developed ZenHR integration functions in src/lib/zenhr.ts and set up API endpoints for attendance, HR requests, and performance.  
- Built separate responsive dashboards for Employee, Manager, and Admin roles using a consistent layout (Layout.tsx) and modern UI components from shadcn/ui with Tailwind CSS.  
- Included robust error handling, input validation, and API testing instructions via curl.  
- Updated documentation in README.md with setup and testing details.

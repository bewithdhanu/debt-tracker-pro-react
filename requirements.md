# Debt Tracker Application Requirements

## 1. Project Overview

### Project Name
Debt Tracker

### Description
A web-based application that allows users to track personal debts and loans. The application enables users to record both money they owe to others and money owed to them, manage contacts, and track debt-related activities such as payments and interest calculations.

### Key Objectives
- Provide a secure platform for users to track personal debts and loans
- Enable detailed record-keeping of financial transactions
- Offer intuitive visualization of financial obligations
- Simplify contact management for debt relationships
- Track debt activities including payments, interest, and additional loans

### Target Audience
- Individuals managing personal loans and debts
- Small business owners tracking customer credit
- Anyone who lends or borrows money informally
- Users seeking to organize their financial obligations

## 2. Functional Requirements

### Authentication & User Management
- Email and password-based authentication
- User registration with basic profile information
- Secure login/logout functionality
- User profile management

### Contact Management
- Add, edit, and delete contacts
- Store contact details (name, phone, address)
- Track referral information for contacts
- Search and filter contacts
- Sort contacts by various fields
- Paginate contact listings

### Debt Management
- Record debts owed by the user ("I Owe")
- Record debts owed to the user ("Owe Me")
- Track principal amount, interest rate, and debt date
- Add notes to debt records
- Search and filter debts
- Sort debts by various fields
- Paginate debt listings

### Debt Activities
- Record payments made or received
- Track interest payments
- Document additional loans
- Add notes to activities
- View activity history for each debt
- Edit and delete activities

### Dashboard & Reporting
- Overview of total debts owed and owing
- Recent debt activities summary
- Financial summary with net balance calculation
- Visual representation of debt distribution

### User Interface
- Responsive design for mobile and desktop
- Dark mode interface
- Card and table view options for data display
- Intuitive navigation between sections

## 3. Technical Specifications

### Technology Stack
- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **CSS Framework**: Tailwind CSS 3.4.1
- **State Management**: React Hooks
- **Routing**: React Router DOM 6.22.3
- **Notifications**: React Hot Toast 2.4.1
- **Icons**: Lucide React 0.344.0

### Backend & Database
- **Backend Service**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **API Client**: Supabase JS Client 2.39.7

### Database Schema
1. **profiles**
   - id (UUID, primary key, references auth.users)
   - name (text)
   - email (text)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **contacts**
   - id (UUID, primary key)
   - user_id (UUID, references auth.users)
   - name (text, required)
   - referral_name (text, optional)
   - address (text, optional)
   - phone (text, optional)
   - created_at (timestamp)
   - updated_at (timestamp)

3. **debts**
   - id (UUID, primary key)
   - user_id (UUID, references auth.users)
   - contact_id (UUID, references contacts)
   - principal_amount (decimal, required)
   - interest_rate (decimal, required)
   - debt_date (date, required)
   - type (text, enum: 'I Owe', 'Owe Me')
   - notes (text, optional)
   - created_at (timestamp)
   - updated_at (timestamp)

4. **debt_activities**
   - id (UUID, primary key)
   - debt_id (UUID, references debts)
   - user_id (UUID, references auth.users)
   - activity_type (text, enum: 'Payment', 'Interest', 'Additional Loan', 'Note')
   - amount (decimal)
   - activity_date (date)
   - notes (text, optional)
   - created_at (timestamp)
   - updated_at (timestamp)

### Security Requirements
- Row-Level Security (RLS) policies for all database tables
- User authentication with JWT tokens
- Data isolation between users
- Secure password handling

### API Specifications
- RESTful API endpoints via Supabase client
- CRUD operations for contacts, debts, and activities
- Server-side filtering, sorting, and pagination
- Real-time data updates where applicable

## 4. Quality Standards

### Code Style Guidelines
- TypeScript for type safety
- ESLint for code linting
- Consistent component structure
- Proper error handling
- Comprehensive type definitions

### Security Standards
- Authentication for all protected routes
- Row-Level Security for database access
- Input validation and sanitization
- Secure handling of sensitive information

### Accessibility Standards
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Focus management for interactive elements

### Browser/Device Compatibility
- Support for modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile, tablet, and desktop
- Touch-friendly interface for mobile devices

### Performance Requirements
- Fast initial load time
- Efficient data fetching with pagination
- Optimized rendering for large data sets
- Minimal bundle size

## 5. Implementation Details

### Component Structure
- **Authentication**: Login/signup forms, auth state management
- **Layout**: Navigation, sidebar, responsive container
- **Contacts**: Contact list, contact form, search/filter
- **Debts**: Debt list, debt form, search/filter
- **Activities**: Activity list, activity form
- **Dashboard**: Summary cards, recent activity, financial overview

### Data Flow
- Supabase client for data fetching and mutations
- React state for UI management
- React Router for navigation
- Context or props for sharing data between components

### Error Handling
- Toast notifications for user feedback
- Graceful error recovery
- Detailed error logging
- User-friendly error messages

### Testing Strategy
- Component testing with appropriate testing library
- Integration testing for critical user flows
- End-to-end testing for key features
- Accessibility testing

## 6. Future Enhancements

### Potential Features
- Export data to CSV/PDF
- Debt reminders and notifications
- Recurring payment tracking
- Multi-currency support
- Debt categorization
- Advanced reporting and analytics
- Mobile application
- Dark/light theme toggle
- Data visualization improvements

### Scalability Considerations
- Optimized database queries for larger datasets
- Caching strategies for frequently accessed data
- Performance monitoring and optimization
- Infrastructure scaling as user base grows
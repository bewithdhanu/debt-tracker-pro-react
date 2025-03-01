# Debt Tracker Pro

📊 A modern React-based debt management application for tracking personal and business debts.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## 🚀 Features

- **Real-time Debt Tracking**: Monitor all your debts in real-time
- **Smart Interest Calculations**: Automatic interest calculations based on custom rates
- **Contact Management**: Organize debtors and creditors efficiently
- **Activity History**: Track all debt-related activities and changes
- **Multi-view Support**: Toggle between card and table views
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode**: Easy on the eyes with a modern dark theme
- **Secure Authentication**: Powered by Supabase authentication

## 🛠️ Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Build Tool**: Vite
- **Icons**: Lucide Icons
- **State Management**: React Hooks
- **Forms**: Custom form handling

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bewithdhanu/debt-tracker-pro-react.git
   cd debt-tracker-pro-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

1. Create a new project in Supabase
2. Run the migration files located in `supabase/migrations/`
3. Update your environment variables with the new project credentials

## 🔒 Environment Variables

Required environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 📱 Features Breakdown

### Debt Management
- Create, edit, and delete debts
- Track principal amount and interest rates
- Mark debts as active or completed
- Add notes and track important dates

### Contact Management
- Maintain a contact database
- Track referral information
- Store contact details securely

### Activity Tracking
- Log all debt-related activities
- Track interest payments
- Add notes and updates
- View activity history

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

## 📧 Contact

For any queries or support, please open an issue in the repository. 
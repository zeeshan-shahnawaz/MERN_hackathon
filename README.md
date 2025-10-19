# 🏥 HealthMate – Sehat ka Smart Dost

**A bilingual (English + Roman Urdu) AI-powered personal health companion app built with Gemini AI.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![Next.js Version](https://img.shields.io/badge/next.js-14.0.4-black)](https://nextjs.org/)

## 🧭 Project Vision

> **Goal:** Help users store and understand their medical reports easily using AI.  
> **Problem:** People lose track of reports and struggle to understand medical terms.  
> **Solution:** A personal health vault that explains your reports in *simple English + Roman Urdu.*

## ✨ Features

- ✅ **AI-Powered Analysis**: Gemini AI reads and explains medical reports
- ✅ **Bilingual Support**: Explanations in English and Roman Urdu
- ✅ **Secure Storage**: Encrypted cloud storage for medical files
- ✅ **Health Timeline**: Complete health history tracking
- ✅ **Vital Signs**: Manual entry and tracking of health metrics
- ✅ **Smart Insights**: AI-generated questions for doctors
- ✅ **Responsive Design**: Works on all devices
- ✅ **JWT Authentication**: Secure user authentication
- ✅ **Medical Disclaimers**: Clear AI usage guidelines

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **File Storage**: Cloudinary
- **AI Integration**: Google Gemini 1.5 Pro
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Cloudinary account
- Google AI Studio account (for Gemini API)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/healthmate.git
cd healthmate
```

### 2. Environment Setup

Copy the environment variables from `env_variables.txt` and create your `.env` files:

```bash
# Backend
cp env_variables.txt backend/.env

# Frontend  
cp env_variables.txt frontend/.env.local
```

Fill in your actual values in both `.env` files.

### 3. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```1

### 4. Start Development Servers

```bash
# Terminal 1 - Backend (from backend directory)
npm run dev

# Terminal 2 - Frontend (from frontend directory)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
healthmate/
├── backend/                 # Node.js backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middleware/         # Custom middleware
│   └── server.js           # Entry point
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities and API client
│   │   ├── types/         # TypeScript types
│   │   └── hooks/         # Custom hooks
│   └── public/            # Static assets
├── env_variables.txt       # Environment variables template
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Key environment variables you need to configure:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/healthmate

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=5000
NODE_ENV=development
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Files
- `POST /api/files/upload` - Upload medical report
- `GET /api/files` - Get user's files
- `GET /api/files/:id` - Get specific file
- `DELETE /api/files/:id` - Delete file

#### AI Insights
- `GET /api/insights` - Get AI insights
- `GET /api/insights/:id` - Get specific insight
- `PUT /api/insights/:id/feedback` - Update feedback

#### Vitals
- `POST /api/vitals` - Add vital reading
- `GET /api/vitals` - Get vitals
- `GET /api/vitals/latest` - Get latest vitals

## 🎨 UI Components

The frontend includes a comprehensive set of reusable components:

- **Layout Components**: Header, Sidebar, Footer
- **Form Components**: Input, Button, Select, FileUpload
- **Data Display**: Cards, Tables, Charts, Badges
- **Navigation**: Tabs, Breadcrumbs, Pagination
- **Feedback**: Toast notifications, Loading states
- **Authentication**: Login, Register, Profile forms

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Input Validation**: Request data sanitization
- **File Upload Security**: Type and size validation

## 🧠 AI Integration

### Gemini AI Features

- **Medical Report Analysis**: Automatic reading of PDFs and images
- **Bilingual Summaries**: English and Roman Urdu explanations
- **Key Findings Extraction**: Important values and parameters
- **Abnormal Value Detection**: Critical findings identification
- **Doctor Questions**: AI-generated questions for consultations
- **Health Recommendations**: Lifestyle and medical suggestions

### Example AI Prompt

```javascript
const prompt = `
Read this medical report and explain it in simple words.
Return:
- Summary in English
- Summary in Roman Urdu  
- Abnormal values highlighted
- 3–5 questions to ask the doctor
- Suggested diet or home tips
Add a note: "Always consult your doctor before making any decision."
`;
```

## 📱 Responsive Design

The application is fully responsive and works on:

- **Desktop**: Full-featured dashboard
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Touch-friendly interface
- **Progressive Web App**: Installable on mobile devices

## 🚀 Deployment

### Backend Deployment (Render/Railway)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy with Node.js buildpack

### Frontend Deployment (Vercel)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Database (MongoDB Atlas)

1. Create a cluster
2. Set up database user
3. Configure network access
4. Get connection string

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📊 Performance

- **Backend**: Optimized with compression, caching, and efficient queries
- **Frontend**: Code splitting, lazy loading, and image optimization
- **Database**: Indexed queries and connection pooling
- **CDN**: Cloudinary for fast file delivery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Doctor integration
- [ ] Appointment scheduling
- [ ] Health reminders
- [ ] Family sharing
- [ ] Advanced analytics
- [ ] Integration with health devices

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful medical analysis
- **Cloudinary** for reliable file storage
- **MongoDB Atlas** for database hosting
- **Vercel** for frontend hosting
- **Render** for backend hosting

## ⚠️ Medical Disclaimer

> **Important**: This application uses AI for informational purposes only. The AI analysis should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions.

> **Urdu**: Yeh application AI ka use sirf information ke liye karta hai. AI analysis professional medical advice, diagnosis ya treatment ka replacement nahi hai. Medical decisions ke liye hamesha qualified healthcare professionals se consult karein.

---

**Made with ❤️ for better healthcare accessibility**

*"Yeh sirf ek project nahi, ek real-life problem ka digital solution hai."*

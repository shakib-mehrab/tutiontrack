# TuitionTrack

A comprehensive full-stack web application for tracking tuition progress built with Next.js, Firebase, and TypeScript.

## 🚀 Features

### Authentication & Authorization
- Role-based authentication (Teacher/Student)
- Email verification required for access
- Firebase Authentication integration
- NextAuth.js for session management

### Teacher Features
- **Dashboard Overview**
  - View all active tuitions
  - Real-time progress tracking
  - Quick class count management
  - Statistics overview

- **Student Management**
  - Add students via email
  - Auto-generate student accounts
  - Manage student details

- **Tuition Management**
  - Create new tuitions
  - Set schedules and class plans
  - Track monthly progress
  - Increment/decrement class counts
  - Reset monthly cycles

- **Export & Reporting**
  - Generate PDF reports
  - Filter by student/month
  - Detailed class logs

### Student Features
- **Personal Dashboard**
  - View assigned tuitions
  - Real-time progress updates
  - Class completion tracking

- **Export Capabilities**
  - Download personal reports
  - Real-time sync with teacher updates

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + NextAuth.js
- **PDF Generation**: jsPDF
- **Icons**: Lucide React
- **Real-time Updates**: Firestore listeners

## 📋 Prerequisites

- Node.js 18+ 
- Firebase account
- npm or yarn

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tutiontrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Get your Firebase configuration

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

   # NextAuth Configuration
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000

   # Firebase Admin SDK
   FIREBASE_ADMIN_PRIVATE_KEY=your_private_key_here
   FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email_here
   ```

5. **Firebase Admin Setup**
   - Generate a service account key in Firebase Console
   - Download the JSON file
   - Extract the private key and client email for environment variables

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000)

## 📊 Data Structure

### Collections in Firestore

**Users Collection**
```json
{
  "uid": "string",
  "email": "string",
  "role": "teacher | student",
  "name": "string",
  "createdAt": "timestamp",
  "emailVerified": "boolean",
  "linkedTuitions": ["tuition_id_1", "tuition_id_2"]
}
```

**Tuitions Collection**
```json
{
  "id": "string",
  "teacherId": "string",
  "teacherName": "string",
  "studentId": "string",
  "studentName": "string",
  "studentEmail": "string",
  "subject": "string",
  "startTime": "string",
  "endTime": "string",
  "daysPerWeek": "number",
  "plannedClassesPerMonth": "number",
  "currentMonthYear": "string",
  "takenClasses": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Class Logs Collection**
```json
{
  "id": "string",
  "tuitionId": "string",
  "date": "timestamp",
  "actionType": "increment | decrement | manual",
  "addedBy": "string",
  "addedByName": "string",
  "description": "string",
  "createdAt": "timestamp"
}
```

## 🔐 API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Tuitions
- `GET /api/tuitions` - Fetch user's tuitions
- `POST /api/tuitions` - Create new tuition
- `PATCH /api/tuitions/[id]/classes` - Update class count

### Students
- `POST /api/students` - Add new student (teachers only)

### Logs
- `GET /api/tuitions/[id]/logs` - Fetch class logs

## 🎯 Usage

### For Teachers

1. **Registration**: Sign up with your email and choose "Teacher" role
2. **Email Verification**: Check your email and verify your account
3. **Dashboard Access**: Sign in to access your teacher dashboard
4. **Add Students**: Use the system to add students by email
5. **Create Tuitions**: Set up tuitions with schedule and class plans
6. **Track Progress**: Use increment/decrement buttons to track classes
7. **Generate Reports**: Export PDF reports for students and tuitions

### For Students

1. **Account Creation**: Teachers add you to the system
2. **Email Verification**: Verify your email to gain access
3. **Dashboard Access**: Sign in to view your tuitions
4. **Track Progress**: Monitor your class progress in real-time
5. **Export Reports**: Download your progress reports

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Ensure all environment variables are set in your production environment:
- Firebase configuration
- NextAuth secret and URL
- Firebase Admin SDK credentials

## 🔒 Security Features

- Email verification required
- Role-based access control
- Server-side session validation
- Protected API routes
- Firebase security rules

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🎨 UI/UX Features

- Clean, modern interface
- Intuitive navigation
- Real-time updates
- Progress visualizations
- Loading states
- Error handling
- Success notifications

## 🔄 Real-time Updates

- Firestore listeners for live data
- Instant progress updates
- Real-time sync between teacher and student dashboards

## 📋 Future Enhancements

- [ ] Email notifications for class updates
- [ ] Calendar integration
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] Bulk operations
- [ ] File attachments
- [ ] Payment integration
- [ ] SMS notifications

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify environment variables
   - Check Firebase project configuration
   - Ensure Firestore security rules are set

2. **Authentication Problems**
   - Verify email is confirmed
   - Check NextAuth configuration
   - Ensure correct role assignment

3. **Build Errors**
   - Clear `.next` folder
   - Reinstall dependencies
   - Check TypeScript errors

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please create an issue in the repository or contact the development team.

---

Built with ❤️ using Next.js and Firebase

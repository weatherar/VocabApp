# English Vocabulary Learning App

A web application for learning English vocabulary, built with React, TypeScript, and Firebase.

## Features

- User authentication (sign up/sign in)
- Add, view, and delete vocabulary words
- Example sentences for each word
- Responsive design
- Protected routes

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   cd vocab-app
   npm install
   ```

3. Create a Firebase project:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Create a Firestore database

4. Configure environment variables:

   - Copy `.env` to `.env.local`
   - Replace the placeholder values with your Firebase configuration

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── pages/         # Page components
  ├── hooks/         # Custom hooks
  ├── config/        # Configuration files
  └── types/         # TypeScript type definitions
```

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Firebase (Authentication & Firestore)
- React Router
- Vite

## License

MIT

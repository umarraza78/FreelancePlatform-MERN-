# SkillSwap-Platform

A full-stack web application that connects freelancers with clients, facilitating project creation, bidding, collaboration, and secure payments.

## Features

### For Clients
- Create and manage projects
- Browse qualified freelancers
- Review project proposals and bids
- Real-time chat with freelancers
- Milestone-based payment system
- Rate and review freelancers
- Track project progress
- Analytics dashboard

### For Freelancers
- Professional profile management
- Portfolio showcase
- Skill management
- Browse and bid on projects
- Real-time project chat
- Track earnings
- Receive client reviews
- Status tracking

### General Features
- Secure authentication system
- Real-time notifications
- Document management
- Admin dashboard
- Analytics and reporting
- Review and rating system

## Technology Stack

### Frontend
- React.js
- Redux for state management
- Tailwind CSS for styling
- Socket.io client for real-time features
- Craco for Create React App configuration override

### Backend
- Node.js
- Express.js
- MongoDB (Database)
- Socket.io for real-time communication
- JWT for authentication
- Multer for file uploads

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/      # Context providers
│   │   ├── features/     # Feature modules
│   │   ├── pages/        # Page components
│   │   └── utils/        # Utility functions
│   
├── server/                # Backend Node.js application
│   ├── controllers/      # Route controllers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   └── utils/          # Utility functions
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone  https://github.com/ahmadijaz02/SkillSwap-Platform.git
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
```

4. Set up environment variables:
Create `.env` files in both client and server directories with necessary configurations.

### Running the Application

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend development server:
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

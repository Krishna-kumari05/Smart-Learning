# 🎓 Smart Learning Platform

> An AI-powered learning platform that transforms study materials into personalized learning experiences through intelligent note generation, quizzes, flashcards, and knowledge visualization.


## 🌐 Live Demo

**Frontend:** https://smart-learning-alpha.vercel.app/

---

# 📖 Overview

Smart Learning Platform is a full-stack AI-powered web application designed to help students study more efficiently.

Instead of reading lengthy documents manually, users can upload study materials and generate AI-powered learning resources such as:

- 📚 Smart Notes
- 📝 Interactive Quizzes
- 🎴 Flashcards
- 🌳 Knowledge Tree
- 🎥 Learning from YouTube content

The platform personalizes the learning experience through user onboarding and provides an intuitive dashboard for managing study sessions.

---

# ✨ Features

## 🔐 Authentication

- User Signup
- User Login
- JWT Authentication
- Password Encryption using bcrypt
- Protected Routes

---

## 👤 Personalized Onboarding

Users can personalize their learning experience by providing:

- Branch
- Daily free time
- Most energetic study hours
- Study preferences

---

## 📄 AI Learning

Upload study material and let AI generate:

- Detailed Notes
- Topic-wise Explanation
- Easy-to-understand Summaries

Powered by OpenAI API.

---

## ❓ Quiz Generator

Generate AI-powered quizzes from uploaded learning material.

- Multiple Questions
- Instant Revision
- Knowledge Testing

---

## 🎴 Flashcards

Generate flashcards automatically for quick revision.

Useful for:

- Exam Preparation
- Interview Revision
- Memory Retention

---

## 🌳 Knowledge Tree

Visual representation of concepts showing relationships between different topics for better understanding.

---

## 📺 Learn from YouTube

Generate learning content using YouTube educational videos.

---

## 📊 Personalized Dashboard

Track learning activities from a centralized dashboard.

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios

---

## Backend

- Node.js
- Express.js

---

## Database

- MongoDB

---

## Authentication

- JWT
- bcrypt

---

## AI Integration

- OpenAI API

---

## Deployment

Frontend

- Vercel

Backend

- Render

---

# 🏗 System Architecture

```
                   User
                     │
                     ▼
          React + Tailwind Frontend
                     │
                Axios API Calls
                     │
                     ▼
            Express.js Backend
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
 Authentication   OpenAI API    MongoDB
    (JWT)                         Database
```

---

# 📂 Project Structure

```
Smart-Learning

├── frontend
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── context
│   │   ├── hooks
│   │   ├── services
│   │   └── assets
│   └── package.json
│
├── backend
│   ├── config
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── controllers
│   ├── utils
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing using bcrypt
- Protected API Routes
- Environment Variables
- Secure Password Storage

---

# 🚀 Challenges Faced

- Integrating OpenAI API
- Designing secure authentication
- Managing frontend and backend communication
- Deploying frontend and backend separately
- Handling asynchronous API calls
- Building responsive UI
- Managing user onboarding flow

---

# 📚 Learning Outcomes

This project helped me gain hands-on experience with

- Full Stack Web Development
- React.js
- Express.js
- MongoDB
- REST APIs
- JWT Authentication
- OpenAI API Integration
- Deployment using Vercel and Render
- Responsive UI Design
- API Error Handling

---

# 🤝 Contributing

Contributions are welcome.

If you'd like to improve this project:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

# 👩‍💻 Author

**Krishna Kumari**

B.Tech Computer Science and Engineering

National Institute of Technology Silchar

GitHub

https://github.com/Krishna-kumari05

---

# ⭐ If you found this project useful

Please consider giving it a ⭐ on GitHub.
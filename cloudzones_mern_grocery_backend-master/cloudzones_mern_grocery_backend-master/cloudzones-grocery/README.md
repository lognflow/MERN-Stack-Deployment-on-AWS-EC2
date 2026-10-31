# CloudZones Grocery Store

Full Stack MERN Project on AWS EC2

## Tech Stack
- MongoDB
- Express.js
- React.js
- Node.js
- AWS EC2 (Ubuntu)
- Nginx (optional)

## 1️⃣ Project Architecture
```
User
  ↓
React Frontend (Port 3000)
  ↓
Node.js / Express API (Port 5000)
  ↓
MongoDB Database (Port 27017)
```

## 2️⃣ Project Folder Structure
```
cloudzones-grocery
│
├── backend
│   ├── server.js
│   ├── package.json
│   ├── models
│   │      └── productModel.js
│   ├── routes
│   │      └── productRoutes.js
│   └── config
│          └── db.js
│
├── frontend
│   ├── package.json
│   ├── public
│   └── src
│        ├── App.js
│        ├── components
│        │      └── ProductList.js
│        └── pages
│               └── Home.js
│
└── README.md
```

## Setup Instructions

### Backend
1. `cd backend`
2. `npm install`
3. `node server.js`
The backend runs on `http://localhost:5000`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm start`
The frontend runs on `http://localhost:3000`

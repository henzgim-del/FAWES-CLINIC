const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// 1. Load environment variables first
dotenv.config();

// 2. Initialize Express app
const app = express();

// 3. Connect to MongoDB
connectDB();

// 4. Middleware
app.use(cors());
app.use(express.json());

// 5. Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const visitRoutes = require('./routes/visitRoutes');
const labTestRoutes = require('./routes/labTestRoutes');
const stockRoutes = require('./routes/stockRoutes');
const documentRoutes = require('./routes/documentRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/lab-tests', labTestRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/stock', stockRoutes);

// 6. Base Health Check Route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Fawes Clinic Management System API is running successfully',
    timestamp: new Date().toISOString()
  });
});

// 7. Define Port & Listen
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
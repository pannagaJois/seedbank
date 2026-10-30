const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

// CORS configuration: restrict to FRONTEND_URL if set, otherwise allow all
const frontendUrl = process.env.FRONTEND_URL;
if (frontendUrl) {
  const allowedOrigins = [
    frontendUrl,
    frontendUrl.replace(/\/$/, '')
  ];
  app.use(cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. curl, health checks) or matching origin
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true
  }));
} else {
  app.use(cors());
}

app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'seed-bank-api',
    port,
    timestamp: new Date().toISOString()
  });
});

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const varietiesRoutes = require('./routes/varieties');
const contributorsRoutes = require('./routes/contributors');
const facilitiesRoutes = require('./routes/facilities');
const batchesRoutes = require('./routes/batches');
const recipientsRoutes = require('./routes/recipients');
const distributionsRoutes = require('./routes/distributions');
const viabilityRoutes = require('./routes/viabilityChecks');
const reportsRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/varieties', varietiesRoutes);
app.use('/api/contributors', contributorsRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/recipients', recipientsRoutes);
app.use('/api/distributions', distributionsRoutes);
app.use('/api/viability', viabilityRoutes);
app.use('/api/reports', reportsRoutes);

// Error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

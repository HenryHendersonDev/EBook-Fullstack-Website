// Packages
import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Middleware
import createRateLimiterMiddleware from '@/middlewares/rateLimiterMiddleware';
import errorMiddleware from '@/middlewares/errorHandleMiddleware';
import setRedis from '@/middlewares/redisMiddleware';
import { requestLogger, errorLogger } from '@/middlewares/loggerMiddleware';
import cookieParserSet from '@/middlewares/cookieMiddleware';
// Config
import { APPLICATION_CONFIG } from '@/config/applicationConfig';
// Routes
import indexRouter from '@/api/v1/routes/index.routes';

// Init Express JS
const app: Express = express();
app.set('trust proxy', 1);

// Use Middlewares
app.use(helmet());
app.use(
  helmet.hsts({
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  })
);
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.noSniff());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === process.env['FRONTEND_URL']) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(
  compression({
    level: -1,
    threshold: 0,
    filter: (req) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return true;
    },
  })
);

app.use(cookieParserSet());
app.use(bodyParser.json());
app.use(setRedis());
if (APPLICATION_CONFIG.RATE_LIMIT) {
  app.use('/', createRateLimiterMiddleware(500, '1m'));
}
if (APPLICATION_CONFIG.WINSTON_LOGGING) {
  app.use(requestLogger);
}

// Use Router
app.use('/', indexRouter);

if (APPLICATION_CONFIG.WINSTON_LOGGING) {
  app.use(errorLogger);
}
app.use(errorMiddleware);

export default app;

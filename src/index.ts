import { startServer } from './startServer';
import { Container } from 'typedi';
import * as typeorm from 'typeorm';
import { logger } from './config/winston.config';
import { collectDefaultMetrics } from 'prom-client';

console.log('Server boots up!');

typeorm.useContainer(Container);

collectDefaultMetrics();

startServer().catch((err) => logger.error(err.message));

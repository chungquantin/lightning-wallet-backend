import { buildGateway } from './gateway';
import { Container } from 'typedi';
import * as typeorm from 'typeorm';
import { collectDefaultMetrics } from 'prom-client';

console.log('Server boots up!');

typeorm.useContainer(Container);

collectDefaultMetrics();

buildGateway().catch((err) => console.log(err));

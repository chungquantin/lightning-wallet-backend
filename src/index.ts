import { startServer } from './startServer';
import { Container } from 'typedi';
import * as typeorm from 'typeorm';
import { logger } from './config/winston.config';
import { collectDefaultMetrics } from 'prom-client';
import * as cluster from 'cluster';
import * as os from 'os';

const numCPUs = os.cpus().length;

console.log('Server boots up!');

typeorm.useContainer(Container);

collectDefaultMetrics();

//if (cluster.isMaster) {
//	console.log(`Master process ${process.pid}`);
//	for (let i = 0; i < numCPUs; i++) {
//		cluster.fork();
//	}
//	cluster.on('exit', (worker) => {
//		console.log(`Worker process ${worker.id} had died`);
//		console.log(`Only ${Object.keys(cluster.workers).length}`);
//		cluster.fork();
//	});
//} else {
//	console.log(`Worker process ${process.pid}`);
//}

startServer().catch((err) => logger.error(err.message));

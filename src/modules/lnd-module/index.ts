import Container from 'typedi';
import { useContainer } from 'typeorm';
import * as Server from './server';

useContainer(Container);

Server.listen(3003).then((url) =>
	console.log('Lightning Daemon Service boots successfully'),
);

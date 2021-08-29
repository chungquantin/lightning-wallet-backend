import Container from 'typedi';
import { useContainer } from 'typeorm';
import * as Server from './server';

useContainer(Container);

Server.listen(3002).then((url) =>
	console.log('Bank Service boots successfully'),
);

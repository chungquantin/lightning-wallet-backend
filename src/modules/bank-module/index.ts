import * as Server from './server';

Server.listen(3002).then((url) =>
	console.log('Bank Service boots successfully'),
);

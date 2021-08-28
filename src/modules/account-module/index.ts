import * as Server from './server';

Server.listen(3001).then((url) =>
	console.log('Account Service boots successfully'),
);

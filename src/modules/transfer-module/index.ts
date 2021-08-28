import * as Server from './server';

Server.listen(3004).then((url) =>
	console.log('Transfer Service boots successfully'),
);

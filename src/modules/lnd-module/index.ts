import * as Server from './server';

Server.listen(3003).then((url) =>
	console.log('Lightning Daemon Service boots successfully'),
);

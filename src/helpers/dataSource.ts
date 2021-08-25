import { RemoteGraphQLDataSource } from '@apollo/gateway';

export class FederatedServiceDataSource extends RemoteGraphQLDataSource {
	willSendRequest({ request, context }) {
		request.http?.headers.set(
			'currentUser',
			(context as any).currentUser
				? JSON.stringify((context as any).currentUser)
				: '',
		);
	}
}

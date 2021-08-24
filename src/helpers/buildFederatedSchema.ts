import gql from 'graphql-tag';
import {
	printSchema,
	buildFederatedSchema as buildApolloFederationSchema,
} from '@apollo/federation';
import {
	addResolversToSchema,
	GraphQLResolverMap,
} from 'apollo-graphql';
import {
	buildSchemaSync,
	createResolversMap,
	BuildSchemaOptions,
} from 'type-graphql';
import federationDirectives from '@apollo/federation/dist/directives';
import { specifiedDirectives } from 'graphql';

export async function buildFederatedSchema(
	options: Omit<BuildSchemaOptions, 'skipCheck'>,
	referenceResolvers?: GraphQLResolverMap<any>,
) {
	const schema = await buildSchemaSync({
		...options,
		directives: [
			...specifiedDirectives,
			...federationDirectives,
			...(options.directives || []),
		],
		skipCheck: true,
	});

	const federatedSchema = buildApolloFederationSchema({
		typeDefs: gql(printSchema(schema)),
		resolvers: createResolversMap(schema) as any,
	});

	if (referenceResolvers) {
		addResolversToSchema(federatedSchema, referenceResolvers);
	}
	return federatedSchema;
}

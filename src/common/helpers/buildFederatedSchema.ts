import gql from 'graphql-tag';
import { buildSubgraphSchema as buildApolloFederationSchema } from '@apollo/federation';
import {
	addResolversToSchema,
	GraphQLResolverMap,
} from 'apollo-graphql';
import {
	createResolversMap,
	BuildSchemaOptions,
	buildSchemaSync,
} from 'type-graphql';
import { specifiedDirectives } from 'graphql';
import { printSchemaWithDirectives } from 'graphql-tools';
import { writeFileSync } from 'fs';

const exportGraphQL = async (
	schema: any,
	path?: string,
	fileName?: string,
) => {
	const sdl = printSchemaWithDirectives(schema);
	return writeFileSync(path + `/${fileName}.graphql`, sdl);
};

export async function buildFederatedSchema(
	options: Omit<BuildSchemaOptions, 'skipCheck'>,
	referenceResolvers?: GraphQLResolverMap<any>,
	path?: string,
) {
	const schema = await buildSchemaSync({
		...options,
		directives: [
			...specifiedDirectives,
			...(options.directives || []),
		],
		skipCheck: true,
	});

	exportGraphQL(schema, path, 'service-schema');

	const federatedSchema = buildApolloFederationSchema({
		typeDefs: gql(printSchemaWithDirectives(schema)),
		resolvers: createResolversMap(schema) as any,
	});

	if (referenceResolvers) {
		addResolversToSchema(federatedSchema, referenceResolvers);
	}
	return federatedSchema;
}

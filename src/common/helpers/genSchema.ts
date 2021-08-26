import { GraphQLSchema } from "graphql";
import { buildSchema } from "type-graphql";
import { Container } from "typedi";
import * as path from "path";
import { redisPubSub } from "./redis";
import { customAuthChecker } from "../utils/authChecker";
import { ResolveTime } from "../middleware";
import * as User from "../../modules/account-module/resolvers/user";

export const genSchema = async (): Promise<GraphQLSchema> => {
	// const modulePath = "../modules/**/*.resolver.{ts,js}";
	// path.join(__dirname + modulePath)
	const schema = await buildSchema({
		resolvers: [
			User.GetUserResolver,
			User.GetUsersResolver,
			User.LoginResolver,
			User.LogoutResolver,
			User.MeResolver,
			User.RegisterResolver,
			User.ForgotPasswordResolver,
		],
		container: Container,
		pubSub: redisPubSub,
		authChecker: customAuthChecker,
		globalMiddlewares: [ResolveTime],
	});

	return schema;
};

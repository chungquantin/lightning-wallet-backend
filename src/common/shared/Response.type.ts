import { GraphQLScalarType } from 'graphql';
import { ClassType, Field, ObjectType } from 'type-graphql';

@ObjectType({ isAbstract: true })
abstract class ApiError {
	@Field()
	path?: string;

	@Field()
	message?: string;
}

@ObjectType({ isAbstract: true })
abstract class BaseApiResponse {
	@Field()
	success: boolean;

	@Field(() => [ApiError], { nullable: true })
	errors?: ApiError[];
}

export function ApiResponse<MType>(
	name: string,
	MClass:
		| ClassType<MType>
		| GraphQLScalarType
		| String
		| Number
		| Boolean,
) {
	@ObjectType(name, { isAbstract: true })
	class ApiResponseClass extends BaseApiResponse {
		@Field(() => MClass, { nullable: true })
		data?: MType;
	}

	return ApiResponseClass as new () => {
		[key in keyof ApiResponseClass]: ApiResponseClass[key];
	};
}

export function ApiArrayResponse<MType>(
	name: string,
	MClass:
		| ClassType<MType>
		| GraphQLScalarType
		| String
		| Number
		| Boolean,
) {
	@ObjectType(name, { isAbstract: true })
	class ApiArrayResponseClass extends BaseApiResponse {
		@Field(() => [MClass])
		data: MType[];
	}

	return ApiArrayResponseClass as new () => {
		[key in keyof ApiArrayResponseClass]: ApiArrayResponseClass[key];
	};
}

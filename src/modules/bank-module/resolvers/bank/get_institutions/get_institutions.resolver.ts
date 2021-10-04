import { Resolver, Query } from 'type-graphql';
import { ApiArrayResponse } from 'neutronpay-wallet-common/dist/shared';
import { Institution } from '../../../entity';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { InstitutionRepository } from '../../../repository';

export const ApiGetInstitutions = ApiArrayResponse<Institution>(
	'GetInstitutions',
	Institution,
);
export type ApiGetInstitutionsType = InstanceType<
	typeof ApiGetInstitutions
>;

@Resolver((of) => Institution)
class GetInstitutionsResolver {
	@InjectRepository(InstitutionRepository)
	private readonly institutionRepository: InstitutionRepository;

	@Query(() => ApiGetInstitutions, { nullable: true })
	async getInstitutions(): Promise<ApiGetInstitutionsType> {
		const institutions = await this.institutionRepository.find();
		return {
			success: true,
			data: institutions,
		};
	}
}

export default GetInstitutionsResolver;

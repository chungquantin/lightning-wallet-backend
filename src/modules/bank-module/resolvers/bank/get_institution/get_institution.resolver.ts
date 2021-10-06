import { Resolver, Query, Arg, Ctx } from 'type-graphql';
import { ApiResponse } from 'neutronpay-wallet-common/dist/shared';
import { Institution } from '../../../entity';
import { GetInstitutionDto } from './get_institution.dto';
import { BankGQLContext } from '../../../server';
import { CountryCode } from 'plaid';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { InstitutionRepository } from '../../../repository';

export const ApiGetInstitutionById = ApiResponse<Institution>(
	'GetInstitutionById',
	Institution,
);
export type ApiGetInstitutionByIdType = InstanceType<
	typeof ApiGetInstitutionById
>;

@Resolver((of) => Institution)
class GetInstitutionByIdResolver {
	@InjectRepository(InstitutionRepository)
	private readonly institutionRepository: InstitutionRepository;

	@Query(() => ApiGetInstitutionById, { nullable: true })
	async getInstitution(
		@Ctx() { dataSources }: BankGQLContext,
		@Arg('data') { institutionId }: GetInstitutionDto,
	): Promise<ApiGetInstitutionByIdType> {
		const institutionInDatabase =
			await this.institutionRepository.findOne({
				where: {
					institutionId,
				},
			});
		if (institutionInDatabase) {
			return {
				success: true,
				data: institutionInDatabase,
			};
		}
		const { data } =
			await dataSources.plaidClient.institutionsGetById({
				institution_id: institutionId,
				country_codes: [CountryCode.Ca, CountryCode.Es],
			});
		console.log(data);
		const institution = data.institution;
		if (!institution) {
			return {
				success: false,
				errors: [
					{
						message: 'No institution found',
						path: 'institution_id',
					},
				],
			};
		}
		const newInstitution = await this.institutionRepository
			.create({
				institutionId: institution.institution_id,
				institutionLogo: institution.logo,
				institutionName: institution.name,
				primaryColor: institution.primary_color,
			})
			.save();
		return {
			success: true,
			data: newInstitution,
		};
	}
}

export default GetInstitutionByIdResolver;

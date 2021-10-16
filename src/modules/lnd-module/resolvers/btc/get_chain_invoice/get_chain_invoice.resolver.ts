import { Resolver, Query, Arg } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { ChainInvoice } from "../../../entity";
import { ChainInvoiceRepository } from "../../../repository";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Service } from "typedi";
import { GetChainInvoiceDto } from "./get_chain_invoice.dto";

export const ApiGetChainInvoiceResponse = ApiResponse<ChainInvoice>(
  "GetChainInvoice",
  ChainInvoice
);
export type ApiGetChainInvoiceResponseType = InstanceType<
  typeof ApiGetChainInvoiceResponse
>;

@Service()
@Resolver(() => ChainInvoice)
class GetChainInvoiceResolver {
  @InjectRepository(ChainInvoiceRepository)
  private readonly chainInvoiceRepository: ChainInvoiceRepository;

  @Query(() => ApiGetChainInvoiceResponse, { nullable: true })
  async getChainInvoice(
    @Arg("data") { address }: GetChainInvoiceDto
  ): Promise<ApiGetChainInvoiceResponseType> {
    const chainInvoice = await this.chainInvoiceRepository.findOne({
      where: {
        address,
      },
    });

    if (!chainInvoice) {
      return {
        success: false,
        errors: [
          {
            message: "No onchain invoice found",
            path: "paymentRequest",
          },
        ],
      };
    }

    return {
      success: true,
      data: chainInvoice,
    };
  }
}

export default GetChainInvoiceResolver;

import { Resolver, Query, Arg } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { LightningInvoice } from "../../../entity";
import { LightningInvoiceRepository } from "../../../repository";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Service } from "typedi";
import { GetLightningInvoiceDto } from "./get_lightning_invoice.dto";

export const ApiGetLightningInvoiceResponse = ApiResponse<LightningInvoice>(
  "GetLightningInvoice",
  LightningInvoice
);
export type ApiGetLightningInvoiceResponseType = InstanceType<
  typeof ApiGetLightningInvoiceResponse
>;

@Service()
@Resolver(() => LightningInvoice)
class GetLightningInvoiceResolver {
  @InjectRepository(LightningInvoiceRepository)
  private readonly lightningInvoiceRepository: LightningInvoiceRepository;

  @Query(() => ApiGetLightningInvoiceResponse, { nullable: true })
  async getLightningInvoice(
    @Arg("data") { paymentRequest }: GetLightningInvoiceDto
  ): Promise<ApiGetLightningInvoiceResponseType> {
    const lightningInvoice = await this.lightningInvoiceRepository.findOne({
      where: {
        payReq: paymentRequest,
      },
    });

    if (!lightningInvoice) {
      return {
        success: false,
        errors: [
          {
            message: "No lightning invoice found",
            path: "paymentRequest",
          },
        ],
      };
    }

    return {
      success: true,
      data: lightningInvoice,
    };
  }
}

export default GetLightningInvoiceResolver;

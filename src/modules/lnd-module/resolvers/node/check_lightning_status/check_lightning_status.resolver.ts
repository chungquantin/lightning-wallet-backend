import { Resolver, Arg, Query } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { Service } from "typedi";
import { LookupInvoice } from "../../../node";
import { CheckLightningStatusDto } from "./check_lightning_status.dto";
import { LightningStatusResponse } from "../lightning_status";
import { LightningInvoiceRepository } from "../../../repository";
import { InjectRepository } from "typeorm-typedi-extensions";

export const ApiCheckLightningStatusResponse =
  ApiResponse<LightningStatusResponse>(
    "CheckLightningStatus",
    LightningStatusResponse
  );
export type ApiCheckLightningStatusResponseType = InstanceType<
  typeof ApiCheckLightningStatusResponse
>;

@Service()
@Resolver(() => LightningStatusResponse)
class CheckLightningStatusResolver {
  @InjectRepository(LightningInvoiceRepository)
  private readonly lightningInvoiceRepository: LightningInvoiceRepository;

  @Query(() => ApiCheckLightningStatusResponse, { nullable: true })
  async checkLightningStatus(
    @Arg("data") { userId }: CheckLightningStatusDto
  ): Promise<ApiCheckLightningStatusResponseType> {
    console.log("lightningNetworkStatus");
    const lightningInvoice = await this.lightningInvoiceRepository.findOne({
      where: {
        userId,
      },
      order: {
        createdAt: "DESC",
      },
    });
    if (!lightningInvoice) {
      return {
        success: false,
        errors: [
          {
            path: "userId",
            message: "Cannot find user lightning invoice",
          },
        ],
      };
    }
    console.log(lightningInvoice);
    if (typeof lightningInvoice.rHash !== "undefined") {
      return {
        success: false,
        errors: [
          {
            path: "rHash",
            message: "rHash is undefined",
          },
        ],
      };
    }
    const response = await LookupInvoice(lightningInvoice.rHash);
    if (!response) {
      return {
        success: false,
        errors: [
          {
            path: "rHash",
            message: "No invoice found",
          },
        ],
      };
    }
    console.log("lightningNetworkStatus data", response);
    if (response.settled) {
      return {
        success: true,
        data: { ...response, rHash: response.rHash.toString() },
      };
    }
    return {
      success: false,
      errors: [
        {
          path: "field-settled",
          message: "Invoice is not settled yet",
        },
      ],
    };
  }
}

export default CheckLightningStatusResolver;

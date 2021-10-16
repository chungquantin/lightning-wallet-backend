import { Arg, Query, Resolver } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { LookupLightningInvoiceDto } from "./lookup_lightning_invoice.dto";
import { Service } from "typedi";
import { LookupInvoice } from "../../../node";
import { LightningStatusResponse } from "../lightning_status";

export const ApiLookupLightningInvoiceResponse =
  ApiResponse<LightningStatusResponse>(
    "LookupLightningInvoice",
    LightningStatusResponse
  );
export type ApiLookupLightningInvoiceResponseType = InstanceType<
  typeof ApiLookupLightningInvoiceResponse
>;

@Service()
@Resolver(() => LightningStatusResponse)
class LookupLightningInvoiceResolver {
  @Query(() => ApiLookupLightningInvoiceResponse, {
    nullable: true,
  })
  async lookupLightningInvoice(
    @Arg("data")
    { rHash }: LookupLightningInvoiceDto
  ): Promise<ApiLookupLightningInvoiceResponseType> {
    const response = await LookupInvoice(
      new Uint8Array(JSON.parse(`[${rHash}]`))
    );
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

export default LookupLightningInvoiceResolver;

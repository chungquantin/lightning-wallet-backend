import { Resolver, Query, ObjectType, Field, Ctx } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { ChainInvoice, LightningInvoice } from "../../../entity";
import {
  ChainInvoiceRepository,
  LightningInvoiceRepository,
} from "../../../repository";
import { InjectRepository } from "typeorm-typedi-extensions";
import { LndGQLContext } from "../../../server";
import { Service } from "typedi";

@ObjectType()
class BtcAddress {
  @Field(() => LightningInvoice)
  lightningInvoice: LightningInvoice;

  @Field(() => ChainInvoice)
  chainInvoice: ChainInvoice;
}

export const ApiGetMyBtcAddress = ApiResponse<BtcAddress>(
  "getBtcAddress",
  BtcAddress
);
export type ApiGetMyBtcAddressType = InstanceType<typeof ApiGetMyBtcAddress>;

@Service()
@Resolver(() => BtcAddress)
class GetMyBtcAddressResolver {
  @InjectRepository(ChainInvoiceRepository)
  private readonly chainInvoiceRepository: ChainInvoiceRepository;
  @InjectRepository(LightningInvoiceRepository)
  private readonly lightningInvoiceRepository: LightningInvoiceRepository;

  @Query(() => ApiGetMyBtcAddress, { nullable: true })
  async getMyBtcAddress(
    @Ctx() { currentUser }: LndGQLContext
  ): Promise<ApiGetMyBtcAddressType> {
    const chainInvoice = await this.chainInvoiceRepository.findOne({
      where: {
        userId: currentUser?.userId,
      },
      order: { id: "DESC" },
    });
    if (!chainInvoice) {
      return {
        success: false,
        errors: [
          {
            message: "Chain invoice does not found",
          },
        ],
      };
    }
    const lightningInvoice = await this.lightningInvoiceRepository.findOne({
      where: {
        userId: currentUser?.userId,
      },
      order: { id: "DESC" },
    });
    if (!lightningInvoice) {
      return {
        success: false,
        errors: [
          {
            message: "Lightning invoice does not found",
          },
        ],
      };
    }
    return {
      success: true,
      data: {
        chainInvoice,
        lightningInvoice,
      },
    };
  }
}

export default GetMyBtcAddressResolver;

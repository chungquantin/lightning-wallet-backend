import { Resolver, Query, Arg, Ctx } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { BankAccount } from "../../../entity";
import { GetBankTransferDto } from "./get_bank_transfer.dto";
import { BankGQLContext } from "../../../server";
import { BankTransfer } from "../../../constants/BankTransfer";
import { Service } from "typedi";

export const ApiGetBankTransfer = ApiResponse<BankTransfer>(
  "GetBankTransfer",
  BankTransfer
);
export type ApiGetBankTransferType = InstanceType<typeof ApiGetBankTransfer>;

@Service()
@Resolver(() => BankAccount)
class GetBankTransferResolver {
  @Query(() => ApiGetBankTransfer, { nullable: true })
  async getBankTransfer(
    @Ctx() { dataSources }: BankGQLContext,
    @Arg("data") { bankTransferId }: GetBankTransferDto
  ): Promise<ApiGetBankTransferType> {
    const {
      data: { bank_transfer }
    } = await dataSources.plaidClient.bankTransferGet({
      bank_transfer_id: bankTransferId
    });
    return {
      success: true,
      data: {
        account_id: bank_transfer.account_id,
        ach_class: bank_transfer.ach_class,
        amount: bank_transfer.amount,
        cancellable: bank_transfer.cancellable,
        currency: bank_transfer.iso_currency_code,
        created: bank_transfer.created,
        customTag: bank_transfer.custom_tag as string,
        description: bank_transfer.description,
        direction: bank_transfer.direction as string,
        failure_reason: bank_transfer.failure_reason?.description as string,
        id: bank_transfer.id,
        legalName: bank_transfer.user.legal_name,
        network: bank_transfer.network,
        status: bank_transfer.status,
        originationAccountId: bank_transfer.origination_account_id,
        type: bank_transfer.type
      }
    };
  }
}

export default GetBankTransferResolver;

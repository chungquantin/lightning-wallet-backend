import { Resolver, Query, Arg } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { BankAccount } from "../../../entity";
import { InjectRepository } from "typeorm-typedi-extensions";
import { BankAccountRepository } from "../../../repository";
import { ServiceCustomMessage } from "../../../constants/CustomMessage";
import { GetBankAccountDto } from "./get_bank_account.dto";
import { Service } from "typedi";

export const ApiGetBankAccount = ApiResponse<BankAccount>(
  "GetBankAccount",
  BankAccount
);
export type ApiGetBankAccountType = InstanceType<typeof ApiGetBankAccount>;

@Service()
@Resolver(() => BankAccount)
class GetBankAccountResolver {
  @InjectRepository(BankAccountRepository)
  private readonly bankAccountRepository: BankAccountRepository;

  @Query(() => ApiGetBankAccount, { nullable: true })
  async getBankAccount(
    @Arg("data") { bankAccountId }: GetBankAccountDto
  ): Promise<ApiGetBankAccountType> {
    const bankAccount = await this.bankAccountRepository.findOne({
      where: {
        id: bankAccountId
      },
      relations: ["balance", "ach", "institution"]
    });
    if (!bankAccount) {
      return {
        success: false,
        errors: [
          {
            message: ServiceCustomMessage.bankIsNotFound,
            path: "bankAccountId"
          }
        ]
      };
    }
    return {
      success: true,
      data: bankAccount
    };
  }
}

export default GetBankAccountResolver;

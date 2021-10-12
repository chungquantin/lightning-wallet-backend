import { Resolver, Mutation, Ctx, Arg, UseMiddleware } from "type-graphql";
import { ApiResponse } from "neutronpay-wallet-common/dist/shared";
import { BankGQLContext } from "../../../server";
import { InjectRepository } from "typeorm-typedi-extensions";
import { ConnectBankAccountDto } from "./connect_bank_account.dto";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";
import {
  BankAccount,
  BankAccountAch,
  BankAccountBalance,
  Institution
} from "../../../entity";
import { CountryCode } from "plaid";
import {
  BankAccountAchRepository,
  BankAccountBalanceRepository,
  BankAccountRepository,
  InstitutionRepository
} from "../../../repository";
import { Service } from "typedi";

export const ApiConnectBankAccount = ApiResponse<String>(
  "ConnectBankAccount",
  String
);
export type ApiConnectBankAccountType = InstanceType<
  typeof ApiConnectBankAccount
>;

/**
	* [
  "public-sandbox-00c8fc9a-493b-476b-8ff6-2113101a1614",
  {
    "institution": {
      "id": "ins_116475",
      "name": "West Community Credit Union"
    },
    "accounts": [
      {
        "_id": "jdm6bjqVkjh6qX9nQEr6cZ4gQpxeMeF6PVGPx",
        "meta": {
          "name": "Plaid Saving",
          "number": "1111"
        },
        "subtype": "savings",
        "type": "depository"
      }
    ],
    "linkSessionId": "6893a544-8f6b-41a1-8245-651121e53ff4"
  }
]
 */
@Service()
@Resolver(() => BankAccount)
class ConnectBankAccountResolver {
  @InjectRepository(BankAccountRepository)
  private readonly bankAccountRepository: BankAccountRepository;
  @InjectRepository(BankAccountBalanceRepository)
  private readonly bankAccountBalanceRepository: BankAccountBalanceRepository;
  @InjectRepository(BankAccountAchRepository)
  private readonly bankAccountAchRepository: BankAccountAchRepository;
  @InjectRepository(InstitutionRepository)
  private readonly institutionRepository: InstitutionRepository;

  @UseMiddleware(isAuth)
  @Mutation(() => ApiConnectBankAccount, { nullable: true })
  async connectBankAccount(
    @Ctx()
    { dataSources: { plaidClient }, currentUser }: BankGQLContext,
    @Arg("data")
    { accountId, publicToken, institutionId }: ConnectBankAccountDto
  ): Promise<ApiConnectBankAccountType> {
    try {
      let scopedAch: BankAccountAch,
        scopedBalance: BankAccountBalance,
        scopedInstitution: Institution;

      const createdBankAccount = this.bankAccountRepository.create({
        accountId: accountId
      });
      const {
        data: { access_token }
      } = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken
      });
      const authResponse = await plaidClient.authGet({
        access_token
      });
      // Handle institution
      const institutionInDatabase = await this.institutionRepository.findOne({
        where: {
          institutionId
        }
      });
      if (!institutionInDatabase) {
        const {
          data: { institution }
        } = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Ca, CountryCode.Us]
        });
        console.log(institution);
        if (!institution) {
          return {
            success: false,
            errors: [
              {
                message: "No Plaid institution found",
                path: "institutionId"
              }
            ]
          };
        }
        scopedInstitution = this.institutionRepository.create({
          institutionId: institution.institution_id,
          institutionLogo: institution.logo,
          institutionName: institution.name,
          primaryColor: institution.primary_color,
          websiteUrl: institution.url
        });
      }
      scopedInstitution = institutionInDatabase as Institution;

      // Handle ACH
      const achList = authResponse.data.numbers.ach;
      achList.forEach(async ach => {
        if (ach.account_id === accountId) {
          // Handle add bank account
          scopedAch = this.bankAccountAchRepository.create({
            account: ach.account as string,
            routingNumber: ach.routing as string,
            wire_routing: ach.wire_routing as string
          });
          createdBankAccount.ach = scopedAch;
        }
      });

      const accountList = authResponse.data.accounts;
      accountList.forEach(async account => {
        // Handle add bank account
        if (account.account_id === accountId) {
          const balance = account.balances;
          scopedBalance = this.bankAccountBalanceRepository.create({
            availableBalance: balance.available as number,
            currentBalance: balance.current as number,
            limitBalance: balance.limit as number,
            unofficialCurrencyCode: balance.unofficial_currency_code as string,
            isoCurrencyCode: balance.iso_currency_code as string
          });

          createdBankAccount.balance = scopedBalance;
          createdBankAccount.accountId = accountId;
          createdBankAccount.userId = currentUser?.userId as string;
          createdBankAccount.name = account.name;
          createdBankAccount.subType = account?.subtype?.toString() as string;
          createdBankAccount.officialName = account?.official_name?.toString() as string;
          createdBankAccount.type = account.type as any;
          // institution
          createdBankAccount.institution = scopedInstitution;
        }
      });

      createdBankAccount.save().then(() => {
        if (scopedBalance && scopedAch && scopedInstitution) {
          scopedBalance.save();
          scopedAch.save();
          scopedInstitution.save();
        } else {
          throw new Error("scoped object is not defined");
        }
      });
      return {
        data: "Bank connected!",
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            message: error.message,
            path: "connectBankAccount"
          }
        ]
      };
    }
  }
}

export default ConnectBankAccountResolver;

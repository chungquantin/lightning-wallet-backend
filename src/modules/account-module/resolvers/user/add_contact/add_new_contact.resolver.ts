import { Arg, Resolver, Mutation, Ctx, UseMiddleware } from "type-graphql";
import { User } from "../../../entity";
import { AddNewContactDto } from "./add_new_contact.dto";
import { UserRepository } from "../../../repository/user/UserRepository";
import { InjectRepository } from "typeorm-typedi-extensions";
import { GQLContext } from "neutronpay-wallet-common/dist/utils/graphql-utils";
import {
  ApiResponse,
  CustomMessage
} from "neutronpay-wallet-common/dist/shared";
import { isAuth } from "neutronpay-wallet-common/dist/middleware";
import * as _ from "lodash";
import { mqProduce } from "../../../queue";
import { Queue } from "neutronpay-wallet-common/dist/constants/queue";
import { Service } from "typedi";

export const ApiAddNewContactResponse = ApiResponse<String>(
  "AddNewContact",
  String
);
export type ApiAddNewContactResponseType = InstanceType<
  typeof ApiAddNewContactResponse
>;

@Service()
@Resolver(() => User)
class AddNewContactResolver {
  @InjectRepository(UserRepository)
  private readonly userRepository: UserRepository;

  @UseMiddleware(isAuth)
  @Mutation(() => ApiAddNewContactResponse, { nullable: true })
  async addNewContact(
    @Arg("data") { userId }: AddNewContactDto,
    @Ctx() { currentUser, channel }: GQLContext
  ): Promise<ApiAddNewContactResponseType> {
    if (currentUser?.userId === userId) {
      return {
        success: false,
        errors: [
          {
            message: CustomMessage.stopBeingNaughty,
            path: "userId"
          }
        ]
      };
    }
    const user = await this.userRepository.findOne({
      where: {
        id: currentUser?.userId
      },
      relations: ["contacts"]
    });

    const contact = await this.userRepository.findOne({
      where: {
        id: userId
      }
    });

    if (!user || !contact) {
      return {
        success: false,
        errors: [
          {
            message: CustomMessage.userIsNotFound,
            path: !user ? "currentUser" : "userId"
          }
        ]
      };
    }

    if (user.contacts.some(c => c.id === contact.id)) {
      return {
        success: false,
        errors: [
          {
            message: CustomMessage.contactWasAdded,
            path: "userId"
          }
        ]
      };
    }

    // Update user contacts
    this.userRepository.addContact(user, contact);

    mqProduce<"new_contact_added">(channel, Queue.NOTIFICATION_QUEUE, {
      data: {
        contactId: contact.id,
        userId: user.id
      },
      operation: "new_contact_added"
    });

    return {
      success: true,
      data: "Contact is added successfully"
    };
  }
}

export default AddNewContactResolver;

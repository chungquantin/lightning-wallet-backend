import { EntityRepository, Repository } from 'typeorm';
import { User } from '../../entity/User';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
	async findByEmail(email: string | undefined) {
		return await this.findOne({ where: { email } });
	}

	async findByPhoneNumber(phoneNumber: string | undefined) {
		return await this.findOne({
			where: {
				phoneNumber,
			},
		});
	}

	addContact(user: User, contact: User) {
		if (user.contacts) {
			user.contacts.push(contact);
		} else {
			user.contacts = [];
			user.contacts.push(contact);
		}
		user.save();
	}

	async resolveUserReference(
		reference: Pick<User, 'id'>,
	): Promise<User | undefined> {
		return this.findOne({
			where: {
				id: reference.id,
			},
		})!;
	}
}

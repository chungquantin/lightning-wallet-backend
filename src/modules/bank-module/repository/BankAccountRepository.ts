import { EntityRepository, Repository } from 'typeorm';
import { BankAccount } from '../entity';

@EntityRepository(BankAccount)
export class BankAccountRepository extends Repository<BankAccount> {}

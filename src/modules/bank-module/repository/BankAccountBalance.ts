import { EntityRepository, Repository } from 'typeorm';
import { BankAccountBalance } from '../entity';

@EntityRepository(BankAccountBalance)
export class BankAccountBalanceRepository extends Repository<BankAccountBalance> {}

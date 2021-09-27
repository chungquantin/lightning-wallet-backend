import { EntityRepository, Repository } from 'typeorm';
import { BankAccountAch } from '../entity';

@EntityRepository(BankAccountAch)
export class BankAccountAchRepository extends Repository<BankAccountAch> {}

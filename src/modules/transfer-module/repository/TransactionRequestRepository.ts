import { EntityRepository, Repository } from 'typeorm';
import { TransactionRequest } from '../entity/TransactionRequest';

@EntityRepository(TransactionRequest)
export class TransactionRequestRepository extends Repository<TransactionRequest> {}

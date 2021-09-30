import { EntityRepository, Repository } from 'typeorm';
import { ChainInvoice } from '../entity';

@EntityRepository(ChainInvoice)
export class ChainInvoiceRepository extends Repository<ChainInvoice> {}

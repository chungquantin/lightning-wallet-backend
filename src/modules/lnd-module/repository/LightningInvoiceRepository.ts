import { EntityRepository, Repository } from 'typeorm';
import { LightningInvoice } from '../entity';

@EntityRepository(LightningInvoice)
export class LightningInvoiceRepository extends Repository<LightningInvoice> {}

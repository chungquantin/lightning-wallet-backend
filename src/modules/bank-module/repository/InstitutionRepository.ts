import { EntityRepository, Repository } from 'typeorm';
import { Institution } from '../entity';

@EntityRepository(Institution)
export class InstitutionRepository extends Repository<Institution> {}

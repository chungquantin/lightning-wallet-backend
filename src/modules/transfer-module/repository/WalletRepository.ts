import { EntityRepository, Repository } from 'typeorm';
import { Transaction } from '../entity/Transaction';
import { Wallet } from '../entity/Wallet';

@EntityRepository(Wallet)
export class WalletRepository extends Repository<Wallet> {
	addTransaction(wallet: Wallet, transaction: Transaction) {
		if (wallet.transactions) {
			wallet.transactions.push(transaction);
		} else {
			wallet.transactions = [];
			wallet.transactions.push(transaction);
		}
	}
}

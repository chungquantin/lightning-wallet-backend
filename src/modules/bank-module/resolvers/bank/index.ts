/** Queries */
export { default as GetBankAccount } from './get_bank_account/get_bank_account.resolver';
export { default as GetBankAccounts } from './get_bank_accounts/get_bank_accounts.resolver';
export { default as GetMyBankAccounts } from './get_my_bank_accounts/get_my_bank_accounts.resolver';
export { default as GetBankTransfers } from './get_bank_transfers/get_bank_transfers.resolver';
export { default as GetBankTransfer } from './get_bank_transfer/get_bank_transfer.resolver';
export { default as GetInstitutions } from './get_institutions/get_institutions.resolver';
export { default as GetInstitution } from './get_institution/get_institution.resolver';
/** Mutations */
export { default as Deposit } from './deposit/deposit.resolver';
export { default as Withdraw } from './withdraw/withdraw.resolver';
export { default as ConnectBankAccount } from './connect_bank_account/connect_bank_account.resolver';
export { default as ConnectDebitCard } from './connect_debit_card/connect_debit_card.resolver';
export { default as DeleteBankAccount } from './delete_bank_account/delete_bank_account.resolver';

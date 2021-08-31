export enum CustomMessage {
	walletIsNotFound = 'Wallet is not found',
	walletIsCreatedAlready = 'Wallet was created for this user',
	walletDontHaveEnoughBalance = "Wallet don't have enough balance",
	amountIsNotValid = 'Amount is not valid',
	transactionNotFound = 'Transaction is not found',
	transactionRequestNotFound = 'Request is not found',
	thisRequestIsNotForYou = 'This request is not for you',
	cannotCreateTransaction = "Can't creat a transaction",
	transactionIsExpired = 'Transaction is expired',
	transactionRequestIsConfirmedOrRejected = 'Transaction request is confirmed or rejected already',
	transactionRequestIsSent = 'Transaction request is sent already! Please cancel it before sending another request',
	transactionRequestIsCanceled = 'Transaction request is canceled already',

	stopBeingNaughty = 'Stop being naughty',
	somethingWentWrong = 'Something went wrong',
}

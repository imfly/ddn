var crypto = require("./crypto.js")
var constants = require("../constants.js")
var transactionTypes = require("../transaction-types.js")
var slots = require("../time/slots.js")
var options = require('../options')
const { Bignum } = require('@ddn/ddn-utils');

function calculateFee(amount) {
    var min = constants.fees.send;
    
    var fee = Bignum.multiply(amount, 0.0001).toFixed(0);

    if (Bignum.isLessThan(fee, min)) {
        return min;
    } else {
        return fee + "";
    }
}

async function createTransaction(recipientId, amount, message, secret, second_secret) {
	var transaction = {
		type: transactionTypes.SEND,
		nethash: options.get('nethash'),
		amount: amount + "",
		fee: constants.fees.send,
		recipient_id: recipientId,
		message: message,
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {}
	};

	var keys = crypto.getKeys(secret);
	transaction.sender_public_key = keys.public_key;

	await crypto.sign(transaction, keys);

	if (second_secret) {
		var secondKeys = crypto.getKeys(second_secret);
		await crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = await crypto.getId(transaction);
	return transaction;
}

async function createLock(height, secret, second_secret) {
	var transaction = {
		type: 100,
		amount: "0",    
		nethash: options.get('nethash'),
		fee: "10000000",    
		recipient_id: null,
		args: [ String(height) ],
		timestamp: slots.getTime() - options.get('clientDriftSeconds'),
		asset: {}
	};

	var keys = crypto.getKeys(secret);
	transaction.sender_public_key = keys.public_key;

	await crypto.sign(transaction, keys);

	if (second_secret) {
		var secondKeys = crypto.getKeys(second_secret);
		await crypto.secondSign(transaction, secondKeys);
	}

	transaction.id = await crypto.getId(transaction);
	return transaction;
}

module.exports = {
	createTransaction: createTransaction,
	calculateFee: calculateFee,
	createLock: createLock
}
package com.example.budgettracker.sms

import javax.inject.Inject
import javax.inject.Singleton

data class ParsedTx(val amount: Long, val merchant: String, val cardName: String?)

@Singleton
class SmsParser @Inject constructor() {

    private val amountRegex = Regex("([0-9,]+)\\s*원")
    private val cardRegex = Regex("\\[(.*?)카드.*?\\]")

    fun parse(body: String): ParsedTx? {
        val amount = amountRegex.find(body)
            ?.groupValues?.get(1)?.replace(",", "")?.toLongOrNull() ?: return null
        val merchant = extractMerchant(body) ?: return null
        val card = cardRegex.find(body)?.groupValues?.get(1)
        return ParsedTx(amount, merchant, card)
    }

    private fun extractMerchant(body: String): String? {
        // Heuristic: after "승인" keyword
        val approveIdx = body.indexOf("승인")
        if (approveIdx < 0) return null
        val tail = body.substring(approveIdx + 2)
            .lines().firstOrNull()?.trim() ?: return null
        return tail.takeIf { it.isNotBlank() }
    }
}

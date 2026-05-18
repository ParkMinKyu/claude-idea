package com.example.receiptscanner.data

import javax.inject.Inject
import javax.inject.Singleton

data class ParsedReceipt(val merchant: String, val amount: Long, val date: String?)

@Singleton
class ReceiptParser @Inject constructor() {

    private val totalRegex = Regex("(?:합계|총액|TOTAL)\\s*[:：]?\\s*([0-9,]+)")
    private val dateRegex = Regex("(20\\d{2})[./-](\\d{1,2})[./-](\\d{1,2})")

    fun parse(text: String): ParsedReceipt? {
        if (text.isBlank()) return null
        val merchant = text.lines().firstOrNull { it.isNotBlank() }?.trim() ?: return null
        val amount = totalRegex.find(text)
            ?.groupValues?.get(1)?.replace(",", "")?.toLongOrNull() ?: return null
        val date = dateRegex.find(text)?.let {
            val (_, y, m, d) = it.groupValues
            "%s-%02d-%02d".format(y, m.toInt(), d.toInt())
        }
        return ParsedReceipt(merchant, amount, date)
    }
}

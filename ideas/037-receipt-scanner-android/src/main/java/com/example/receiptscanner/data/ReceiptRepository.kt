package com.example.receiptscanner.data

import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReceiptRepository @Inject constructor(
    private val dao: ReceiptDao,
    private val parser: ReceiptParser
) {
    fun observeReceipts(): Flow<List<Receipt>> = dao.observeAll()

    suspend fun saveFromOcr(rawText: String, imagePath: String, tag: String? = null): Long? {
        val parsed = parser.parse(rawText) ?: return null
        return dao.insert(Receipt(
            merchant = parsed.merchant,
            amount = parsed.amount,
            date = parsed.date ?: today(),
            imagePath = imagePath,
            tag = tag,
            rawText = rawText
        ))
    }

    suspend fun search(query: String): List<Receipt> =
        if (query.isBlank()) emptyList() else dao.search(query.trim())

    suspend fun totalThisMonth(): Long {
        val prefix = SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(Date())
        return dao.totalForMonth(prefix)
    }

    private fun today(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
}

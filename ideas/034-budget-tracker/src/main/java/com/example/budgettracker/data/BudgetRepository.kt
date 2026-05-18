package com.example.budgettracker.data

import com.example.budgettracker.sms.SmsParser
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BudgetRepository @Inject constructor(
    private val dao: TransactionDao,
    private val parser: SmsParser,
    private val classifier: CategoryClassifier
) {
    fun observeTransactions(): Flow<List<Transaction>> = dao.observeAll()

    suspend fun addManual(amount: Long, merchant: String, category: String): Long {
        return dao.insert(Transaction(amount = amount, merchant = merchant,
            category = category, date = today(), source = "manual"))
    }

    suspend fun ingestSms(body: String): Long? {
        val parsed = parser.parse(body) ?: return null
        val category = classifier.classify(parsed.merchant)
        return dao.insert(Transaction(amount = parsed.amount, merchant = parsed.merchant,
            category = category, date = today(), source = "sms"))
    }

    suspend fun monthlySummary(): List<CategoryTotal> {
        val prefix = SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(Date())
        return dao.monthlyByCategory(prefix)
    }

    private fun today(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
}

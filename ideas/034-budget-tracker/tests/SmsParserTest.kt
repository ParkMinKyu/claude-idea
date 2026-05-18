package com.example.budgettracker

import com.example.budgettracker.data.BudgetRepository
import com.example.budgettracker.data.CategoryClassifier
import com.example.budgettracker.data.TransactionDao
import com.example.budgettracker.sms.SmsParser
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class SmsParserTest {

    private val parser = SmsParser()

    @Test
    fun `parse extracts amount and merchant from KB Kookmin format`() {
        val body = "[KB국민카드] 승인\n스타벅스\n12,500원\n2026/05/18 13:24"
        val parsed = parser.parse(body)
        assertNotNull(parsed)
        assertEquals(12500L, parsed.amount)
        assertEquals("스타벅스", parsed.merchant)
    }

    @Test
    fun `parse returns null when no amount`() {
        assertNull(parser.parse("아무 의미 없는 메시지"))
    }
}

class BudgetRepositoryTest {

    private val dao = mockk<TransactionDao>(relaxed = true)
    private val parser = SmsParser()
    private val classifier = CategoryClassifier()
    private val repo = BudgetRepository(dao, parser, classifier)

    @Test
    fun `ingestSms classifies merchant and inserts`() = runTest {
        coEvery { dao.insert(any()) } returns 1L
        val id = repo.ingestSms("[신한카드] 승인\n스타벅스\n5,500원")
        assertEquals(1L, id)
        coVerify { dao.insert(match { it.category == "카페" && it.amount == 5500L }) }
    }
}

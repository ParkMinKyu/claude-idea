package com.example.receiptscanner

import com.example.receiptscanner.data.ReceiptParser
import com.example.receiptscanner.data.ReceiptDao
import com.example.receiptscanner.data.ReceiptRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class ReceiptParserTest {
    private val parser = ReceiptParser()

    @Test
    fun `parse extracts merchant amount and date`() {
        val text = """
            스타벅스 강남R점
            아이스 아메리카노 1
            합계: 4,500
            2026-05-18
        """.trimIndent()
        val r = parser.parse(text)
        assertNotNull(r)
        assertEquals("스타벅스 강남R점", r.merchant)
        assertEquals(4500L, r.amount)
        assertEquals("2026-05-18", r.date)
    }

    @Test
    fun `parse returns null without amount`() {
        assertNull(parser.parse("blank text"))
    }
}

class ReceiptRepositoryTest {
    private val dao = mockk<ReceiptDao>(relaxed = true)
    private val parser = ReceiptParser()
    private val repo = ReceiptRepository(dao, parser)

    @Test
    fun `saveFromOcr returns null on unparseable text`() = runTest {
        val id = repo.saveFromOcr("garbage", "/tmp/x.jpg")
        assertNull(id)
    }

    @Test
    fun `saveFromOcr inserts on valid text`() = runTest {
        coEvery { dao.insert(any()) } returns 11L
        val text = "이마트 트레이더스\n합계 22,500\n2026-05-01"
        val id = repo.saveFromOcr(text, "/tmp/y.jpg")
        assertEquals(11L, id)
        coVerify { dao.insert(match { it.amount == 22500L }) }
    }
}

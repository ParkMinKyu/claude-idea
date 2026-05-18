package com.example.periodtracker

import com.example.periodtracker.data.CycleDao
import com.example.periodtracker.data.CycleEntry
import com.example.periodtracker.data.CycleRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class CycleRepositoryTest {

    private val dao = mockk<CycleDao>(relaxed = true)
    private val repo = CycleRepository(dao)

    @Test
    fun `predictNextStart returns null with less than 2 entries`() = runTest {
        coEvery { dao.lastN(any()) } returns listOf(
            CycleEntry(startDate = "2026-04-10")
        )
        assertNull(repo.predictNextStart())
    }

    @Test
    fun `predictNextStart averages gaps`() = runTest {
        coEvery { dao.lastN(any()) } returns listOf(
            CycleEntry(startDate = "2026-01-01"),
            CycleEntry(startDate = "2026-01-29"), // 28 day gap
            CycleEntry(startDate = "2026-02-26"), // 28 day gap
        )
        val next = repo.predictNextStart()
        assertNotNull(next)
        assertEquals(LocalDate.of(2026, 3, 26), next)
    }

    @Test
    fun `averageCycleLength defaults to 28 with insufficient data`() = runTest {
        coEvery { dao.lastN(any()) } returns emptyList()
        assertEquals(28.0, repo.averageCycleLength(), 0.001)
    }
}

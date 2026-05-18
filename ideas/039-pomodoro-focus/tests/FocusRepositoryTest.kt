package com.example.pomodorofocus

import com.example.pomodorofocus.data.FocusDao
import com.example.pomodorofocus.data.FocusRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class FocusRepositoryTest {

    private val dao = mockk<FocusDao>(relaxed = true)
    private val repo = FocusRepository(dao)

    @Test
    fun `completeSession rejects out-of-range durations`() = runTest {
        assertFailsWith<IllegalArgumentException> { repo.completeSession(0) }
        assertFailsWith<IllegalArgumentException> { repo.completeSession(241) }
    }

    @Test
    fun `completeSession inserts session marked completed`() = runTest {
        coEvery { dao.insert(any()) } returns 1L
        repo.completeSession(25, "study")
        coVerify { dao.insert(match { it.completed && it.durationMin == 25 && it.tag == "study" }) }
    }

    @Test
    fun `cancelSession inserts session marked incomplete`() = runTest {
        coEvery { dao.insert(any()) } returns 2L
        repo.cancelSession(7)
        coVerify { dao.insert(match { !it.completed && it.durationMin == 7 }) }
    }

    @Test
    fun `totalToday uses day boundary`() = runTest {
        coEvery { dao.totalSince(any()) } returns 75
        assertEquals(75, repo.totalToday())
    }
}

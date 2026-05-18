package com.example.sleeptracker

import com.example.sleeptracker.data.MovementEvent
import com.example.sleeptracker.data.SleepDao
import com.example.sleeptracker.data.SleepRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SleepRepositoryTest {

    private val dao = mockk<SleepDao>(relaxed = true)
    private val repo = SleepRepository(dao)

    @Test
    fun `classifyStages returns zeros on empty input`() {
        val result = repo.classifyStages(emptyList())
        assertEquals(0, result["deep"])
        assertEquals(0, result["awake"])
    }

    @Test
    fun `classifyStages buckets by 5min window`() {
        val now = 1_700_000_000_000L
        val events = (0..9).map {
            MovementEvent(sessionId = 1, timestamp = now + it * 60_000L, magnitude = 0.1f)
        }
        val stages = repo.classifyStages(events)
        // All in deep window (magnitude < 0.5)
        assertTrue(stages["deep"]!! >= 5)
    }

    @Test
    fun `computeScore returns within 0-100`() {
        val stages = mapOf("deep" to 60, "light" to 200, "rem" to 60, "awake" to 20)
        val score = repo.computeScore(stages)
        assertTrue(score in 0..100)
    }

    @Test
    fun `startSession inserts and returns id`() = runTest {
        coEvery { dao.insertSession(any()) } returns 7L
        assertEquals(7L, repo.startSession())
    }
}

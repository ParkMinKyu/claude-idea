package com.example.moodjournal

import com.example.moodjournal.data.MoodDao
import com.example.moodjournal.data.MoodEntry
import com.example.moodjournal.data.MoodRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class MoodRepositoryTest {
    private val dao = mockk<MoodDao>(relaxed = true)
    private val repo = MoodRepository(dao)

    @Test
    fun `checkIn rejects out-of-range score`() = runTest {
        assertFailsWith<IllegalArgumentException> {
            repo.checkIn(0, emptyList())
        }
        assertFailsWith<IllegalArgumentException> {
            repo.checkIn(6, emptyList())
        }
    }

    @Test
    fun `checkIn joins tags with commas`() = runTest {
        coEvery { dao.insert(any()) } returns 1L
        repo.checkIn(4, listOf("행복", "평온"))
        coVerify { dao.insert(match { it.tags == "행복,평온" && it.score == 4 }) }
    }

    @Test
    fun `topTags counts and sorts`() = runTest {
        coEvery { dao.since(any()) } returns listOf(
            MoodEntry(score = 3, tags = "행복,평온", date = "2026-05-10"),
            MoodEntry(score = 4, tags = "행복", date = "2026-05-11"),
            MoodEntry(score = 2, tags = "불안,평온", date = "2026-05-12"),
        )
        val tags = repo.topTags()
        assertEquals("행복", tags[0].tag)
        assertEquals(2, tags[0].count)
    }

    @Test
    fun `average7Day returns 0 when null`() = runTest {
        coEvery { dao.averageSince(any()) } returns null
        assertEquals(0.0, repo.average7Day(), 0.001)
    }
}

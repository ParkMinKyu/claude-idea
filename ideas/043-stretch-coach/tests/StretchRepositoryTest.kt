package com.example.stretchcoach

import com.example.stretchcoach.data.StretchDao
import com.example.stretchcoach.data.StretchRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class StretchRepositoryTest {
    private val dao = mockk<StretchDao>(relaxed = true)
    private val repo = StretchRepository(dao)

    @Test
    fun `exercisesFor excludes premium by default`() {
        val list = repo.exercisesFor()
        assertTrue(list.none { it.premium })
    }

    @Test
    fun `exercisesFor includes premium when flagged`() {
        val list = repo.exercisesFor(includePremium = true)
        assertTrue(list.any { it.premium })
    }

    @Test
    fun `exercisesFor filters by bodyPart`() {
        val neck = repo.exercisesFor("neck")
        assertTrue(neck.all { it.bodyPart == "neck" })
    }

    @Test
    fun `recordSession inserts via dao`() = runTest {
        coEvery { dao.insert(any()) } returns 1L
        repo.recordSession("neck1")
        coVerify { dao.insert(match { it.exerciseId == "neck1" }) }
    }

    @Test
    fun `recordSession silently ignores unknown id`() = runTest {
        repo.recordSession("does-not-exist")
        coVerify(exactly = 0) { dao.insert(any()) }
    }

    @Test
    fun `todayCount delegates to dao`() = runTest {
        coEvery { dao.countSince(any()) } returns 3
        assertEquals(3, repo.todayCount())
    }
}
